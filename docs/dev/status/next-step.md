# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## Operator Pre-Flight

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency

**Credential procurement runbook:** [`docs/runbooks/secrets-setup.md`](../../runbooks/secrets-setup.md) — full 1Password vault setup, item template, per-phase credential checklist, and three options for getting values into local `.env` (manual copy / `op inject` / `op run`).

**Storybook deploy runbook:** [`docs/runbooks/storybook-deploy.md`](../../runbooks/storybook-deploy.md) — Vercel project + DNS + password protection + acceptance verification (closes the second half of Commit 0.5's acceptance).

- [x] Create the GitHub repo, public visibility, default branch `main`.
- [x] Auto-merge + auto-delete head branches enabled.
- [x] CodeRabbit GitHub App installed; `.coderabbit.yaml` at repo root.
- [x] `gh auth status` shows ADMIN.
- [x] Initialize git + GitHub remote (Commit 0.1).
- [x] CodeRabbit has reviewed at least one PR.
- [x] **Pass 1 branch protection** applied.
- [x] **1Password vault `BEC-Production`** populated with Sentry × 3 DSNs + auth token + Axiom token + dataset (for Commit 0.4).
- [ ] **Vercel Pro account active + Storybook deployed** — complete `docs/runbooks/storybook-deploy.md` to close Commit 0.5's deployed-Storybook acceptance half. Required before the Phase 0 ADR-035 gate can pass. Has no hard dependency on Commit 0.6 — can run in parallel.
- [ ] **Neon project + ephemeral-branch token** — Commit 0.6's `test:unit` job runs against a Neon ephemeral branch. Operator must (a) confirm the Neon project from Commit 0.2 exists with a `main` branch, (b) generate an API token scoped to `branch:create`/`branch:delete`, (c) add it to GitHub Actions repo secrets as `NEON_API_KEY` + `NEON_PROJECT_ID`. Source the values from the 1Password `BEC-Production` vault (add the item if missing per the runbook's per-phase checklist).
- [ ] **Vercel Remote Cache token** — Commit 0.6 wires Turbo's remote cache to Vercel. Operator generates a Vercel access token + a team ID, adds them to GitHub Actions repo secrets as `TURBO_TOKEN` + `TURBO_TEAM`. Source from 1Password.
- [ ] **Pass 2 branch protection** — apply **after Commit 0.6 lands and its CI run is green on a throwaway PR**. Required status checks: the CI job names emitted by `.github/workflows/ci.yml` + `CodeRabbit`. Check "Require branches to be up to date before merging". After Pass 2, the loop's status-file write path collapses (RALPH-LOOP § 7b post-Pass-2 — auto-merge fires immediately on push because required checks gate the merge naturally).

## Current Step

- **Phase:** 0 — Workspace & Foundations
- **Commit:** 0.6 — CI baseline
- **Plan reference:** `docs/dev/MASTER-bec-project-plan.md` § Phase 0 → Commit 0.6
- **ADRs in scope:** ADR-039 (Turborepo task graph — this commit wires the remote cache + ensures CI honors the `^build` / `^lint` / `^type-check` dependencies already declared in `turbo.json`), ADR-016 (Vitest + Playwright + schema migration tests — only the Vitest unit-test slice is in scope here; Playwright comes in Phase 1, schema-migration tests in Phase 1+), ADR-035 (CI green on a no-op PR is one of the seven Phase 0 quality-gate boxes).
- **Status:** queued (branch `phase-0/commit-0.6-ci-baseline` cut from `7f89491`; only the post-merge bookkeeping for Commit 0.5 is on this branch so far).

## Commit Prompt (excerpt)

> Create `.github/workflows/ci.yml` that on every PR: installs with pnpm, runs `turbo lint`, `turbo type-check`, `turbo test:unit` against a Neon ephemeral branch. Cache Turbo, cache pnpm. Add Vercel Remote Cache integration.

## Acceptance

Per `MASTER-bec-project-plan.md` § Commit 0.6:

- **A throwaway PR runs CI in under 5 minutes.** Verified by opening a no-op PR after this commit merges and reading the GitHub Actions run duration. The five-minute budget covers: `actions/checkout`, pnpm setup with cache hit, `pnpm install --frozen-lockfile`, Turbo runs of `lint`, `type-check`, and `test:unit` with Turbo's remote cache and pnpm's content-addressable cache restored, and a Neon ephemeral branch lifecycle (create, run migrations if any, drop) for `test:unit`.

Inferred lower bars (carry the discipline from prior commits, not new requirements per the master plan):

