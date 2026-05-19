---
description: Run the Checker agent to grade one outreach message against the ADR-034 copy-quality rubric — records checker_pass / checker_score / checker_notes via the agent API. Grades only; never rewrites.
argument-hint: <outreach_message_id (uuid)>
---

Run the **checker** subagent (`agency/.claude/agents/checker.md`,
version 1) for this outreach message:

> $ARGUMENTS

Hand the agent the message id above as its input. The agent owns the full
procedure — do not re-implement it here. It will:

1. Open an `agent_runs` row (`agentName: "checker"`, `promptVersion: 1`,
   `invokedBy` = the operator running this command).
2. Read the message draft + lead/business context via the read-only
   Postgres MCP (skip if it already has a `checker_score`, unless told to
   re-check).
3. Load `agency/.claude/rubrics/copy-quality.md` +
   `banned-phrases.md` and score the draft on the six ADR-034 dimensions
   (0–2 each, with quoted evidence). Compute pass: **total ≥ 9/12, no
   `0` in any dimension, AND the outreach extra gates** (under 70 words,
   zero AI markers, ≥1 local-specific reference).
4. `PATCH /api/agent/outreach-messages/<id>` with `checkerPass`,
   `checkerScore`, and the `checkerNotes` breakdown.
5. Finalize the run (`succeeded` / `failed`) with
   `[checker-metrics checked=N passed=M]` in `outputSummary`.

All writes go **only** through the agent API
(`Authorization: Bearer ${AGENT_API_KEY}`, `${OPS_CONSOLE_URL}`); the
Postgres MCP is read-only (ADR-003). Checker **grades only** — on a fail
it names the failing dimension(s) and banned phrase(s) so Pitcher can
revise; it does not rewrite the copy or loosen the rubric. Required env:
`AGENT_API_KEY`, `OPS_CONSOLE_URL`, `DATABASE_URL_UNPOOLED`.

If `$ARGUMENTS` is empty, ask for an outreach message id instead of
running.

After the agent returns, surface its report verbatim: the message id,
total score + per-dimension breakdown with quoted evidence, the three
extra-gate booleans, the final pass/fail, and the `agent_runs` id.
