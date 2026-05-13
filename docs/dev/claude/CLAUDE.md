# CLAUDE.md

You are working in **bestemeraldcoast-agency** — a multi-site media + agency monorepo. This file is your operating contract.

## Source of Truth
Two files govern everything:
- `docs/dev/MASTER-bec-architecture-decisions.md` — 41 ADRs (the *what* and *why*; hard constraints)
- `docs/dev/MASTER-bec-project-plan.md` — Phase 0–6 implementation plan with per-commit prompts and acceptance criteria

The master plan is structured as **Phase → Commit**. Each commit is a focused work session containing:
- a one-paragraph prompt (in a `>` blockquote)
- an explicit `**Acceptance**:` line

Each phase ends with a **quality gate** (per ADR-035) — a checklist that must be 100% green before the next phase begins.

## Primary Duties
- Read the relevant Phase section + any cited ADRs before starting a commit. (Read both master docs end-to-end at the start of a session, then rely on the section/ADR refs after that.)
- Pick the next unfinished commit by reading `docs/dev/status/next-step.md`. If that file is stale or missing, derive the next commit from the master plan and update `next-step.md`.
- Execute the smallest safe change that satisfies the commit prompt and its acceptance line.
- Log completion in `docs/dev/status/task-log.md`.
- If implementation diverges from intent, update the docs (ADR amendment via `docs/dev/adr-log.md`, or a project-plan edit) before continuing.

## Non-Negotiables
- Do not bypass an ADR. If a task conflicts with one, propose an amendment in `docs/dev/adr-log.md` first; do not silently violate.
- Do not invent commit order. Follow the phase sequence; within a phase, follow the numbered commits unless a documented dependency forces a swap.
- Do not skip a phase quality gate to "make progress." Per ADR-035, gates are acceptance criteria, not aspirations.
- Do not modify `MASTER-bec-architecture-decisions.md` or `MASTER-bec-project-plan.md` unless the active task is explicitly a docs-update task.
- Keep changes traceable: every commit message and PR title uses `Phase <N> / Commit <N>.<M>: <title>`.
- Never push to `main` directly. Every change lands via a PR opened from a `phase-<N>/commit-<N>.<M>-<slug>` branch and auto-squash-merges after CI **and** CodeRabbit pass. See `RALPH-LOOP.md` § Git Discipline.
- Never dismiss a CodeRabbit comment without addressing it. Each comment is either fixed (push to branch) or replied to with rationale (`gh pr comment`). The hard gate is CodeRabbit's review state == `APPROVED`. If CodeRabbit insists on changes that are genuinely wrong, escalate via an ADR amendment — do not override.
- Never `--force` push, `git reset --hard`, or `git clean -f` without explicit operator approval.

## Work Cycle (Ralph Loop)
1. Read `docs/dev/status/next-step.md` → know the current Phase + Commit.
2. Read the cited Phase section in the project plan + any ADRs the commit references.
3. Run `/adr-plan` → draft an execution checklist for this commit.
4. Implement the change.
5. Run the commit's `Acceptance` check + the relevant items from `docs/dev/validation-checklist.md`.
6. Run `/ship-task` → log completion in `task-log.md` and write the next handoff in `next-step.md`.
7. Run `/ralph-next` → confirm the next step is loaded.

See `docs/dev/claude/RALPH-LOOP.md` for the full loop spec.

## Output Expectations on Every Response
- State which **Phase + Commit** you are executing.
- State any **ADR impact** (or "none").
- State **validation performed** (which acceptance criteria you checked).
- State the **next commit** so `next-step.md` updates are deterministic.
