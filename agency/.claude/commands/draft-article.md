---
description: Run the Editor agent to draft one article — from an explicit content brief, or (no args) pull the next-needed brief from the editorial calendar. Creates a `draft` via the agent API; never publishes.
argument-hint: siteId=<uuid> contentType=<type> keyword="<phrase>" businessIds=<uuid,uuid> [categoryId=<uuid>]   — or no args to pull from the calendar queue
---

Run the **editor** subagent (`agency/.claude/agents/editor.md`, version 1)
to produce ONE draft article.

> $ARGUMENTS

Hand the agent the brief above as its input. The agent owns the full
procedure — do not re-implement it here. It will:

1. Open an `agent_runs` row (`agentName: "editor"`, `promptVersion: 1`,
   `invokedBy` = the operator running this command).
2. If `$ARGUMENTS` is a brief, parse `siteId`, `contentType`,
   `keyword`/target, `businessIds`, optional `categoryId`. **If
   `$ARGUMENTS` is empty, pull from the queue:** via the read-only
   Postgres MCP pick the site/category/contentType that moves a site
   toward its `minimum_weekly_articles` (ADR-021 calendar) in an
   under-served category; if every site is at its weekly **maximum**,
   abort with that reason.
3. Read (read-only Postgres MCP): site voice/`theme_tokens`/archetype +
   taxonomy + the verified, non-delisted `businesses` rows for the brief.
   Never invent facts (ADR-015/ADR-034 honesty).
4. Draft `bodyMdx` in the site's archetype voice, obeying
   `agency/.claude/rubrics/banned-phrases.md` +
   `agency/.claude/rubrics/copy-quality.md` (ADR-034); self-score before
   submitting.
5. `POST /api/agent/articles` with `status` server-forced to `draft` and
   **`originalDraftBody` identical to `bodyMdx`** (ADR-020 training
   baseline). `409 slug_conflict` → pick a more specific slug, retry once.
6. Finalize the run (`succeeded` / `aborted` / `failed`) with
   `[editor-metrics drafts=N]` in `outputSummary`.

All writes go **only** through the agent API
(`Authorization: Bearer ${AGENT_API_KEY}`, `${OPS_CONSOLE_URL}`); the
Postgres MCP is read-only (ADR-003). The Editor **cannot publish** —
publishing is an operator action in the editorial composer (Commit 2.7).
Required env: `AGENT_API_KEY`, `OPS_CONSOLE_URL`, `DATABASE_URL_UNPOOLED`.

After the agent returns, surface its report verbatim: brief used,
category/contentType, title + slug, the returned article id, businesses
featured (with rank), the self-assessment vs the copy-quality rubric,
anything skipped (weekly max / delisted business / slug conflict), and the
`agent_runs` id.
