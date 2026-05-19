// PATCH /api/agent/outreach-messages/:id — the Checker agent records its
// ADR-034 grade on an outreach message (Commit 2.8). Per ADR-003 agents
// never write Postgres directly; this is the only mutation path for
// checker_* (Bearer AGENT_API_KEY via agentRoute). A single UPDATE — no
// `db.transaction()` needed (one statement is fetch-transport safe; PR #36).

import { z } from "zod";

import { agentRoute, readJson, requireUuid } from "@/lib/agent-handler";

const DIM = z.union([z.literal(0), z.literal(1), z.literal(2)]);

// checker_notes jsonb shape — the explainable ADR-034 breakdown. The six
// dimensions are each 0–2; `notes` is the per-dimension / overall rationale
// the operator sees in the composer + reply views.
const CheckerNotes = z.object({
  dimensions: z.object({
    specificity: DIM,
    lengthDiscipline: DIM,
    voiceMatch: DIM,
    aiMarkers: DIM,
    localAccuracy: DIM,
    ctaClarity: DIM,
  }),
  notes: z.array(z.string()).default([]),
  /** Outreach extra gates (ADR-034): <70 words, zero AI markers, ≥1 local ref. */
  outreachGates: z
    .object({
      underWordCap: z.boolean(),
      zeroAiMarkers: z.boolean(),
      hasLocalReference: z.boolean(),
    })
    .optional(),
});

const PatchCheck = z.object({
  checkerPass: z.boolean(),
  checkerScore: z.number().int().min(0).max(12),
  checkerNotes: CheckerNotes,
});

export const PATCH = agentRoute<{ id: string }>(async (req, ctx) => {
  const { id: rawId } = await ctx.params;
  const id = requireUuid(rawId);
  if (id instanceof Response) return id;

  const [body, badJson] = await readJson<unknown>(req);
  if (badJson) return badJson;

  const parsed = PatchCheck.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "validation_failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const c = parsed.data;

  // Defense-in-depth: the agent computes the grade, but the persistence
  // boundary must not store a self-contradictory one (ADR-034). Reject if
  // checkerScore ≠ Σ dimensions, or if checkerPass disagrees with the
  // ADR-034 derivation (≥9/12, no dimension 0, and — when the outreach
  // extra gates are supplied — all three true).
  const dims: number[] = Object.values(c.checkerNotes.dimensions);
  const total = dims.reduce((s, d) => s + d, 0);
  if (total !== c.checkerScore) {
    return Response.json(
      { error: "inconsistent_grade", reason: "score_ne_dimension_sum" },
      { status: 400 },
    );
  }
  const gates = c.checkerNotes.outreachGates;
  const derivedPass =
    total >= 9 &&
    !dims.includes(0) &&
    (gates
      ? gates.underWordCap && gates.zeroAiMarkers && gates.hasLocalReference
      : true);
  if (derivedPass !== c.checkerPass) {
    return Response.json(
      { error: "inconsistent_grade", reason: "pass_ne_rubric" },
      { status: 400 },
    );
  }

  const { getDb, schema, eq } = await import("@bec/db");
  const db = getDb();

  const updated = await db
    .update(schema.outreachMessages)
    .set({
      checkerPass: c.checkerPass,
      checkerScore: c.checkerScore,
      checkerNotes: c.checkerNotes as never,
    })
    .where(eq(schema.outreachMessages.id, id))
    .returning({ id: schema.outreachMessages.id });

  if (updated.length === 0) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json({
    outreachMessage: { id, checkerPass: c.checkerPass, checkerScore: c.checkerScore },
  });
});
