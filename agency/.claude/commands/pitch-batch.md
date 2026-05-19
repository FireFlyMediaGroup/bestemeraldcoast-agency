---
description: Batch-send the eligible outreach queue — every Checker-passed, unsent, contactable message, up to today's remaining Pitcher daily cap (30).
argument-hint: (no arguments — processes the eligible send queue)
---

Run the **pitcher** subagent (`agency/.claude/agents/pitcher.md`,
version 1) in batch mode over the eligible outreach queue.

The agent owns the procedure. It will:

1. Compute today's remaining send budget via the read-only Postgres MCP:
   `remaining = 30 - (count of outreach_messages with sent_at >=
   date_trunc('day', now()))`. If `remaining <= 0`, stop and report the
   cap is exhausted.
2. Select up to `remaining` eligible messages, oldest first — Checker-
   passed, unsent, business contactable:

   ```sql
   select m.id
   from outreach_messages m
   join leads l      on l.id = m.lead_id
   join businesses b on b.id = l.business_id
   where m.checker_pass = true
     and m.sent_at is null
     and b.do_not_contact = false
     and (b.risk_flag is distinct from 'high' or m.approved_at is not null)
   order by m.created_at asc
   limit <remaining>;
   ```

3. For **each** selected message, run the full single-message Pitcher
   procedure (open run → read + preflight → `POST …/send` → finalize).
   One message failing or being skipped must not abort the batch — log
   it, continue. A `409 daily_cap_reached` from the server is the hard
   stop.
4. Never exceed `remaining`; stop early if the cap is reached mid-batch.

All writes go **only** through the agent API
(`Authorization: Bearer ${AGENT_API_KEY}`, `${OPS_CONSOLE_URL}`); the
Postgres MCP is read-only and Pitcher never calls Resend directly — the
server send endpoint owns render + send + record (ADR-003). Required
env: `AGENT_API_KEY`, `OPS_CONSOLE_URL`, `DATABASE_URL_UNPOOLED`.

After the run, report: number sent, number skipped (with reasons),
number failed, the remaining daily budget, and the `agent_runs` id(s).
