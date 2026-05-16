---
description: Diagnose a single lead — inspect its business website, write a ~50-word consultant-voice diagnosis + tiered offer, and advance the lead to `diagnosed` via the agent API.
argument-hint: <lead_id>   (a UUID of a lead in status `new`)
---

Run the **diagnoser** subagent (`agency/.claude/agents/diagnoser.md`,
version 1) for this lead id:

> $ARGUMENTS

Hand the agent the lead id above. The agent owns the full procedure — do not
re-implement it. It will:

1. Check today's Diagnoser daily cap (30, via `lead_status_history`) and abort
   if exhausted.
2. Open an `agent_runs` row (`agentName: "diagnoser"`, `promptVersion: 1`,
   `inputLeadIds: [<id>]`).
3. Read the lead + business via the read-only Postgres MCP; skip if the lead
   is not `new` or the business is `do_not_contact` / `is_client` (ADR-031).
4. Inspect the website against the Diagnoser checklist, write a ~50-word
   diagnosis that clears the ADR-034 copy-quality rubric
   (`agency/.claude/rubrics/`), and build the `Diagnosis` + tiered `Offer`
   jsonb keyed to `gap_score`.
5. `PATCH /api/agent/leads/<id>` → status `diagnosed` (atomic status + jsonb).
6. Finalize the run (`succeeded` / `aborted` / `failed`).

All writes go **only** through the agent API with
`Authorization: Bearer ${AGENT_API_KEY}` against `${OPS_CONSOLE_URL}`
(ADR-003; the Postgres MCP is read-only). Required env: `AGENT_API_KEY`,
`OPS_CONSOLE_URL`, `DATABASE_URL_UNPOOLED`.

If `$ARGUMENTS` is empty or not a UUID, ask for a valid lead id instead of
running. After the agent returns, surface its report verbatim (business,
the diagnosis, the offer, findings, the `agent_runs` id).
