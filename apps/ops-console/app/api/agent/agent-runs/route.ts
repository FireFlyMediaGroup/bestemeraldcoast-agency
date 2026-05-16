// POST /api/agent/agent-runs — record the start of an agent run (ADR-018).
// The agent calls /finalize later with cost + outcome.

import { z } from "zod";

import { agentRoute, readJson } from "@/lib/agent-handler";

const StartRun = z.object({
  agentName: z.string().min(1),
  invokedBy: z.string().min(1),
  promptVersion: z.number().int().optional(),
  inputLeadIds: z.array(z.string().uuid()).optional(),
});

export const POST = agentRoute(async (req) => {
  const [body, badJson] = await readJson<unknown>(req);
  if (badJson) return badJson;

  const parsed = StartRun.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "validation_failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { getDb, schema } = await import("@bec/db");
  const db = getDb();
  const [row] = await db
    .insert(schema.agentRuns)
    .values({
      agentName: parsed.data.agentName,
      invokedBy: parsed.data.invokedBy,
      promptVersion: parsed.data.promptVersion,
      inputLeadIds: parsed.data.inputLeadIds,
      status: "running",
    })
    .returning({ id: schema.agentRuns.id });

  return Response.json({ agentRun: row }, { status: 201 });
});
