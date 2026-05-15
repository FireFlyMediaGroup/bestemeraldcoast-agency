# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## Operator Pre-Flight

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency

**Credential procurement runbook:** [`docs/runbooks/secrets-setup.md`](../../runbooks/secrets-setup.md) — full 1Password vault setup, item template, per-phase credential checklist, and three options for getting values into local `.env` (manual copy / `op inject` / `op run`).

**Storybook deploy runbook:** [`docs/runbooks/storybook-deploy.md`](../../runbooks/storybook-deploy.md) — Vercel project + DNS + HTTP Basic Auth Edge Middleware + acceptance verification.

- [x] Phase 0 ADR-035 quality gate **passed** (PR #10, merged `a807616`).
- [x] **1Password vault `BEC-Production`** populated with Sentry × 3 + Axiom + Neon + Turbo cache + Storybook deploy password.
- [x] **Vercel Pro account active + Storybook deployed at `https://ui.bestemeraldcoast.com`** behind HTTP Basic Auth.
- [x] **Neon project + ephemeral-branch token in GitHub Actions secrets** (`NEON_API_KEY` + `NEON_PROJECT_ID`).
- [x] **Vercel Remote Cache token in GitHub Actions secrets** (`TURBO_TOKEN` + `TURBO_TEAM`).
- [ ] **Pass 2 branch protection** — still queued. Settings → Branches → `main` rule → require status checks `lint`, `type-check`, `unit-tests`, `CodeRabbit`; "Require branches to be up to date before merging"; recommended "Include administrators" so admin direct-pushes are blocked, not warned. **Worth doing before Phase 1 stabilizes** — Commit 1.1 already shipped via `--admin` due to CodeRabbit's credit ceiling, and that pattern isn't durable.
- [ ] **CodeRabbit credit limit** — hot follow-up. Round-1 reviews on PR #8, #9, and #11 all skipped due to the hourly cap ("exceeded the limit for the number of commits that can be reviewed per hour"). Only PR #10 got a clean APPROVED. With ~10 more Commit-level PRs coming in Phase 1, this needs a real fix: either upgrade the CodeRabbit plan (most direct), accept cubic-only review for half the PRs (cheapest, partial coverage), or carve up commits more finely so credits don't burn in bursts.
- [ ] **Vercel git-integration reliability** — soft follow-up. PR #9's squash-merge to `main` silently no-op'd Vercel's webhook; a manual empty commit (`618016e`) successfully waked it. PR #11's merge to main has not been re-checked yet — confirm Vercel auto-deployed or kick it manually before relying on it for Phase 1 / Commit 1.3+ work that exercises live infrastructure.
- [ ] **Commit 1.1 operator verification (post-merge)** — to roll up into the Commit 1.2 task-log entry as Commit 1.1's full acceptance evidence:
  - `pnpm --filter @bec/db db:migrate` against Neon's dev branch → applies `0000_worthless_falcon.sql`.
  - `pnpm --filter @bec/db db:studio` → visually confirm all 23 tables + the 8 enums.

## Current Step

- **Phase:** 1 — Database, Ops Console, Lead Pipeline.
- **Commit:** 1.2 — Seed data.
- **Plan reference:** `docs/dev/MASTER-bec-project-plan.md` § Phase 1 → Commit 1.2.
- **ADRs in scope:** ADR-018 (agent budget table — 9 default budgets), ADR-021 (editorial taxonomy — 6 categories per archetype), ADR-027 (authors — 2 seeded), ADR-032 (3 archetypes → 8 sites with placeholder `SiteTheme` tokens). Cross-references in `packages/db/src/seed.ts`'s top comment.
- **Status:** in-flight on branch `phase-1/commit-1.2-seed-data` cut from `93e788e` (Phase 1 / Commit 1.1 merged).

## Commit Prompt

> "Create `packages/db/seed.ts` that idempotently seeds: 8 site rows with placeholder theme tokens (one per archetype), 3-5 categories per site (per ADR-021's taxonomy), 2 author rows ('BEC Editorial' as AI + the operator as human reviewer), agent budget rows for all 9 agents (per ADR-018). Add a `pnpm db:seed` script."

## Acceptance

Per `MASTER-bec-project-plan.md` § Commit 1.2:

- **Running seed against an empty DB populates it.** Verified by `pnpm --filter @bec/db db:seed` against a fresh Neon ephemeral branch (CI's existing `unit-tests` job creates one); script prints row-counts and exits 0.
- **Running it again is a no-op.** Verified by running the seed a second time on the same branch — every insert hits `.onConflictDoNothing()`'s unique-constraint target and resolves without error or duplicate row.

Implementation notes:

- File lives at `packages/db/src/seed.ts` (not `packages/db/seed.ts` as the master plan's parenthetical suggests — keeping it under `src/` matches the dual-entry pattern + lets tsc type-check it).
- Run via `pnpm --filter @bec/db db:seed`, backed by a new `db:seed: tsx src/seed.ts` script. Loads `.env` via `dotenv` before importing `@bec/db`'s client (so `@bec/config`'s env validation passes).
- **3-5 categories vs ADR-021's 6**: ADR-021 is authoritative per the loop's source-of-truth rule; the seed uses 6 per archetype.
- **`SiteTheme` is inlined** in the seed (same pattern as `packages/db/src/schema/types.ts`) rather than imported from `@bec/ui` — keeps `@bec/db` independent of UI.

## Files Likely to Touch

- `packages/db/src/seed.ts` — main seed implementation.
- `packages/db/package.json` — `db:seed` script + `dotenv` devDependency.
- `pnpm-lock.yaml` — `dotenv` pickup.
- Bookkeeping rolling forward (this branch): `docs/dev/status/task-log.md` (PR #11 entry, already on this branch), `docs/dev/status/next-step.md` (this file).

## Validation

- `pnpm --filter @bec/db type-check` → green.
- `pnpm turbo build lint type-check test:unit` → stays at 56/56.
- Manual seed end-to-end against an actual Postgres instance: deferred to operator post-merge (same model as Commit 1.1's `db:migrate` acceptance). Local validation in this PR is scope-bounded to "the script compiles + type-checks." A future commit (probably Commit 1.6 — CI ephemeral-branch integration tests) wires `db:migrate` + `db:seed` into CI's `unit-tests` job so every PR gets the end-to-end check automatically.

## Next Commit After This

- **Commit 1.3 — `ops-console` Next.js scaffold + NextAuth + theming wired to @bec/ui** (the next commit in `MASTER-bec-project-plan.md` § Phase 1). Will be the first real app code that imports `@bec/db`'s `getDb()`.

## Handoff Notes

- Master ADR and master plan are the source of truth. If anything in this file conflicts with them, trust the masters and re-derive the next step.
- Operator's Storybook/Vercel WIP from Phase 0 (`packages/ui/.storybook/main.ts`, `packages/ui/{package.json,vercel.json,vite.config.ts}`, `turbo.json`, `scripts/seed-1password-vault.sh`, `vercel.storybook.json`, `.gitignore`) is still parked in the working tree across branches. Capture or land it independently when convenient; the gate work and Commits 1.1/1.2 haven't touched any of those files.
- The `@sentry/nextjs` per-app init (deferred from Commit 0.4) is queued for **Commit 1.4** — first Next.js app boots and pulls in the Sentry SDK that side.
- After Commit 1.2 lands, the next-step.md should also include the Commit 1.1 operator-verification evidence (db:migrate + db:studio outputs) so Phase 1 / Commit 1.1's full acceptance is closed in the gate trail.
