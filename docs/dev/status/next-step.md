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
- [ ] **Pass 2 branch protection** — queued. Required status checks: `lint`, `type-check`, `unit-tests`, `CodeRabbit`. "Require branches to be up to date before merging". Recommended: enable "Include administrators". PR #12 went through standard merge cleanly (CodeRabbit APPROVED, no `--admin`), so the urgency dropped — but Commit 1.4 is the ops-console scaffold (a real Next.js app, much bigger surface) and Pass-2 makes the most sense to land before that.
- [ ] **CodeRabbit credit limit** — coin-flip per merge. PR #12 reviewed cleanly in ~3 min; PRs #8, #9, #11 all hit the hourly cap. Phase 1 still has ~8 more commits. Either upgrade the CodeRabbit plan or accept the existing `--admin` precedent will trigger ~half the time.
- [ ] **Vercel git-integration reliability** — re-verify PR #11's and PR #12's main-merges actually auto-deployed (PR #9's silently no-op'd). If main is behind on Vercel, the empty-commit-to-`main` trick still works as a manual wake.
- [ ] **Commit 1.1 + Commit 1.2 operator verification** (paired, post-merge) — both rely on Neon's dev branch being writable. Run these together and roll the output into Commit 1.3's task-log entry as acceptance evidence:
  - `pnpm --filter @bec/db db:migrate` → applies `0000_worthless_falcon.sql`.
  - `pnpm --filter @bec/db db:studio` → visually confirm 23 tables + 8 enums.
  - `pnpm --filter @bec/db db:seed` → 1st run: populates 8 sites + 36 categories + 2 authors + 9 budgets.
  - `pnpm --filter @bec/db db:seed` again → 2nd run: idempotent no-op (zero net mutations).

## Current Step

- **Phase:** 1 — Database, Ops Console, Lead Pipeline.
- **Commit:** **1.3 — Migration tests** (correction from prior next-step.md which mis-labeled this as ops-console; the master plan's actual ordering is 1.3 = migration tests, 1.4 = ops-console scaffold + auth).
- **Plan reference:** `docs/dev/MASTER-bec-project-plan.md` § Phase 1 → Commit 1.3.
- **ADRs in scope:** ADR-016 (testing strategy — the schema-migration-tests slice). Touches ADR-038 via the `assertProdDbAccessible()` guard in the test script.
- **Status:** in-flight on branch `phase-1/commit-1.3-migration-tests` cut from `17f610d` (Commit 1.2 merged).

## Commit Prompt

> "Create `scripts/test-migrations.ts` that, in CI, runs every Drizzle migration forward, then rolls back, and verifies the schema returns to its prior state. Wire to the CI workflow."

## Acceptance

Per `MASTER-bec-project-plan.md` § Commit 1.3:

- **CI runs migration tests.** Verified by the new step in `.github/workflows/ci.yml`'s `unit-tests` job — runs `pnpm --filter @bec/db db:test-migrations` against the Neon ephemeral branch after creation, before `pnpm turbo run test:unit`. Step name `Test migrations`. Visible in the PR check-run list.
- **A purposely-broken migration fails CI.** The script applies migrations via Drizzle's `migrate()`. Bad SQL → migrator throws → script exits non-zero → CI step fails → unit-tests job fails → PR can't merge. Won't intentionally commit a broken migration to prove this (we'd just be flagging an artificial issue), but the mechanism is wired and any real future regression hits the same path.

Implementation notes:

- Script lives at `packages/db/src/test-migrations.ts` (under `src/` for tsc include, despite the master plan's `scripts/` parenthetical — same pragmatic deviation as `seed.ts`).
- Run via `pnpm --filter @bec/db db:test-migrations` (`tsx src/test-migrations.ts`).
- Three test phases: (1) forward apply + assert canonical 23 tables + 8 enums; (2) idempotency (re-run is a no-op); (3) rollback via `DROP SCHEMA public CASCADE` + `CREATE SCHEMA public`, assert empty.
- Guarded by `assertProdDbAccessible()` at the top of `main()` — the script is destructive. CI's workflow step sets `PROD_DB_ALLOWED=true` for the explicit opt-in; locally, the operator must opt in deliberately.

## Files Likely to Touch (this branch)

- `packages/db/src/test-migrations.ts` — new script (~205 lines).
- `packages/db/package.json` — `db:test-migrations: tsx src/test-migrations.ts` script.
- `.github/workflows/ci.yml` — new `Test migrations` step in `unit-tests` job, after Neon branch creation, before tests.
- Bookkeeping rolling forward (this branch): `docs/dev/status/task-log.md` (PR #12 entry, already on this branch), `docs/dev/status/next-step.md` (this file).

## Validation

- `pnpm --filter @bec/db type-check` → green.
- `pnpm turbo build lint type-check test:unit` → stays at 56/56.
- **Live verification deferred to this PR's own CI run.** The new step runs against the PR's Neon ephemeral branch; if it succeeds, the acceptance is satisfied by construction.

## Next Commit After This

- **Commit 1.4 — Ops-console scaffold + auth.** First real Next.js app code. Likely deps: `next` 15, `next-auth` 5, `@bec/db`, `@bec/ui`, `@bec/logger`, `@bec/config`. Also pulls `@sentry/nextjs` in (deferred from Commit 0.4) for the editorial / ops-console / newsletter-public apps' per-app Sentry init. Acceptance per master plan: ops-console boots locally, NextAuth login works against a configured provider, theming reflects `@bec/ui` tokens.

## Handoff Notes

- Master ADR and master plan are the source of truth. If anything in this file conflicts with them, trust the masters and re-derive the next step.
- The CodeRabbit "found-rate" trend across recent PRs is informative: PR #11 was big + creditless (0 reviews, --admin); PR #12 was medium + clean (3-min APPROVED). For the test-migrations PR (small diff, CI-mechanism focus), expect ≤2 findings if CodeRabbit reviews at all. The script's `DROP SCHEMA` will likely attract scrutiny — be ready to defend it (it's against a fresh CI ephemeral branch, guarded by `assertProdDbAccessible()`).
- Operator's Storybook/Vercel WIP from Phase 0 (`packages/ui/.storybook/main.ts`, `packages/ui/{package.json,vercel.json,vite.config.ts}`, `turbo.json`, `scripts/seed-1password-vault.sh`, `vercel.storybook.json`, `.gitignore`) is still parked in the working tree across branches. Capture or land it independently when convenient.
- The `@sentry/nextjs` per-app init (deferred from Commit 0.4) is queued for **Commit 1.4** — first Next.js app boots and pulls in the Sentry SDK that side.
