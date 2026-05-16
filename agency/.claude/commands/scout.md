---
description: Run Scout lead discovery for a "<niche> <city>" query — walks Google Maps, upserts businesses via the agent API, scores them, and creates `new` leads for the strong ones (daily caps enforced).
argument-hint: <niche> <city>   e.g. pensacola charter fishing
---

Run the **scout** subagent (`agency/.claude/agents/scout.md`, version 1) for
this query:

> $ARGUMENTS

Hand the agent the raw query string above as its input. The agent owns the
full procedure — do not re-implement it here. It will:

1. Open an `agent_runs` row (`agentName: "scout"`, `promptVersion: 1`,
   `invokedBy` = the operator running this command).
2. Check today's daily caps via the read-only Postgres MCP (150 scanned /
   30 leads added) and abort early if exhausted.
3. Discover businesses via the Google Maps MCP within the city radius,
   upsert each via `POST /api/agent/businesses` (idempotent on
   `googlePlaceId`), score them with the gap-score formula, and create a
   `new` lead (`POST /api/agent/leads`) for every eligible business with
   `gap_score ≥ 60`, skipping `do_not_contact` / `is_client` (ADR-031).
4. Finalize the run (`succeeded` / `aborted` / `failed`) with the
   `[scout-metrics scanned=N leadsAdded=M]` token in `outputSummary`.

All writes go **only** through the agent API with
`Authorization: Bearer ${AGENT_API_KEY}` against `${OPS_CONSOLE_URL}`
(ADR-003 — Postgres is the single source of truth; the Postgres MCP is
read-only). Required environment: `GOOGLE_MAPS_API_KEY`, `AGENT_API_KEY`,
`OPS_CONSOLE_URL`, `DATABASE_URL_UNPOOLED`.

If `$ARGUMENTS` is empty, ask for a `<niche> <city>` query instead of
running.

After the agent returns, surface its report verbatim: query parsed,
businesses scanned, leads created with gap scores, anything skipped, the
remaining daily budget, and the `agent_runs` id.
