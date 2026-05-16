// POST /api/agent/leads — create a lead (agent-only).

import { z } from "zod";

import { agentRoute, readJson } from "@/lib/agent-handler";

const CreateLead = z.object({
  businessId: z.string().uuid(),
  notes: z.string().optional(),
  gapScoreSnapshot: z.number().int().optional(),
  scoringVersion: z.number().int().optional(),
  // diagnosis/offer are agent-shaped jsonb; accept as opaque objects here.
  diagnosis: z.record(z.unknown()).optional(),
  offer: z.record(z.unknown()).optional(),
});

export const POST = agentRoute(async (req) => {
  const [body, badJson] = await readJson<unknown>(req);
  if (badJson) return badJson;

  const parsed = CreateLead.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "validation_failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { getDb, schema } = await import("@bec/db");
  const db = getDb();
  const [row] = await db
    .insert(schema.leads)
    .values({
      businessId: parsed.data.businessId,
      notes: parsed.data.notes,
      gapScoreSnapshot: parsed.data.gapScoreSnapshot,
      scoringVersion: parsed.data.scoringVersion,
      // Cast: jsonb $type<Diagnosis>/<Offer> — agent owns the payload shape;
      // the column type is the compile-time contract for readers.
      diagnosis: parsed.data.diagnosis as never,
      offer: parsed.data.offer as never,
    })
    .returning({ id: schema.leads.id, status: schema.leads.status });

  return Response.json({ lead: row }, { status: 201 });
});
