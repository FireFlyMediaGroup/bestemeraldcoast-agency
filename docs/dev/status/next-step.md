# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## Operator Pre-Flight (one-time, do this before Commit 0.1)
Remove this section after the bootstrap completes.

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency

- [x] Create the GitHub repo (exists — `FireFlyMediaGroup/bestemeraldcoast-agency`, **public** by intention, empty, default branch `main`).
- [x] Visibility: **public** (operator decision; revisit before sensitive material lands).
- [x] Auto-merge enabled (`allow_auto_merge: true`).
- [x] Auto-delete head branches enabled (`delete_branch_on_merge: true`).
- [x] CodeRabbit GitHub App installed.
- [x] `.coderabbit.yaml` exists at repo root (will land with the first commit).
- [x] `gh auth status` shows authenticated user `FireFlyMediaGroup` with ADMIN permission on the repo.
- [ ] **Pass 1 branch protection** — add **after** Commit 0.1's initial push lands `main`. Rule: require PR before merging, 0 approvals, no force push, no deletions. **No required status checks yet** (CI + CodeRabbit checks don't exist on the repo until they each run once). Use the GitHub UI at Settings → Branches, or the `gh api -X PUT .../branches/main/protection` snippet documented in the conversation.
- [ ] **Pass 2 branch protection** — add **after** Commit 0.6 lands CI **and** at least one PR has been reviewed by CodeRabbit. Edit the rule to add required status checks: the CI job name(s) + `CodeRabbit`. Check "Require branches to be up to date before merging".
- [ ] (Automatic — Claude Code does this in Commit 0.1) Initialize git and add the GitHub remote: `git init -b main && git remote add origin https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency.git`. **Operator does nothing manually for this step.** If you want a sanity check that gh auth works for git push, run `gh auth setup-git` once — it's idempotent.

## Bootstrap Note for Commit 0.1
Commit 0.1 itself runs `git init`. There is no repo yet. So for this **one** iteration, the per-commit git flow in `claude/RALPH-LOOP.md` § Git Discipline executes *during* the commit's implementation rather than wrapping it: Claude Code runs `git init`, makes the initial commit on `main`, adds the remote, pushes `main`, then opens the first PR for any follow-up changes. From Commit 0.3 onward (Commit 0.2 is operator-only), every Ralph iteration follows the standard branch-per-commit flow.

## Current Step

- **Phase:** 0 — Workspace & Foundations
- **Commit:** 0.1 — Monorepo skeleton
- **Plan reference:** `docs/dev/MASTER-bec-project-plan.md` § Phase 0 → Commit 0.1
- **ADRs in scope:** ADR-039 (Monorepo task graph & build pipeline / Turborepo), ADR-038 (Per-environment configuration)
- **Status:** pending

## Commit Prompt (excerpt)
> Initialize a Turborepo monorepo at the current directory with pnpm. Create the directory structure from the project plan: `apps/{editorial,ops-console,newsletter-public}`, `packages/{db,ui,email,content,agents,analytics,storage,logger,config,config-eslint,config-tsconfig}`, `agency/`, `infra/`, `docs/`. Add `package.json` files for the root and every package with placeholder scripts. Add `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.editorconfig`, `.nvmrc` (Node 20+). Set up shared `tsconfig.json` and ESLint config in their respective config packages. Initialize git.

## Acceptance
- `pnpm install` succeeds
- `pnpm turbo build` succeeds (no-op)
- Tree matches the structure documented in the plan

## Files Likely to Touch
- Root: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.editorconfig`, `.nvmrc`
- Every `apps/*/package.json` and `packages/*/package.json`
- `packages/config-tsconfig/`, `packages/config-eslint/`

## Validation
- See `docs/dev/validation-checklist.md` § Foundations
- The acceptance lines above are the gate; do not advance until both succeed

## Next Commit After This
- **Commit 0.2** — Cloud accounts & domains (manual operator work; Claude Code does not execute, but verifies the checklist before unblocking 0.3)

## Handoff Notes
- Master ADR and master plan are the source of truth. If anything in this file conflicts with them, trust the masters and re-derive the next step.
- Phase 0 ends with the ADR-035 quality gate at `MASTER-bec-project-plan.md` § "Phase 0 quality gate (ADR-035)". Do not begin Phase 1 / Commit 1.1 until that gate is 100% green.
