// POST /api/agent/agent-runs/:id/finalize — record cost + outcome at the
// end of an agent run (ADR-018 budget tracking).

import { z } from "zod";

import { agentRoute, readJson } from "@/lib/agent-handler";

const Finalize = z.object({
  status: z.enum(["succeeded", "failed", "aborted"]),
  outputSummary: z.string().optional(),
  inputTokens: z.number().int().optional(),
  outputTokens: z.number().int().optional(),
  cacheCreationTokens: z.number().int().optional(),
  cacheReadTokens: z.number().int().optional(),
  costUsd: z.number().optional(),
  durationMs: z.number().int().optional(),
  error: z.string().optional(),
});

export const POST = agentRoute(async (req, ctx) => {
  const { id } = await ctx.params;
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

  const { getDb, schema, eq } = await import("@bec/db");
  const db = getDb();

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
    .where(eq(schema.agentRuns.id, id))
    .returning({ id: schema.agentRuns.id });

  if (updated.length === 0) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json({ agentRun: { id, status: f.status } });
});
