// POST /api/agent/articles — the Editor agent creates a DRAFT article
// (Commit 2.6). Per ADR-003 agents never write Postgres directly; this is
// the only article-create mutation path (Bearer AGENT_API_KEY via
// agentRoute). Status is server-forced to `draft` — publish is an operator
// action through the editorial composer (Commit 2.7), never the agent.
//
// The article row + its `article_businesses` join rows are written as ONE
// atomic CTE statement (not `db.transaction()`, which does not survive the
// Neon fetch transport — PR #36 lesson; same technique as
// lib/lead-transitions.ts). Slug is unique per site: a collision is a real
// error, so ON CONFLICT DO NOTHING → empty result → 409 (never silently
// overwrite an existing draft).

import { z } from "zod";

import { agentRoute, readJson } from "@/lib/agent-handler";

const CONTENT_TYPES = [
  "listicle",
  "profile",
  "guide",
  "event_coverage",
  "news",
  "sponsored",
  "evergreen",
] as const;

const CreateArticle = z.object({
  siteId: z.string().uuid(),
  slug: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  bodyMdx: z.string().min(1),
  /** Editor's first draft preserved verbatim (ADR-020). Defaults to bodyMdx. */
  originalDraftBody: z.string().optional(),
  contentType: z.enum(CONTENT_TYPES).default("listicle"),
  authorId: z.string().uuid().optional(),
  reviewedById: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  /** Businesses to feature (article_businesses); rank orders them. */
  businesses: z
    .array(
      z.object({
        businessId: z.string().uuid(),
        rank: z.number().int().nonnegative().optional(),
      }),
    )
    .optional(),
});

export const POST = agentRoute(async (req) => {
  const [body, badJson] = await readJson<unknown>(req);
  if (badJson) return badJson;

  const parsed = CreateArticle.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "validation_failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const a = parsed.data;

  const { getDb, sql } = await import("@bec/db");
  const db = getDb();

  const businessesJson = JSON.stringify(
    (a.businesses ?? []).map((b) => ({
      business_id: b.businessId,
      rank: b.rank ?? null,
    })),
  );

  // One statement: insert the draft, then fan its businesses in from the
  // returned id. If the slug collides, `ins` is empty → no joins, empty
  // result → 409. jsonb_to_recordset('[]') yields 0 rows, so "no
  // businesses" is handled by the same path.
  const stmt = sql`
    WITH ins AS (
      INSERT INTO articles (
        site_id, slug, title, subtitle, body_mdx, original_draft_body,
        status, content_type, author_id, reviewed_by_id, category_id, tags
      )
      VALUES (
        ${a.siteId}::uuid, ${a.slug}, ${a.title}, ${a.subtitle ?? null},
        ${a.bodyMdx}, ${a.originalDraftBody ?? a.bodyMdx},
        'draft'::article_status, ${a.contentType}::content_type,
        ${a.authorId ?? null}::uuid, ${a.reviewedById ?? null}::uuid,
        ${a.categoryId ?? null}::uuid,
        ${a.tags ? JSON.stringify(a.tags) : null}::jsonb
      )
      ON CONFLICT (site_id, slug) DO NOTHING
      RETURNING id, slug
    ),
    bj AS (
      INSERT INTO article_businesses (article_id, business_id, rank)
      SELECT ins.id, x.business_id, x.rank
        FROM ins
        CROSS JOIN jsonb_to_recordset(${businessesJson}::jsonb)
          AS x(business_id uuid, rank int)
      RETURNING 1
    )
    SELECT id, slug FROM ins
  `;

  const res: unknown = await db.execute(stmt);
  const rows = Array.isArray(res)
    ? (res as Array<{ id: string; slug: string }>)
    : ((res as { rows?: Array<{ id: string; slug: string }> }).rows ?? []);

  if (rows.length === 0) {
    return Response.json(
      { error: "slug_conflict", siteId: a.siteId, slug: a.slug },
      { status: 409 },
    );
  }

  return Response.json({ article: rows[0] }, { status: 201 });
});
