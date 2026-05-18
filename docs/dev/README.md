# bestemeraldcoast-agency Development Docs

This folder contains the master ADR, master project plan, Claude Code operating docs, the Ralph loop instructions, and the loop's state files.

## Included Docs

### Master source-of-truth
- `MASTER-bec-architecture-decisions.md` — 41 ADRs (the *what* and *why*; hard constraints)
- `MASTER-bec-project-plan.md` — Phase 0–6 implementation plan with per-commit prompts and acceptance criteria

### Claude Code operating layer
- `claude/CLAUDE.md` — operating instructions Claude Code reads on every meaningful task
- `claude/RALPH-LOOP.md` — the repeating execution cycle
- `claude/commands/` — `/adr-plan`, `/ralph-next`, `/ship-task`
- `claude/agents/` — planner, reviewer, executor, validator role docs

### Loop state
- `status/next-step.md` — single handoff file; always describes the next commit to execute
- `status/task-log.md` — append-only log of completed commits with acceptance evidence

### Process docs
- `adr-log.md` — ADR amendment history
- `task-template.md` — standard task card format
- `validation-checklist.md` — repeatable QA checks per commit

### Repo tooling
- `scripts/dev-session.sh` — the **only** supported way to start an agent-runtime session. Loads the root `.env` safely (first-`=` split so `&` can't truncate `DATABASE_URL_UNPOOLED`), validates Scout env vars, and launches Claude scoped to `agency/` so the MCP servers, `/scout` command, and subagents load. Plain `claude` from the repo root silently loses all three. Details: `claude/CLAUDE.md` § Session Launch.
- `scripts/seed-1password-vault.sh` — one-time: seed the 1Password vault with placeholder items for `.env.tpl`.

## Operating Rule
Always read the master ADR and master project plan (or at minimum the relevant Phase + cited ADRs) before starting a new task. The state file `status/next-step.md` tells the loop what to execute next. Start every session via `./scripts/dev-session.sh` (see `claude/CLAUDE.md` § Session Launch) — a misscoped launch makes the agent runtime silently non-functional.

## Git Workflow (summary)
- One branch per Ralph commit: `phase-<N>/commit-<N>.<M>-<slug>`.
- One PR per branch, opened against `main`.
- **CodeRabbit** auto-reviews every PR; loop waits for `APPROVED` review state before auto-merge fires (hard gate).
- Auto-merge enabled on every PR (`gh pr merge --auto --squash --delete-branch`); GitHub squash-merges when CI ✓ + CodeRabbit ✓ and deletes the branch.
- The Reviewer agent (loop step 6, local pre-push) + CodeRabbit (loop step 7d, post-push) together replace the human-review gate.
- See `claude/RALPH-LOOP.md` § Git Discipline for the full per-step flow, CodeRabbit triage rules, branch naming, commit message format, and failure modes.
- CodeRabbit configuration lives in `.coderabbit.yaml` at the repo root.
- Operator pre-flight (one-time, before Commit 0.1): create the GitHub repo, install the **CodeRabbit GitHub App**, enable "Allow auto-merge" + "Automatically delete head branches", add a branch protection rule on `main` that requires CI **and** CodeRabbit's status check but does **not** require approving reviews from humans.