- Workflow uses `ubuntu-latest`, Node `>=22.0.0` per `engines`, `pnpm@10.13.1` per `packageManager`.
- All three turbo tasks (`lint`, `type-check`, `test:unit`) appear as either a single job or distinct jobs in the GitHub Actions status-check list; the names are what get added to **Pass 2 branch protection** as required checks, so name them stably.
- Secrets used: `NEON_API_KEY`, `NEON_PROJECT_ID`, `TURBO_TOKEN`, `TURBO_TEAM`. No other secrets read.
- The workflow does **not** run on `push` to `main` — only on `pull_request` against `main` (per ADR-039's "no broken builds get cached" intent: PRs gate code; `main` is what's already passed).

## Files Likely to Touch

- `.github/workflows/ci.yml` — the new workflow file. One job per Turbo task (so each becomes a named check), or one job with three sequential steps + tee'd logs (less observable in the GitHub UI but simpler). Pick during implementation.
- `.github/actions/setup/action.yml` — composite action for repeated setup (`actions/checkout`, `pnpm/action-setup`, `actions/setup-node` with cache, `pnpm install --frozen-lockfile`). Optional — only if the workflow has multiple jobs sharing setup.
- `turbo.json` — possibly add `remoteCache: { signature: true }` if Turbo's signing is desired; otherwise the Vercel Remote Cache integration is purely an env-var concern.
- `docs/runbooks/ci-baseline.md` — *optional*. Skip unless operator setup is non-obvious; the secrets list above in § Operator Pre-Flight may be enough.
- Bookkeeping rolling forward (this branch): `docs/dev/status/task-log.md` (Commit 0.5 entry, already landed on this branch in commit `d1c613f`), `docs/dev/status/next-step.md` (this file).

## Validation

- `validation-checklist.md` § Always + § Foundations.
- Open a no-op PR after merge; watch the GitHub Actions run. PASS if total wall-clock for the workflow is < 5 min on a cache-hit run. Capture the run URL on the Commit 0.6 task-log entry as evidence.
- All three Turbo tasks finish with exit 0 on the no-op PR.
- `pnpm turbo build lint type-check test:unit` stays green locally.

## Next Commit After This

- **Phase 0 ADR-035 quality gate.** After Commit 0.6 merges and the no-op-PR CI run passes, the loop opens a dedicated `phase-0/gate` branch (per RALPH-LOOP § Phase Gate Commits) that adds no code, fills in the seven Phase 0 checklist boxes in `task-log.md`, and squash-merges as `Phase 0 Gate: passed`.
- The seven boxes from `MASTER-bec-project-plan.md` § "Phase 0 quality gate (ADR-035)":
  1. Repo structure matches plan.
  2. `pnpm install` and `pnpm turbo build` succeed.
  3. All cloud accounts provisioned and 1Password is populated.
  4. Env validation fails loudly when secrets are missing.
  5. Sentry captures a test error from each app.
  6. Storybook deploys and renders the placeholder.
  7. CI runs green on a no-op PR.
- Boxes 1, 2, 4, and 7 are objectively code/CI-derivable on merge of 0.6. Boxes 3, 5, 6 are operator-gated (1Password vault, Sentry/Axiom manual smoke from 0.4, Storybook deploy per `storybook-deploy.md`).
- After the gate, **Phase 1 / Commit 1.1** — Drizzle + Neon schema seed — opens.

## Handoff Notes

- Master ADR and master plan are the source of truth. If anything in this file conflicts with them, trust the masters and re-derive the next step.
- This branch (`phase-0/commit-0.6-ci-baseline`) was cut immediately after PR #6 merged so Commit 0.5's bookkeeping (task-log entry + this rewrite) can land in 0.6's PR per RALPH-LOOP § 7b post-Pass-1 write policy. Do **not** push this branch until the CI workflow + any optional setup composite-action are in.
- Neon ephemeral-branch integration: the typical pattern is a small bash step that hits `https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches` with the API token, captures the connection string, sets `DATABASE_URL` for the `test:unit` step, then deletes the branch in an `always()` cleanup step. Don't rely on third-party Neon GitHub Actions unless they're maintained by Neon themselves — supply-chain risk per the security audits already on file.
- Vercel Remote Cache: Turbo reads `TURBO_TOKEN` + `TURBO_TEAM` from env automatically; no `turbo.json` change needed unless we want signed cache artifacts.
- CodeRabbit + cubic both treat the workflow YAML as in-scope and will lint it. Expect findings on shell quoting, pinning action versions to SHAs, and `permissions:` defaults. Plan to address them in round 1, not push back.
- After Pass-2 protection, the loop's `/ship-task` write path is back to the same "fold bookkeeping into the next commit's PR" pattern — but auto-merge will now fire immediately on push because required status checks gate the merge naturally. The pre-Pass-2 "poll then merge" dance ends with Commit 0.6.
- The `@sentry/nextjs` per-app init (deferred from Commit 0.4) remains queued for **Commit 1.4**.
