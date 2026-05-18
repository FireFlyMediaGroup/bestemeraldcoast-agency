// PATCH /api/agent/leads/:id — update a lead; status changes are
// transition-validated and recorded in lead_status_history (master plan
// Commit 1.5). Field updates and a status change in one call are applied
// atomically in a transaction.

import { z } from "zod";

import { agentRoute, readJson, requireUuid } from "@/lib/agent-handler";
import {
  applyLeadTransition,
  isLeadStatus,
  isValidTransition,
} from "@/lib/lead-transitions";

const PatchLead = z.object({
  status: z.string().optional(),
  changedBy: z.string().min(1), // required: who/what is making the change
  reason: z.string().optional(),
  notes: z.string().optional(),
  mockupUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  gapScoreSnapshot: z.number().int().optional(),
  diagnosis: z.record(z.unknown()).optional(),
  offer: z.record(z.unknown()).optional(),
});

export const PATCH = agentRoute<{ id: string }>(async (req, ctx) => {
  const { id: rawId } = await ctx.params;
  const id = requireUuid(rawId);
  if (id instanceof Response) return id;

  const [body, badJson] = await readJson<unknown>(req);
  if (badJson) return badJson;

  const parsed = PatchLead.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "validation_failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;

  if (d.status !== undefined && !isLeadStatus(d.status)) {
    return Response.json({ error: "unknown_status" }, { status: 400 });
  }

  const { getDb, schema, eq } = await import("@bec/db");
  const db = getDb();

  const [lead] = await db
    .select({ id: schema.leads.id, status: schema.leads.status })
    .from(schema.leads)
    .where(eq(schema.leads.id, id));
  if (!lead) return Response.json({ error: "not_found" }, { status: 404 });

  const fields = {
    notes: d.notes,
    mockupUrl: d.mockupUrl,
    videoUrl: d.videoUrl,
    gapScoreSnapshot: d.gapScoreSnapshot,
    diagnosis: d.diagnosis,
    offer: d.offer,
  };

  if (d.status !== undefined && d.status !== lead.status) {
    // `lead.status` (from the select) is already the drizzle enum type.
    // `d.status` was narrowed to LeadStatus by isLeadStatus() above. The
    // string sets are identical (the local LeadStatus union and the pgEnum
    // union are nominally distinct to tsc); applyLeadTransition casts to the
    // `lead_status` enum at the write site.
    const from = lead.status;
    const to = d.status;
    if (
      !isValidTransition(
        from as Parameters<typeof isValidTransition>[0],
        to as Parameters<typeof isValidTransition>[1],
      )
    ) {
      return Response.json(
        { error: "invalid_transition", from, to },
        { status: 422 },
      );
    }
    // Atomic conditional transition + history insert as ONE statement (a
    // CTE). The status UPDATE is conditional on the row STILL being in
    // `from`; a concurrent transition that already moved the lead makes it
    // match 0 rows → `transitioned: false` → 409, instead of writing a
    // history row for a transition that never legitimately happened. A
    // single statement is atomic in Postgres and needs no interactive
    // transaction, so it survives the Neon fetch transport (db.transaction()
    // does NOT — PR #28 regression; see applyLeadTransition()).
    const { transitioned } = await applyLeadTransition({
      db,
      id,
      from: from as Parameters<typeof isValidTransition>[0],
      to: to as Parameters<typeof isValidTransition>[1],
      changedBy: d.changedBy,
      reason: d.reason,
      fields,
    });
    if (!transitioned) {
      return Response.json(
        { error: "status_changed_concurrently" },
        { status: 409 },
      );
    }
    return Response.json({ lead: { id, status: to }, transitioned: true });
  }

  // No status change: a plain field update is a single statement and is
  // already fetch-transport safe.
  await db
    .update(schema.leads)
    .set({
      notes: d.notes,
      mockupUrl: d.mockupUrl,
      videoUrl: d.videoUrl,
      gapScoreSnapshot: d.gapScoreSnapshot,
      diagnosis: d.diagnosis as never,
      offer: d.offer as never,
      updatedAt: new Date(),
    })
    .where(eq(schema.leads.id, id));
  return Response.json({ lead: { id, status: lead.status }, transitioned: false });
});
