// POST /api/agent/leads/:id/release — release a lead lock.
//
// Only the current lock holder may release (conditional UPDATE on
// `locked_by = ?`). Releasing a lock you don't hold → 409; unknown lead
// → 404. Atomic, same single-statement pattern as acquire.

import { z } from "zod";

import { agentRoute, readJson, requireUuid } from "@/lib/agent-handler";

const Release = z.object({ lockedBy: z.string().min(1) });

export const POST = agentRoute<{ id: string }>(async (req, ctx) => {
  const { id: rawId } = await ctx.params;
  const id = requireUuid(rawId);
  if (id instanceof Response) return id;

  const [body, badJson] = await readJson<unknown>(req);
  if (badJson) return badJson;

  const parsed = Release.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "validation_failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { getDb, schema, and, eq } = await import("@bec/db");
  const db = getDb();

  const released = await db
    .update(schema.leads)
    .set({ lockedBy: null, lockedAt: null })
    .where(
      and(eq(schema.leads.id, id), eq(schema.leads.lockedBy, parsed.data.lockedBy)),
    )
    .returning({ id: schema.leads.id });

  if (released.length > 0) {
    return Response.json({ released: true, leadId: id });
  }

  const [lead] = await db
    .select({ id: schema.leads.id })
    .from(schema.leads)
    .where(eq(schema.leads.id, id));
  if (!lead) return Response.json({ error: "not_found" }, { status: 404 });
  // Never echo lockedBy: it's exactly the value a caller must present to
  // pass the ownership check, so returning it defeats the guard.
  return Response.json({ error: "not_lock_holder" }, { status: 409 });
});
