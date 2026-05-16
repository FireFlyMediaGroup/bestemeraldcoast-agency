---
description: Batch-diagnose pending leads — process every lead in status `new`, up to today's remaining Diagnoser daily cap (30).
argument-hint: (no arguments — processes the pending queue)
---

Run the **diagnoser** subagent (`agency/.claude/agents/diagnoser.md`,
version 1) in batch mode over the pending-lead queue.

The agent owns the procedure. It will:

1. Compute today's remaining Diagnoser cap via the read-only Postgres MCP:
   `remaining = 30 - (count of lead_status_history rows with
   to_status='diagnosed' and created_at >= date_trunc('day', now()))`.
   If `remaining <= 0`, stop and report the cap is exhausted.
2. Select up to `remaining` leads in status `new`, oldest first:
   `select id from leads where status = 'new' order by created_at asc
   limit <remaining>` (read-only Postgres MCP).
3. For **each** selected lead, run the full single-lead Diagnoser procedure
   (open run → read → inspect → ADR-034-clean diagnosis + tiered offer →
   `PATCH` to `diagnosed` → finalize). One lead failing must not abort the
   batch — log it, continue.
4. Never exceed `remaining`; stop early if the cap is reached mid-batch.

All writes go **only** through the agent API
(`Authorization: Bearer ${AGENT_API_KEY}`, `${OPS_CONSOLE_URL}`); the
Postgres MCP is read-only (ADR-003). Required env: `AGENT_API_KEY`,
`OPS_CONSOLE_URL`, `DATABASE_URL_UNPOOLED`.

After the run, report: number diagnosed, number skipped (with reasons),
number failed, remaining daily budget, and the `agent_runs` ids.
