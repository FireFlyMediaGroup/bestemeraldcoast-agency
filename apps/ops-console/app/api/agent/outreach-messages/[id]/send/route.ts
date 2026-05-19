// POST /api/agent/outreach-messages/:id/send — the Pitcher agent's only
// send path (Commit 2.9, ADR-013/032/033/031/003). The render + Resend
// send + DB record all happen here, server-side: the Resend key never
// leaves ops-console env, and the ADR-031 / cap guards are enforced at the
// boundary (defense-in-depth, mirroring 2.8's grade invariant) — the agent
// prompt also preflights them, but the server is the authority.
//
// Order of operations: load joined context → policy guards → render →
// Resend send → single race-safe UPDATE (`WHERE sent_at IS NULL`). The
// send happens before the record, so a crash in the tiny window between
// them is at-least-once (a resend would be blocked by the guarded UPDATE
// only if sent_at was written — so we accept a rare double over a silent
// drop; logged below). No `db.transaction()` (Neon fetch transport; PR #36).

import { agentRoute, requireUuid } from "@/lib/agent-handler";

type Json = Record<string, unknown>;

const ARCHETYPES = new Set(["magazine", "coastal", "premium"]);
const DAILY_CAP = 30;

function genTrackingCode(): string {
  return `o_${globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

export const POST = agentRoute<{ id: string }>(async (req, ctx) => {
  const { id: rawId } = await ctx.params;
  const id = requireUuid(rawId);
  if (id instanceof Response) return id;

  const { getDb, schema, eq, and, isNull, sql } = await import("@bec/db");
  const db = getDb();

  const rows = await db
    .select({
      draft: schema.outreachMessages.draft,
      finalCopy: schema.outreachMessages.finalCopy,
      checkerPass: schema.outreachMessages.checkerPass,
      sentAt: schema.outreachMessages.sentAt,
      approvedAt: schema.outreachMessages.approvedAt,
      bizName: schema.businesses.name,
      city: schema.businesses.city,
      contactChannels: schema.businesses.contactChannels,
      doNotContact: schema.businesses.doNotContact,
      riskFlag: schema.businesses.riskFlag,
      archetype: schema.sites.archetype,
      siteName: schema.sites.name,
      siteDomain: schema.sites.domain,
      sendingFromName: schema.sites.sendingFromName,
    })
    .from(schema.outreachMessages)
    .innerJoin(
      schema.leads,
      eq(schema.leads.id, schema.outreachMessages.leadId),
    )
    .innerJoin(
      schema.businesses,
      eq(schema.businesses.id, schema.leads.businessId),
    )
    .leftJoin(
      schema.sites,
      eq(schema.sites.id, schema.businesses.primarySiteId),
    )
    .where(eq(schema.outreachMessages.id, id))
    .limit(1);

  const r = rows[0];
  if (!r) return Response.json({ error: "not_found" }, { status: 404 });

  // Identity → policy → capacity. Most-specific failure first.
  if (r.sentAt) {
    return Response.json({ error: "already_sent" }, { status: 409 });
  }
  if (r.checkerPass !== true) {
    return Response.json({ error: "not_checker_passed" }, { status: 422 });
  }
  if (r.doNotContact) {
    return Response.json({ error: "do_not_contact" }, { status: 409 });
  }
  // ADR-031: high risk is human-approval-gated. `approved_at` set ⇒ an
  // operator cleared it; otherwise the send is refused, not queued.
  if (r.riskFlag === "high" && !r.approvedAt) {
    return Response.json(
      { error: "risk_requires_approval" },
      { status: 412 },
    );
  }

  // v1 is email-only (Resend). Pick the first non-opted-out email channel.
  const channels = r.contactChannels ?? [];
  const emailChannel = channels.find(
    (c) => c.kind === "email" && !c.optedOutAt && Boolean(c.value),
  );
  if (!emailChannel) {
    return Response.json({ error: "no_email_channel" }, { status: 409 });
  }

  // Daily cap 30 — server-side count on the DB day boundary (matches the
  // Scout/Diagnoser cap convention). Agent-side preflight also checks this.
  const capRows = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.outreachMessages)
    .where(sql`${schema.outreachMessages.sentAt} >= date_trunc('day', now())`);
  const sentToday = Number(capRows[0]?.n ?? 0);
  if (sentToday >= DAILY_CAP) {
    return Response.json(
      { error: "daily_cap_reached", sentToday, cap: DAILY_CAP },
      { status: 409 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "send_misconfigured", reason: "missing_resend_api_key" },
      { status: 500 },
    );
  }

  const archetype = (
    r.archetype && ARCHETYPES.has(r.archetype) ? r.archetype : "magazine"
  ) as "magazine" | "coastal" | "premium";
  const fromName = r.sendingFromName || r.siteName || "Best Emerald Coast";
  const fromEmail =
    process.env.OUTREACH_FROM_EMAIL || "noreply@ops.bestemeraldcoast.com";
  const replyTo = process.env.OUTREACH_REPLY_TO || undefined;
  const postalAddress =
    process.env.OUTREACH_POSTAL_ADDRESS ||
    "Best Emerald Coast — mailing address not configured";
  const siteUrl = r.siteDomain
    ? `https://${r.siteDomain}`
    : "https://bestemeraldcoast.com";
  const bodyCopy = r.finalCopy ?? r.draft;
  const trackingCode = genTrackingCode();

  const { renderOutreachEmail, sendOutreachEmail, outreachSubject } =
    await import("@bec/email");

  const { html, text } = await renderOutreachEmail({
    archetype,
    businessName: r.bizName,
    city: r.city,
    bodyCopy,
    fromName,
    siteUrl,
    trackingCode,
    postalAddress,
  });

  let sentMessageId: string;
  try {
    const sent = await sendOutreachEmail(apiKey, {
      to: emailChannel.value,
      fromName,
      fromEmail,
      replyTo,
      subject: outreachSubject(archetype, r.bizName),
      html,
      text,
    });
    sentMessageId = sent.id;
  } catch (err) {
    return Response.json(
      {
        error: "send_failed",
        reason: err instanceof Error ? err.message : "unknown",
      },
      { status: 502 },
    );
  }

  // Race-safe record: the guard makes a concurrent double-send a no-op.
  // The email already went out above; if this returns 0 rows another
  // request recorded it first — log the orphaned provider id so it's
  // recoverable, and report already_sent.
  const updated = await db
    .update(schema.outreachMessages)
    .set({
      sentAt: new Date(),
      sentMessageId,
      trackingCode,
      channel: "email",
    })
    .where(
      and(
        eq(schema.outreachMessages.id, id),
        isNull(schema.outreachMessages.sentAt),
      ),
    )
    .returning({ id: schema.outreachMessages.id });

  if (updated.length === 0) {
    const { logger } = await import("@bec/logger");
    logger.error(
      { outreachMessageId: id, sentMessageId, trackingCode },
      "outreach sent via Resend but row already had sent_at — orphaned provider id",
    );
    return Response.json({ error: "already_sent" }, { status: 409 });
  }

  const body: Json = {
    outreachMessage: {
      id,
      channel: "email",
      sentMessageId,
      trackingCode,
      to: emailChannel.value,
      archetype,
    },
  };
  return Response.json(body);
});
