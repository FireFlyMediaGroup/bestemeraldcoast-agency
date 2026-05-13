# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## Operator Pre-Flight
**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency

- [x] Create the GitHub repo (exists — `FireFlyMediaGroup/bestemeraldcoast-agency`, **public** by intention, default branch `main`).
- [x] Visibility: **public** (operator decision; revisit before sensitive material lands).
- [x] Auto-merge enabled (`allow_auto_merge: true`).
- [x] Auto-delete head branches enabled (`delete_branch_on_merge: true`).
- [x] CodeRabbit GitHub App installed.
- [x] `.coderabbit.yaml` at repo root (landed in Commit 0.1).
- [x] `gh auth status` shows authenticated user `FireFlyMediaGroup` with ADMIN permission on the repo.
- [x] Initialize git and add the GitHub remote (done in Commit 0.1: `git init -b main` + `git remote add origin …`).
- [ ] **Pass 1 branch protection** — apply **after Commit 0.1.5 merges** (which is the first PR to land, so CodeRabbit will have reviewed at least one PR by then). Rule: require PR before merging, 0 approvals, no force push, no deletions. **No required status checks yet** (CI lands in Commit 0.6).
- [ ] **Pass 2 branch protection** — apply **after Commit 0.6** lands CI. Edit the rule to add required status checks: the CI job name(s) + `CodeRabbit`. Check "Require branches to be up to date before merging".

## Current Step

- **Phase:** 0 — Workspace & Foundations
- **Commit:** 0.1.5 — Install Ralph slash commands
- **Plan reference:** `docs/dev/MASTER-bec-project-plan.md` § Phase 0 → Commit 0.1.5
- **ADRs in scope:** none (loop-infrastructure commit; touches no decisions)
- **Status:** in-flight (branch cut, awaiting PR open + CodeRabbit review)

## Commit Prompt (excerpt)
> Make the three Ralph loop commands (`/adr-plan`, `/ralph-next`, `/ship-task`) runnable as Claude Code slash commands. Create `.claude/commands/` at the repo root and add symlinks from there to the existing runbooks under `docs/dev/claude/commands/`. Symlinks (not copies) keep a single source of truth — editing the docs updates the slash commands. This commit doubles as the first end-to-end exercise of the standard branch-per-commit + PR + auto-merge + CodeRabbit flow; the bootstrap exception from Commit 0.1 no longer applies.

## Acceptance
- `.claude/commands/{adr-plan,ralph-next,ship-task}.md` exist as symlinks resolving to `docs/dev/claude/commands/*.md`.
- PR opened against `main` with auto-merge enabled.
- CodeRabbit's final review state is `APPROVED`.
- Squash-merged to `main`; branch auto-deleted.

## Files Likely to Touch
- `.claude/commands/adr-plan.md`, `.claude/commands/ralph-next.md`, `.claude/commands/ship-task.md` (symlinks)
- `docs/dev/MASTER-bec-project-plan.md` (insertion of the Commit 0.1.5 entry — done on this branch)
- `docs/dev/status/task-log.md` (retroactive Commit 0.1 entry — done on this branch)
- `docs/dev/status/next-step.md` (this file, advanced from 0.1 → 0.1.5)

## Validation
- See `docs/dev/validation-checklist.md` § Always (every commit).
- Symlink resolution test: `test -f .claude/commands/adr-plan.md` exits 0.
- Acceptance lines above are the gate.

## Next Commit After This
- **Commit 0.2** — Cloud accounts & domains (manual operator work; Claude Code does not execute, but verifies the checklist before unblocking 0.3).

## Handoff Notes
- Master ADR and master plan are the source of truth. If anything in this file conflicts with them, trust the masters and re-derive the next step.
- Commit 0.1.5 is the first PR exercise. Watch for: (1) auto-merge behavior on a green PR, (2) CodeRabbit's first review on this repo, (3) confirm `mergeCommit.oid` is captured and branch auto-deletes.
- Phase 0 ends with the ADR-035 quality gate at `MASTER-bec-project-plan.md` § "Phase 0 quality gate (ADR-035)". Do not begin Phase 1 / Commit 1.1 until that gate is 100% green.
