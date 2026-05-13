# CLAUDE.md

This project's operating contract lives at `docs/dev/claude/CLAUDE.md`. **Read that file and `docs/dev/status/next-step.md` before any work.**

Source of truth (do not modify unless the active task is explicitly a docs-update task):
- `docs/dev/MASTER-bec-architecture-decisions.md` — 41 ADRs (the *what* and *why*)
- `docs/dev/MASTER-bec-project-plan.md` — Phase 0–6 implementation plan with per-commit prompts and acceptance criteria

Loop docs:
- `docs/dev/claude/CLAUDE.md` — operating contract
- `docs/dev/claude/RALPH-LOOP.md` — full loop spec (read before any git activity; CodeRabbit hard-gate lives here)
- `docs/dev/claude/commands/` — `/adr-plan`, `/ralph-next`, `/ship-task`
- `docs/dev/claude/agents/` — planner, reviewer, executor, validator role docs

State files (read first, write last):
- `docs/dev/status/next-step.md` — single handoff; tells you the current Phase + Commit
- `docs/dev/status/task-log.md` — append-only log of completed commits

Process docs:
- `docs/dev/adr-log.md` — ADR amendment history
- `docs/dev/task-template.md` — for off-plan work
- `docs/dev/validation-checklist.md` — repeatable QA per commit
