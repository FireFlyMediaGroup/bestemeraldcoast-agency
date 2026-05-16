// POST /api/agent/agent-runs/:id/finalize — record cost + outcome at the
// end of an agent run (ADR-018 budget tracking).

import { z } from "zod";

import { agentRoute, readJson, requireUuid } from "@/lib/agent-handler";

const Finalize = z.object({
  status: z.enum(["succeeded", "failed", "aborted"]),
  outputSummary: z.string().optional(),
  // Metrics feed ADR-018 budget reporting — reject negatives AND
  // non-finite values (Infinity/NaN pass a bare nonnegative() check and
  // would poison cost aggregation). .int() already implies finite for the
  // token/duration fields; costUsd needs an explicit .finite().
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  cacheCreationTokens: z.number().int().nonnegative().optional(),
  cacheReadTokens: z.number().int().nonnegative().optional(),
  costUsd: z.number().finite().nonnegative().optional(),
  durationMs: z.number().int().nonnegative().optional(),
  error: z.string().optional(),
});

export const POST = agentRoute(async (req, ctx) => {
  const { id: rawId } = await ctx.params;
  const id = requireUuid(rawId);
  if (id instanceof Response) return id;

  const [body, badJson] = await readJson<unknown>(req);
  if (badJson) return badJson;

  const parsed = Finalize.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "validation_failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const f = parsed.data;

  const { getDb, schema, and, eq } = await import("@bec/db");
  const db = getDb();

  // Finalize only a run that is still `running`. Keying by id alone would
  // let a repeated /finalize silently overwrite a terminal run's cost +
  // outcome (corrupting ADR-018 budget reporting). The status guard makes
  // finalize idempotent-safe: the first call wins, repeats hit 0 rows → 409.
  const updated = await db
    .update(schema.agentRuns)
    .set({
      status: f.status,
      outputSummary: f.outputSummary,
      inputTokens: f.inputTokens,
      outputTokens: f.outputTokens,
      cacheCreationTokens: f.cacheCreationTokens,
      cacheReadTokens: f.cacheReadTokens,
      costUsd: f.costUsd?.toString(),
      durationMs: f.durationMs,
      error: f.error,
      endedAt: new Date(),
    })
    .where(and(eq(schema.agentRuns.id, id), eq(schema.agentRuns.status, "running")))
    .returning({ id: schema.agentRuns.id });

  if (updated.length === 0) {
    // Distinguish unknown run (404) from already-finalized (409).
    const [run] = await db
      .select({ status: schema.agentRuns.status })
      .from(schema.agentRuns)
      .where(eq(schema.agentRuns.id, id));
    if (!run) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json(
      { error: "already_finalized", status: run.status },
      { status: 409 },
    );
  }
  return Response.json({ agentRun: { id, status: f.status } });
});
