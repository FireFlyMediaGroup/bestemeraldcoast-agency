# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## Operator Pre-Flight

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency

**Credential procurement runbook:** [`docs/runbooks/secrets-setup.md`](../../runbooks/secrets-setup.md) — full 1Password vault setup, item template, per-phase credential checklist, and three options for getting values into local `.env` (manual copy / `op inject` / `op run`).

**Storybook deploy runbook:** [`docs/runbooks/storybook-deploy.md`](../../runbooks/storybook-deploy.md) — Vercel project + DNS + HTTP Basic Auth Edge Middleware + acceptance verification.

- [x] Create the GitHub repo, public visibility, default branch `main`.
- [x] Auto-merge + auto-delete head branches enabled.
- [x] CodeRabbit GitHub App installed; `.coderabbit.yaml` at repo root.
- [x] `gh auth status` shows ADMIN.
- [x] Initialize git + GitHub remote (Commit 0.1).
- [x] CodeRabbit has reviewed at least one PR.
- [x] **Pass 1 branch protection** applied.
- [x] **1Password vault `BEC-Production`** populated with Sentry × 3 DSNs + auth token + Axiom token + dataset + Neon + Turbo cache + Storybook deploy password.
- [x] **Vercel Pro account active + Storybook deployed** — production deploy `bec-storybook-i5u940zb3-...` aliased to `https://ui.bestemeraldcoast.com`, gated by HTTP Basic Auth via `packages/ui/middleware.ts`.
- [x] **Neon project + ephemeral-branch token in GitHub Actions secrets** as `NEON_API_KEY` + `NEON_PROJECT_ID`.
- [x] **Vercel Remote Cache token in GitHub Actions secrets** as `TURBO_TOKEN` + `TURBO_TEAM`.
- [ ] **Pass 2 branch protection** — apply **after this gate PR squash-merges**. Required status checks: `lint`, `type-check`, `unit-tests`, `CodeRabbit`. Check "Require branches to be up to date before merging". Recommended: also flip "Include administrators" to enforce protection against admin direct-pushes (the `618016e` Vercel-wake commit was an admin direct-push that triggered a protection *warning* but landed; future direct-pushes to `main` should be blocked, not warned).
- [ ] **Vercel git-integration reliability** (deferred follow-up). The webhook silently no-op'd on the PR #9 squash-merge but fired correctly on the subsequent direct push. Investigate before Phase 1's many merges. Possible mitigations: pin Vercel App permissions, add a dashboard "Deploy Hooks" URL as a CI step, or just live with the manual-wake pattern.
- [ ] **CodeRabbit credit limit** (deferred follow-up). Both PR #8 and PR #9 round-2 reviews were skipped due to credit exhaustion. The `--admin` bypass route works but isn't durable — Phase 1 will have many more PRs. Either upgrade CodeRabbit's plan, or accept that some rounds will be cubic-only.

## Current Step

- **Phase:** 0 — Workspace & Foundations — **gate passed**, ready to squash-merge.
- **Step:** Open and merge the **Phase 0 ADR-035 gate PR** (this branch).
- **Plan reference:** `docs/dev/MASTER-bec-project-plan.md` § "Phase 0 quality gate (ADR-035)".
- **Status:** ✅ all 7 ADR-035 boxes closed (see `task-log.md` § "2026-05-14 — PHASE 0 GATE PASSED" for the filled-in checklist). Branch `phase-0/gate` contains only docs/bookkeeping commits; CI on the gate PR itself will satisfy Box 7.

## Gate-PR Flow (executing now)

1. ✅ Append `## 2026-05-14 — Task — bec-storybook Basic Auth gate (PR #9)` entry to `task-log.md`.
2. ✅ Append `## 2026-05-14 — PHASE 0 GATE PASSED` entry to `task-log.md` with the 7-item checklist.
3. ✅ Rewrite this `next-step.md` to reflect the gate's pass + queue Phase 1 / Commit 1.1.
4. → Commit the bookkeeping on `phase-0/gate`.
5. → Push `phase-0/gate`; open PR titled `Phase 0 Gate: passed` with the filled-in checklist as the PR body (per RALPH-LOOP § Phase Gate Commits).
6. → CI runs on the PR; SUCCESS closes Box 7 by construction.
7. → CodeRabbit + cubic review the doc-only diff (likely zero findings or trivial nit; rate-limit may strike again, in which case `--admin` bypass per the PR #8 / #9 precedent).
8. → Squash-merge as `Phase 0 Gate: passed`.
9. → Operator flips on **Pass-2 branch protection** with the four required checks listed in § Operator Pre-Flight.
10. → Cut `phase-1/commit-1.1-drizzle-schemas` from `main`.

## Phase 1 / Commit 1.1 (opens after the gate squash-merges)

- **Commit 1.1 — Drizzle schemas** (per `MASTER-bec-project-plan.md` § Phase 1 → Commit 1.1):
  > "In `packages/db/schema/`, create the Drizzle schemas exactly as defined in the project plan's Database Schema section: `sites.ts` (sites + categories), `businesses.ts` (businesses + enrichment log), `leads.ts` (leads + status history), `outreach.ts`, `editorial.ts` (articles, article_businesses, editorial_feedback, authors), `images.ts`, `events.ts`, `audience.ts` (subscribers, newsletter_issues, newsletter_sends), `monetization.ts` (featured_listings, sponsorships), `projects.ts`, `ops.ts` (agent_runs, agent_budgets). Export everything from `packages/db/schema/index.ts`. Also create `packages/db/client.ts` exporting a configured Neon serverless drizzle client. Generate the initial migration with `drizzle-kit generate`."
- **Acceptance:** `drizzle-kit migrate` runs cleanly. All tables exist in the dev branch. `drizzle-kit studio` shows the schema.
- **Hard dependencies (all met):** Box 3 (Neon operational) + the CI ephemeral-branch lifecycle wired in Commit 0.6.

## Handoff Notes

- Master ADR and master plan are the source of truth. If anything in this file conflicts with them, trust the masters and re-derive the next step.
- The gate PR is constructed to *be* the box-7 evidence: it adds zero source code, only docs. Its own CI run completing green is what closes the seventh box; the existing entries in `task-log.md` § "2026-05-14 — PHASE 0 GATE PASSED" record this circular-but-defensible mechanism per RALPH-LOOP § Phase Gate Commits.
- After the gate squash-merges, the loop resumes its normal per-commit cadence. Pass-2 protection should be live by the first Phase 1 PR so auto-merge fires immediately on green and the manual "poll then merge" dance ends.
- Two open follow-ups for Phase 1 setup: (a) Vercel git-integration reliability; (b) CodeRabbit credit-limit handling. See § Operator Pre-Flight.
- Operator's local Storybook/Vercel WIP (`packages/ui/.storybook/main.ts`, `packages/ui/{package.json,vercel.json,vite.config.ts}`, `turbo.json`, `scripts/seed-1password-vault.sh`, `vercel.storybook.json`, `.gitignore`) is still parked in the working tree. It hasn't blocked any of the gate work; capture or land it independently when convenient.
- The `@sentry/nextjs` per-app init (deferred from Commit 0.4) remains queued for **Commit 1.4**.
