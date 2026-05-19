// Article publish (operator action, editorial composer — Commit 2.7).
// Mirrors lib/lead-transitions.ts: one ATOMIC CTE, never `db.transaction()`
// (Neon fetch transport — PR #28/#36 lesson). Publishing also writes the
// ADR-020 `editorial_feedback` row (draft→final training data) in the SAME
// statement, so a publish can never land without its feedback row and
// vice-versa.

export const ARTICLE_STATUSES = [
  "draft",
  "review",
  "scheduled",
  "published",
  "archived",
] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export function isArticleStatus(v: unknown): v is ArticleStatus {
  return (
    typeof v === "string" && (ARTICLE_STATUSES as readonly string[]).includes(v)
  );
}

/**
 * Publish an article and record ADR-020 feedback, atomically.
 *
 * `cur` snapshots the row as it was BEFORE the UPDATE (all CTE branches share
 * the statement-start snapshot), so `editorial_feedback.draft_body` is the
 * Editor's verbatim first draft (`original_draft_body`, fallback to the
 * pre-edit body) and `final_body` is what the operator is publishing — the
 * real diff ADR-020 trains on.
 *
 * Race-safe: the UPDATE only fires when the row is still in a pre-publish
 * state (`draft`/`review`/`scheduled`). An already-published (or concurrently
 * published) article matches 0 rows → no feedback row → `published: false`
 * → caller returns 409 instead of writing a duplicate feedback row.
 *
 * `editsSummary` is the optional operator note from the "Publish + Note
 * feedback" button (ADR-020); plain "Publish" passes it undefined. The
 * feedback row is written either way (ADR-020 requires it on every publish).
 */
export async function publishArticle(opts: {
  db: import("@bec/db").Database;
  id: string;
  /** The body being published (operator's possibly-edited markdown). */
  finalBodyMdx: string;
  editsSummary?: string | null;
  /** Editor prompt version if known (ADR-019/020 link); else null. */
  promptVersion?: number | null;
}): Promise<{ published: boolean }> {
  const { db, id, finalBodyMdx, editsSummary, promptVersion } = opts;
  const { sql } = await import("@bec/db");

  const stmt = sql`
    WITH cur AS (
      SELECT id, COALESCE(original_draft_body, body_mdx) AS draft_body
        FROM articles
       WHERE id = ${id}::uuid
    ),
    pub AS (
      UPDATE articles
         SET status = 'published'::article_status,
             body_mdx = ${finalBodyMdx},
             published_at = now(),
             updated_at = now()
       WHERE id = ${id}::uuid
         AND status IN ('draft','review','scheduled')
      RETURNING id
    )
    INSERT INTO editorial_feedback
      (article_id, draft_body, final_body, edits_summary, prompt_version)
    SELECT pub.id, cur.draft_body, ${finalBodyMdx},
           ${editsSummary ?? null}, ${promptVersion ?? null}
      FROM pub JOIN cur ON cur.id = pub.id
    RETURNING article_id
  `;

  const res = await db.execute(stmt);
  const rows = Array.isArray(res)
    ? res
    : ((res as { rows?: unknown[] } | null)?.rows ?? []);
  return { published: rows.length > 0 };
}
