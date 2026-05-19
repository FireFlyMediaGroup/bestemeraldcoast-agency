---
description: After ≥20 published articles, read the recent editorial_feedback (draft→final diffs) and propose concrete Editor-prompt improvements (ADR-020). Proposal only — the operator applies the ADR-019 version bump.
argument-hint: (no arguments — reads the latest editorial_feedback rows)
---

Run the **editor** subagent (`agency/.claude/agents/editor.md`, version 1)
in **refine mode** — it does NOT draft; it analyses how the operator's
edits diverge from its drafts and proposes prompt changes (ADR-020).

The agent owns the procedure. It will:

1. Open an `agent_runs` row (`agentName: "editor"`, `promptVersion: 1`,
   `invokedBy` = the operator).
2. Gate on volume (read-only Postgres MCP): `select count(*) from
   editorial_feedback`. If `< 20`, stop and report "not enough feedback
   yet (need ≥20 published)". Do not propose changes on thin data.
3. Pull the latest 20: `select draft_body, final_body, edits_summary,
   rejected_draft, rejection_reason, prompt_version from
   editorial_feedback order by created_at desc limit 20`.
4. Diff each `draft_body` → `final_body`; cluster the recurring edit
   patterns (tone drift, banned-phrase leakage, structural rewrites,
   factual corrections, length). Weight `rejected_draft` rows highest.
5. Produce a **concrete proposal**: specific, quoted before/after prompt
   edits to `agency/.claude/agents/editor.md` (and/or the
   `rubrics/*.md`), framed as an ADR-019 `version: 2` change with an
   `adr-log.md` note. Proposal text only.

**This command does not modify any prompt or rubric and writes nothing to
Postgres beyond the `agent_runs` lifecycle.** Per ADR-019/ADR-020 the
operator reviews the proposal and applies the version bump (exactly like
the Diagnoser `version: 2` path) — auto-applying a prompt change is a gate
skip. The Postgres MCP is read-only (ADR-003). Required env:
`AGENT_API_KEY`, `OPS_CONSOLE_URL`, `DATABASE_URL_UNPOOLED`.

Finalize the run with `[editor-metrics refine=1 feedbackRows=N]` in
`outputSummary`. After it returns, surface the proposal verbatim: the
feedback sample size, the clustered edit patterns with evidence, and the
proposed `version: 2` prompt/rubric diff for the operator to accept or
reject.
