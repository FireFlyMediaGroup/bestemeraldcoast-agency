// POST /api/agent/leads/:id/lock — acquire an exclusive lead lock.
//
// Exclusivity is enforced atomically by a single conditional UPDATE
// (`WHERE id = ? AND locked_by IS NULL`). Concurrent acquirers race on one
// SQL statement: exactly one updates a row, the rest update zero → 409.
// No application-level read-then-write window, so it's correct under
// concurrency (master plan acceptance: "concurrent requests get 409").

import { z } from "zod";

import { agentRoute, readJson, requireUuid } from "@/lib/agent-handler";

const Lock = z.object({ lockedBy: z.string().min(1) });

export const POST = agentRoute(async (req, ctx) => {
  const { id: rawId } = await ctx.params;
  const id = requireUuid(rawId);
  if (id instanceof Response) return id;

  const [body, badJson] = await readJson<unknown>(req);
  if (badJson) return badJson;

  const parsed = Lock.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "validation_failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { getDb, schema, and, eq, isNull } = await import("@bec/db");
  const db = getDb();

  const acquired = await db
    .update(schema.leads)
    .set({ lockedBy: parsed.data.lockedBy, lockedAt: new Date() })
    .where(and(eq(schema.leads.id, id), isNull(schema.leads.lockedBy)))
    .returning({ id: schema.leads.id });

  if (acquired.length > 0) {
    // Don't reflect lockedBy even on success — it's the token a caller must
    // present to /release; keep it out of all responses for consistency.
    return Response.json({ locked: true, leadId: id });
  }

  // Zero rows updated: either the lead doesn't exist (404) or it's already
  // locked (409). One follow-up read distinguishes — and since lock state
  // only moves locked→unlocked via an explicit release, this is not a TOCTOU
  // risk for the 404/409 *classification* (the acquire itself was atomic).
  const [lead] = await db
    .select({ id: schema.leads.id })
    .from(schema.leads)
    .where(eq(schema.leads.id, id));
  if (!lead) return Response.json({ error: "not_found" }, { status: 404 });
  // Don't echo lockedBy — the holder token is the value an attacker needs
  // to call /release; keep it out of error responses (parallels the
  // release-route 409).
  return Response.json({ error: "already_locked" }, { status: 409 });
});
