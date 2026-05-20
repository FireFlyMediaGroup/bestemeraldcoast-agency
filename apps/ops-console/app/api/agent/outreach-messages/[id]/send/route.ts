// POST /api/agent/outreach-messages/:id/send — the Pitcher agent's only
// send path (Commit 2.9, ADR-013/032/033/031/003). The render + Resend
// send + DB record all happen here, server-side: the Resend key never
// leaves ops-console env, and the ADR-031 / cap guards are enforced at the
// boundary (defense-in-depth, mirroring 2.8's grade invariant) — the agent
// prompt also preflights them, but the server is the authority.
//
// Order of operations: load joined context → policy guards → ATOMIC
// CLAIM (race-safe `WHERE sent_at IS NULL AND tracking_code IS NULL AND
// (count sent today) < cap`) → render → Resend send → finalize the
// claim with `sent_at` + `sent_message_id`. The cap check lives INSIDE
// the claim UPDATE so two parallel requests can't both pass a stale
// `count(*)` and exceed 30/day. The claim happens BEFORE the Resend
// send so two concurrent requests can't both email the recipient — only
// the winner of the UPDATE proceeds, the loser gets 409. If Resend
// fails after a successful claim we release the tracking_code so the
// retry can re-claim cleanly (the row never observed a half-sent
// state). No `db.transaction()` (Neon fetch transport; PR #36).

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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "send_misconfigured", reason: "missing_resend_api_key" },
      { status: 500 },
    );
  }

  // CAN-SPAM mandates a working opt-out; refuse to send if we can't name
  // one (ADR-014/031). Prefer the monitored Reply-To; otherwise an
  // explicit unsubscribe inbox; otherwise the operator's address.
  const replyTo = process.env.OUTREACH_REPLY_TO || undefined;
  const unsubscribeAddress =
    replyTo ||
    process.env.OUTREACH_UNSUBSCRIBE_EMAIL ||
    process.env.OPERATOR_EMAIL ||
    "";
  if (!unsubscribeAddress) {
    return Response.json(
      {
        error: "opt_out_misconfigured",
        reason:
          "set OUTREACH_REPLY_TO or OUTREACH_UNSUBSCRIBE_EMAIL or OPERATOR_EMAIL",
      },
      { status: 412 },
    );
  }
  const isReplyToMonitored = Boolean(replyTo);

  const archetype = (
    r.archetype && ARCHETYPES.has(r.archetype) ? r.archetype : "magazine"
  ) as "magazine" | "coastal" | "premium";
  const fromName = r.sendingFromName || r.siteName || "Best Emerald Coast";
  const fromEmail =
    process.env.OUTREACH_FROM_EMAIL || "noreply@ops.bestemeraldcoast.com";
  const postalAddress =
    process.env.OUTREACH_POSTAL_ADDRESS ||
    "Best Emerald Coast — mailing address not configured";
  const siteUrl = r.siteDomain
    ? `https://${r.siteDomain}`
    : "https://bestemeraldcoast.com";
  const bodyCopy = r.finalCopy ?? r.draft;
  const trackingCode = genTrackingCode();

  // ── Atomic claim ────────────────────────────────────────────────────
  // The claim UPDATE is the single race-safe boundary that simultaneously
  // enforces "not already sent", "not already in-flight", AND the daily
  // cap (cubic P1 + P2). The cap subquery runs inside the same statement
  // so two parallel requests at #29 and #30 can't both pass a count of
  // 29 and over-cap. A 0-row result is disambiguated below to give the
  // caller a precise error (already_sent / already_claimed / cap reached).
  const claimed = await db
    .update(schema.outreachMessages)
    .set({ trackingCode })
    .where(
      and(
        eq(schema.outreachMessages.id, id),
        isNull(schema.outreachMessages.sentAt),
        isNull(schema.outreachMessages.trackingCode),
        sql`(select count(*) from outreach_messages where sent_at >= date_trunc('day', now())) < ${DAILY_CAP}`,
      ),
    )
    .returning({ id: schema.outreachMessages.id });

  if (claimed.length === 0) {
    // Disambiguate why the claim failed — a single follow-up read.
    const probe = await db
      .select({
        sentAt: schema.outreachMessages.sentAt,
        trackingCode: schema.outreachMessages.trackingCode,
        sentToday: sql<number>`(select count(*) from outreach_messages where sent_at >= date_trunc('day', now()))`,
      })
      .from(schema.outreachMessages)
      .where(eq(schema.outreachMessages.id, id))
      .limit(1);
    const p = probe[0];
    if (p?.sentAt) {
      return Response.json({ error: "already_sent" }, { status: 409 });
    }
    if (p?.trackingCode) {
      return Response.json({ error: "already_claimed" }, { status: 409 });
    }
    const sentToday = Number(p?.sentToday ?? 0);
    if (sentToday >= DAILY_CAP) {
      return Response.json(
        { error: "daily_cap_reached", sentToday, cap: DAILY_CAP },
        { status: 409 },
      );
    }
    return Response.json({ error: "claim_failed" }, { status: 409 });
  }

  // ── Send (the claim guarantees we're the sole sender for this row) ──
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
    unsubscribeAddress,
    isReplyToMonitored,
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
    // Release the claim so a retry can re-acquire it; the row never had
    // sent_at set, so no recipient ever saw a half-state. ADR-012: log
    // the provider failure (Sentry + Axiom) before returning 502 so
    // outbound incidents are observable.
    await db
      .update(schema.outreachMessages)
      .set({ trackingCode: null })
      .where(
        and(
          eq(schema.outreachMessages.id, id),
          eq(schema.outreachMessages.trackingCode, trackingCode),
          isNull(schema.outreachMessages.sentAt),
        ),
      );
    const { logger } = await import("@bec/logger");
    logger.error(
      {
        err,
        outreachMessageId: id,
        to: emailChannel.value,
        fromEmail,
      },
      "outreach Resend send failed",
    );
    return Response.json(
      {
        error: "send_failed",
        reason: err instanceof Error ? err.message : "unknown",
      },
      { status: 502 },
    );
  }

  // ── Finalize the claim ─────────────────────────────────────────────
  // The claim already pinned tracking_code; we now stamp sent_at +
  // sent_message_id + channel. Filtering on the same tracking_code makes
  // this idempotent even if a retried request reaches this line twice.
  const finalized = await db
    .update(schema.outreachMessages)
    .set({
      sentAt: new Date(),
      sentMessageId,
      channel: "email",
    })
    .where(
      and(
        eq(schema.outreachMessages.id, id),
        eq(schema.outreachMessages.trackingCode, trackingCode),
        isNull(schema.outreachMessages.sentAt),
      ),
    )
    .returning({ id: schema.outreachMessages.id });

  if (finalized.length === 0) {
    // Extremely unlikely: the row was finalized between claim and here
    // (e.g., manual operator UPDATE). The email already went out — log
    // the orphaned provider id so it's recoverable.
    const { logger } = await import("@bec/logger");
    logger.error(
      { outreachMessageId: id, sentMessageId, trackingCode },
      "outreach sent via Resend but finalize UPDATE matched 0 rows — orphaned provider id",
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
