// PATCH /api/agent/leads/:id — update a lead; status changes are
// transition-validated and recorded in lead_status_history (master plan
// Commit 1.5). Field updates and a status change in one call are applied
// atomically in a transaction.

import { z } from "zod";

import { agentRoute, readJson, requireUuid } from "@/lib/agent-handler";
import { isLeadStatus, isValidTransition } from "@/lib/lead-transitions";

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

  const fieldUpdate = {
    notes: d.notes,
    mockupUrl: d.mockupUrl,
    videoUrl: d.videoUrl,
    gapScoreSnapshot: d.gapScoreSnapshot,
    diagnosis: d.diagnosis as never,
    offer: d.offer as never,
    updatedAt: new Date(),
  };

  if (d.status !== undefined && d.status !== lead.status) {
    // `lead.status` (from the select) is already the drizzle enum type.
    // `d.status` was narrowed to LeadStatus by isLeadStatus() above. The
    // string sets are identical; cast to the schema enum type at the write
    // sites so drizzle's column types line up (the local LeadStatus union
    // and the pgEnum union are nominally distinct to tsc).
    type StatusCol = (typeof schema.leadStatus.enumValues)[number];
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
    // Critical: the status update is conditional on the row STILL being in
    // `from` (the value we validated against). A concurrent transition that
    // already moved the lead makes this UPDATE affect 0 rows → we abort the
    // transaction and 409, instead of writing a history row for a
    // transition that never legitimately happened (read-validate-write is
    // now atomic at the DB, not just within the JS function).
    const { and } = await import("@bec/db");
    let raced = false;
    await db.transaction(async (tx) => {
      const moved = await tx
        .update(schema.leads)
        .set({ ...fieldUpdate, status: to as StatusCol })
        .where(
          and(eq(schema.leads.id, id), eq(schema.leads.status, from as StatusCol)),
        )
        .returning({ id: schema.leads.id });
      if (moved.length === 0) {
        raced = true;
        return;
      }
      await tx.insert(schema.leadStatusHistory).values({
        leadId: id,
        fromStatus: from as StatusCol,
        toStatus: to as StatusCol,
        changedBy: d.changedBy,
        reason: d.reason,
      });
    });
    if (raced) {
      return Response.json(
        { error: "status_changed_concurrently" },
        { status: 409 },
      );
    }
    return Response.json({ lead: { id, status: to }, transitioned: true });
  }

  await db.update(schema.leads).set(fieldUpdate).where(eq(schema.leads.id, id));
  return Response.json({ lead: { id, status: lead.status }, transitioned: false });
});
