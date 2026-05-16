// /api/agent/pipeline-signals — the editorial-rotation event log (ADR-040).
//
// POST: an agent records one signal alongside its normal work (Scout on
//   lead creation, Diagnoser on diagnosis, and — when they come online in
//   Phase 2-5 — Builder/Pitcher/inbound/Calendly hooks). The signal
//   *strength* is canonical and set server-side from the spec table so a
//   misbehaving agent can't poison the Curator's scoring; the client only
//   says which signal happened.
// GET ?niche=&city=&since= : the Curator's trailing-window query
//   (typically since = now − 14 days) feeding the pipeline-signal score.
//
// Bearer-gated + rate-limited + error-captured via the shared agentRoute
// pipeline, identical to the other agent endpoints.

import { z } from "zod";

import { agentRoute, readJson } from "@/lib/agent-handler";

// Canonical signal-type → strength (master plan § Pipeline signal capture /
// signal-weight table). The single source of truth for strength — agents do
// not send it. Builder/Filmer/Pitcher/inbound/Calendly are listed now so
// the endpoint is ready when those agents land (the "prepare hooks" ask).
const SIGNAL_STRENGTHS = {
  lead_added: 10, // Scout — on lead creation
  diagnosis_done: 15, // Diagnoser — on diagnosis complete
  mockup_done: 20, // Builder — on mockup (Phase 4)
  outreach_sent: 10, // Pitcher — on send (Phase 5)
  reply_received: 25, // Inbound webhook — any sentiment (Phase 5)
  positive_reply: 40, // Inbound webhook — additional, if positive
  booked_call: 60, // Calendly webhook — on booking
} as const;

type SignalType = keyof typeof SIGNAL_STRENGTHS;

const PostSignal = z.object({
  nicheId: z.string().min(1),
  city: z.string().min(1),
  signalType: z.enum(
    Object.keys(SIGNAL_STRENGTHS) as [SignalType, ...SignalType[]],
  ),
  leadId: z.string().uuid().optional(),
});

export const POST = agentRoute(async (req) => {
  const [body, badJson] = await readJson<unknown>(req);
  if (badJson) return badJson;

  const parsed = PostSignal.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "validation_failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const { getDb, schema } = await import("@bec/db");
  const db = getDb();
  const [row] = await db
    .insert(schema.pipelineSignals)
    .values({
      nicheId: d.nicheId,
      city: d.city,
      signalType: d.signalType,
      signalStrength: SIGNAL_STRENGTHS[d.signalType],
      leadId: d.leadId,
    })
    .returning({
      id: schema.pipelineSignals.id,
      signalStrength: schema.pipelineSignals.signalStrength,
    });

  return Response.json({ pipelineSignal: row }, { status: 201 });
});

export const GET = agentRoute(async (req) => {
  const url = new URL(req.url);
  const niche = url.searchParams.get("niche");
  const city = url.searchParams.get("city");
  const since = url.searchParams.get("since");

  if (!niche) {
    return Response.json(
      { error: "missing_param", param: "niche" },
      { status: 400 },
    );
  }

  let sinceDate: Date | undefined;
  if (since) {
    const d = new Date(since);
    if (Number.isNaN(d.getTime())) {
      return Response.json(
        { error: "invalid_param", param: "since" },
        { status: 400 },
      );
    }
    sinceDate = d;
  }

  const { getDb, schema, and, eq, gte } = await import("@bec/db");
  const db = getDb();

  const conditions = [eq(schema.pipelineSignals.nicheId, niche)];
  if (city) conditions.push(eq(schema.pipelineSignals.city, city));
  if (sinceDate) {
    conditions.push(gte(schema.pipelineSignals.occurredAt, sinceDate));
  }

  const signals = await db
    .select({
      id: schema.pipelineSignals.id,
      nicheId: schema.pipelineSignals.nicheId,
      city: schema.pipelineSignals.city,
      signalType: schema.pipelineSignals.signalType,
      signalStrength: schema.pipelineSignals.signalStrength,
      leadId: schema.pipelineSignals.leadId,
      occurredAt: schema.pipelineSignals.occurredAt,
    })
    .from(schema.pipelineSignals)
    .where(and(...conditions));

  return Response.json({ signals, count: signals.length });
});
