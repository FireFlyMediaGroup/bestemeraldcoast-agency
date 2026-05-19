---
description: Run the Pitcher agent to send one Checker-passed outreach message — server renders the archetype template, sends via Resend, and records sent_at / sent_message_id / tracking_code. Sends only; never drafts, grades, or rewrites.
argument-hint: <outreach_message_id (uuid)>
---

Run the **pitcher** subagent (`agency/.claude/agents/pitcher.md`,
version 1) for this outreach message:

> $ARGUMENTS

Hand the agent the message id above as its input. The agent owns the full
procedure — do not re-implement it here. It will:

1. Compute today's remaining send budget via the read-only Postgres MCP
   (`30 - count(outreach_messages where sent_at >= date_trunc('day',
   now()))`). If `<= 0`, stop — cap exhausted.
2. Open an `agent_runs` row (`agentName: "pitcher"`,
   `promptVersion: 1`, `invokedBy` = the operator running this command).
3. Read the message + lead/business/site context via the read-only
   Postgres MCP and preflight the five preconditions: `checker_pass =
   true`, `sent_at IS NULL`, business not `do_not_contact`, `risk_flag`
   not `high` unless `approved_at` set (ADR-031), and a non-opted-out
   `email` contact channel exists. Any failure ⇒ skip with the reason
   (no rewrite, no self-approval).
4. `POST /api/agent/outreach-messages/<id>/send` — the server renders
   the ADR-032/033 archetype template, sends via Resend, and records
   `sent_at` / `sent_message_id` / `tracking_code` / `channel`.
5. Finalize the run (`succeeded` / `failed`) with
   `[pitcher-metrics attempted=N sent=M skipped=K failed=F]` in
   `outputSummary`.

All writes go **only** through the agent API
(`Authorization: Bearer ${AGENT_API_KEY}`, `${OPS_CONSOLE_URL}`); the
Postgres MCP is read-only and Pitcher never calls Resend or holds the
Resend key directly — the server send endpoint owns that (ADR-003).
Required env: `AGENT_API_KEY`, `OPS_CONSOLE_URL`,
`DATABASE_URL_UNPOOLED`.

If `$ARGUMENTS` is empty, ask for an outreach message id instead of
running.

After the agent returns, surface its report verbatim: the message id,
the outcome (sent / skipped + reason / failed + reason), and for a send
the `sentMessageId` + `trackingCode` + recipient + archetype, plus the
`agent_runs` id.
