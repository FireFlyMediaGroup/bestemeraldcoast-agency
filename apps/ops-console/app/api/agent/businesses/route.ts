// POST /api/agent/businesses — upsert a business by googlePlaceId.
//
// Scout/Diagnoser call this repeatedly for the same place; the natural key
// is googlePlaceId (unique in schema). onConflictDoUpdate makes the call
// idempotent and lets enrichment overwrite the mutable fields.

import { z } from "zod";

import { agentRoute, readJson } from "@/lib/agent-handler";

const UpsertBusiness = z.object({
  googlePlaceId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  niche: z.string().min(1),
  city: z.string().min(1),
  primarySiteId: z.string().uuid().optional(),
  rating: z.number().optional(),
  reviewCount: z.number().int().optional(),
  websiteUrl: z.string().url().optional(),
  websiteStatus: z.enum(["none", "outdated", "modern"]).optional(),
  editorialSummary: z.string().optional(),
});

export const POST = agentRoute(async (req) => {
  const [body, badJson] = await readJson<unknown>(req);
  if (badJson) return badJson;

  const parsed = UpsertBusiness.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "validation_failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const b = parsed.data;

  const { getDb, schema } = await import("@bec/db");
  const db = getDb();

  const [row] = await db
    .insert(schema.businesses)
    .values({
      googlePlaceId: b.googlePlaceId,
      slug: b.slug,
      name: b.name,
      niche: b.niche,
      city: b.city,
      primarySiteId: b.primarySiteId,
      rating: b.rating?.toString(),
      reviewCount: b.reviewCount,
      websiteUrl: b.websiteUrl,
      websiteStatus: b.websiteStatus,
      editorialSummary: b.editorialSummary,
      lastEnrichedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.businesses.googlePlaceId,
      set: {
        name: b.name,
        niche: b.niche,
        city: b.city,
        rating: b.rating?.toString(),
        reviewCount: b.reviewCount,
        websiteUrl: b.websiteUrl,
        websiteStatus: b.websiteStatus,
        editorialSummary: b.editorialSummary,
        lastEnrichedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning({ id: schema.businesses.id, slug: schema.businesses.slug });

  return Response.json({ business: row });
});
