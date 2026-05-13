# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## Operator Pre-Flight

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency

**Credential procurement runbook:** [`docs/runbooks/secrets-setup.md`](../../runbooks/secrets-setup.md) — full 1Password vault setup, item template, per-phase credential checklist, and three options for getting values into local `.env` (manual copy / `op inject` / `op run`).

**Storybook deploy runbook:** [`docs/runbooks/storybook-deploy.md`](../../runbooks/storybook-deploy.md) — Vercel project + DNS + password protection + acceptance verification (closes ADR-035 box 6).

- [x] Create the GitHub repo, public visibility, default branch `main`.
- [x] Auto-merge + auto-delete head branches enabled.
- [x] CodeRabbit GitHub App installed; `.coderabbit.yaml` at repo root.
- [x] `gh auth status` shows ADMIN.
- [x] Initialize git + GitHub remote (Commit 0.1).
- [x] CodeRabbit has reviewed at least one PR.
- [x] **Pass 1 branch protection** applied.
- [x] **1Password vault `BEC-Production`** populated with Sentry × 3 DSNs + auth token + Axiom token + dataset.
- [ ] **Vercel Pro account active + Storybook deployed** — complete `docs/runbooks/storybook-deploy.md`. Closes ADR-035 box 6.
- [ ] **Neon project + ephemeral-branch token in GitHub Actions secrets** as `NEON_API_KEY` + `NEON_PROJECT_ID`. Source from the 1Password `BEC-Production` vault. Once set, the CI `unit-tests` job will exercise the ephemeral-branch lifecycle on every PR. (Phase 0 doesn't strictly need this — the test:unit step works without it because no DB tests exist yet — but it's the prereq for Phase 1's Drizzle work.)
- [ ] **Vercel Remote Cache token in GitHub Actions secrets** as `TURBO_TOKEN` + `TURBO_TEAM`. Source from 1Password. Once set, Turbo's remote cache shares build artifacts across CI runs.
- [ ] **Pass 2 branch protection** — apply now. Required status checks: `lint`, `type-check`, `unit-tests`, `CodeRabbit`. Check "Require branches to be up to date before merging". After Pass 2 lands, the loop's status-file write path stays the same ("fold bookkeeping into the next commit's PR") but auto-merge fires immediately on push because required checks gate the merge naturally — the pre-Pass-2 "poll then merge" dance ends.

## Current Step

- **Phase:** 0 — Workspace & Foundations
- **Step:** **Phase 0 ADR-035 quality gate**
- **Plan reference:** `docs/dev/MASTER-bec-project-plan.md` § "Phase 0 quality gate (ADR-035)"
- **ADRs in scope:** ADR-035 (gate definition itself), plus everything Phase 0 implemented: ADR-001/002/005/007/008/011/012/032/036/037/038/039.
- **Status:** **branch cut, blocked on operator boxes.** `phase-0/gate` branch is cut from `04e0700` and contains the post-merge bookkeeping for Commit 0.6. The gate PR doesn't open until **all seven** ADR-035 boxes are green; per CLAUDE.md non-negotiables, gates are acceptance criteria, not aspirations.

## ADR-035 Gate Checklist

From `MASTER-bec-project-plan.md` § "Phase 0 quality gate (ADR-035)":

- [x] **1. Repo structure matches plan.** ✅ Verified by Commit 0.1's acceptance evidence in `task-log.md` (15 workspace projects, `apps/` × 3 + `packages/` × 11 + `agency/` + `infra/` + `docs/`).
- [x] **2. `pnpm install` and `pnpm turbo build` succeed.** ✅ Verified locally on every commit's PR; CI confirms on every push since Commit 0.6.
- [ ] **3. All cloud accounts provisioned and 1Password is populated.** ⏳ Operator-gated. Sentry × 3 + Axiom items are in the vault (verified before Commit 0.4). Outstanding: Vercel Pro account active (gates ADR-035 box 6 below); Neon project + API token; Turbo Remote Cache token. All three are flagged in § Operator Pre-Flight above.
- [x] **4. Env validation fails loudly when secrets are missing.** ✅ Closed in Commit 0.3 — `@bec/config` rejects missing/wrong values at process boot with a Zod error formatter.
- [ ] **5. Sentry captures a test error from each app.** ⏳ Operator-gated. Manual `pnpm --filter @bec/logger test-emit` from Commit 0.4 once `SENTRY_DSN` is populated in `.env`; verify 2 events (warn + error) tagged with the run's `traceId` appear in the Sentry UI. **Caveat:** the `@sentry/nextjs` per-app initialization half of Commit 0.4's master-plan prompt is deferred to Commit 1.4 (no Next.js apps exist yet); for the gate, the `@bec/logger` smoke is the accepted proxy.
- [ ] **6. Storybook deploys and renders the placeholder.** ⏳ Operator-gated. Complete `docs/runbooks/storybook-deploy.md` to create the `bec-storybook` Vercel project, attach `ui.bestemeraldcoast.com`, enable password protection, and verify the Button story renders. Requires Vercel Pro active.
- [ ] **7. CI runs green on a no-op PR.** ⏳ Will be satisfied by the gate PR itself: the gate branch (`phase-0/gate`) adds zero source code — only `task-log.md` + `next-step.md` — and the CI workflow triggers on `pull_request` regardless of file type. The gate PR's own `lint` / `type-check` / `unit-tests` SUCCESS run is the box-7 evidence. Captured on the `PHASE 0 GATE PASSED` task-log entry when it lands.

## Gate-PR Flow

When all four operator boxes (3, 5, 6, 7-via-this-PR) are queued or done, the Ralph loop runs:

1. Append `## YYYY-MM-DD — PHASE 0 GATE PASSED` entry to `docs/dev/status/task-log.md` (above the Phase Gates section's heading marker). Use the format from `task-log.md` § Phase Gates: checklist 100% green (paste the seven items each checked); next phase opens.
2. Update this `next-step.md` to describe **Phase 1 / Commit 1.1 — Drizzle schemas**.
3. Push `phase-0/gate`; open PR titled `Phase 0 Gate: passed`; the PR body is the filled-in ADR-035 checklist as evidence (per RALPH-LOOP § Phase Gate Commits).
4. CI runs on the PR; on success, box 7 is recorded as cleared via this PR's own run.
5. CodeRabbit + cubic review the doc edits (likely zero findings or a trivial nit).
6. APPROVED → squash-merge as `Phase 0 Gate: passed`.

## Phase 1 / Commit 1.1 (what opens after the gate squash-merges)

- **Commit 1.1 — Drizzle schemas.** In `packages/db/schema/`: `sites.ts`, `businesses.ts`, `leads.ts`, `outreach.ts`, `editorial.ts` (articles + article_businesses + editorial_feedback + authors), `images.ts`, `events.ts`, `audience.ts` (subscribers + newsletter_issues + newsletter_sends), `monetization.ts` (featured_listings + sponsorships), `projects.ts`, `ops.ts` (agent_runs + agent_budgets). Export from `packages/db/schema/index.ts`. Create `packages/db/client.ts` with the configured Neon serverless drizzle client. Generate the initial migration via `drizzle-kit generate`.
- **Acceptance:** `drizzle-kit migrate` runs cleanly; all tables exist in the dev branch; `drizzle-kit studio` shows the schema.
- **Hard dependency on Phase 0 box 3** — Neon project + token must be operationally available before this commit can run end-to-end. Once Pass-2 branch protection is on, every PR for Commit 1.1+ runs `unit-tests` against a fresh Neon ephemeral branch (per the workflow already shipped in Commit 0.6).

## Files Likely to Touch (on the gate branch)

- `docs/dev/status/task-log.md` — Commit 0.6 entry already on this branch (commit TBD-on-push); + `PHASE 0 GATE PASSED` entry added when boxes 3/5/6 close.
- `docs/dev/status/next-step.md` — this file; gets rewritten when boxes close to describe Phase 1 / Commit 1.1.
- No source code changes — that's the point of a gate branch (RALPH-LOOP § Phase Gate Commits: "Adds nothing implementation-wise.").

## Validation

- The gate is itself the validation — all seven ADR-035 boxes ticked.
- The gate PR's own CI run is recorded as box 7's evidence.
- `validation-checklist.md` § Always + § Foundations stay green throughout (no source changes).

## Handoff Notes

- Master ADR and master plan are the source of truth. If anything in this file conflicts with them, trust the masters and re-derive the next step.
- CLAUDE.md non-negotiable: "Do not skip a phase quality gate to 'make progress.' Per ADR-035, gates are acceptance criteria, not aspirations." Operator boxes 3/5/6 must actually close before the gate PR opens.
- The PR body for the gate PR is the **filled-in checklist** from this file's § ADR-035 Gate Checklist, with each box's "✅" line including a one-line proof (file/PR/commit ref).
- After the gate squash-merges, `phase-1/commit-1.1-drizzle-schemas` is cut from `main` and the loop resumes its normal per-commit cadence. The Pass-2 branch protection should be live by then so auto-merge fires immediately on green.
- The `@sentry/nextjs` per-app init (deferred from Commit 0.4) remains queued for **Commit 1.4**.
- Three operator pre-flight items can run **in parallel** — Vercel Pro/Storybook (box 6 + Pre-Flight item 1), Neon secrets (Pre-Flight item 2 / box 3 partial), Turbo Remote Cache secrets (Pre-Flight item 3 / box 3 partial). None block the others.
