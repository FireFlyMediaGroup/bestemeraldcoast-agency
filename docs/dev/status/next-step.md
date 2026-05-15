# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## Operator Pre-Flight

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency

**Credential procurement runbook:** [`docs/runbooks/secrets-setup.md`](../../runbooks/secrets-setup.md) — full 1Password vault setup, item template, per-phase credential checklist, and three options for getting values into local `.env`.

**Storybook deploy runbook:** [`docs/runbooks/storybook-deploy.md`](../../runbooks/storybook-deploy.md) — Vercel project + DNS + HTTP Basic Auth + acceptance verification.

- [x] Phase 0 ADR-035 quality gate **passed** (PR #10, merged `a807616`).
- [x] **1Password vault `BEC-Production`** populated (Sentry × 3 + Axiom + Neon + Turbo cache + Storybook deploy password).
- [x] **Vercel Pro + Storybook deployed** at `https://ui.bestemeraldcoast.com` behind HTTP Basic Auth.
- [x] **Neon project + ephemeral-branch token** in GitHub Actions secrets (`NEON_API_KEY` + `NEON_PROJECT_ID`).
- [x] **Vercel Remote Cache token** in GitHub Actions secrets (`TURBO_TOKEN` + `TURBO_TEAM`).
- [ ] **Pass 2 branch protection** — still queued. `main` rule → required checks `lint`, `type-check`, `unit-tests`, `CodeRabbit`; "require branches up to date"; recommended "Include administrators". Commits 1.2 + 1.3 landed via the standard path so urgency is moderate, but **Commit 1.4 (ops-console, large Next.js surface) is the right gate-before point**.
- [ ] **CodeRabbit credit limit** — coin-flip per merge. PRs #12 and #13 reviewed cleanly; #8/#9/#11 hit the hourly cap. ~7 Phase-1 commits remain. Upgrade the plan or accept the `--admin` precedent ~half the time.
- [ ] **Vercel git-integration reliability** — re-verify recent main-merges actually auto-deployed (PR #9's silently no-op'd). Empty-commit-to-`main` is the manual wake.
- [ ] **Commit 1.1 + 1.2 operator verification** (post-merge, coupled) — **gated on the current task landing.** `db:migrate` + `db:studio` use drizzle-kit's own driver (unaffected by the neon-http bug) and can run anytime; `db:seed` ×2 must wait until `task/2026-05-15-db-pool-driver` merges (seed currently throws the `sql`-template error against a live DB). After this task: `pnpm --filter @bec/db db:migrate` → `db:studio` (confirm 23 tables + 8 enums) → `db:seed` (1st run populates) → `db:seed` again (idempotent no-op). Roll output into the next task-log entry.

## Current Step

- **Phase:** 1 — Database, Ops Console, Lead Pipeline.
- **Step:** **Off-plan task — `task/2026-05-15-db-pool-driver`.** Standardize `@bec/db`'s `client.ts` on the Pool-based `drizzle-orm/neon-serverless` driver (the one the Commit 1.3 migration test proved works with `@neondatabase/serverless` 1.x). `seed.ts` inherits the fix via `getDb()`.
- **Type:** Off-plan remediation (task-template workflow). Not a numbered commit — does not appear in `MASTER-bec-project-plan.md`; task-log entry uses the date-stamped `## YYYY-MM-DD — Task — <Title>` format.
- **Why before Commit 1.4:** Commit 1.4 (ops-console scaffold) is the first app code to issue live `@bec/db` queries via `getDb()`. With the neon-http driver that throws `"This function can now be called only as a tagged-template function"` at query time. Fixing the driver now prevents 1.4 from hitting the wall mid-scaffold and unblocks the operator's `db:seed` verification.
- **Status:** in-flight on branch `task/2026-05-15-db-pool-driver` cut from `333779e`.

## What This Task Does

- `packages/db/src/client.ts` — swap `neon()` + `drizzle-orm/neon-http` for `Pool` + `drizzle-orm/neon-serverless`. `neonConfig.webSocketConstructor = ws` at module scope (config write, not a connection — pool creation stays deferred to first `getDb()`). `Database` type → `NeonDatabase<typeof schema>`.
- `seed.ts` — **no change needed**; it calls `getDb()` and inherits the Pool driver. `process.exit(0)` already handles pool teardown.
- `test-migrations.ts` — comment updated: the "follow-up tracked in next-step.md" note now reads "resolved (this task)".
- `ws` + `@types/ws` already deps (added in Commit 1.3). `@neondatabase/serverless` stays `~1.0.1`.

## Acceptance

- `pnpm --filter @bec/db type-check` → green. ✅ (done)
- `pnpm turbo build lint type-check test:unit` → 56/56. ✅ (done)
- The Pool driver is already CI-proven against a live Neon ephemeral branch via Commit 1.3's `Test migrations` step (same driver, same `@neondatabase/serverless` version). `client.ts`'s query-builder path (`drizzle(pool, { schema })`) is the standard documented neon-serverless usage; its first live exercise is the operator's post-merge `db:seed` and Commit 1.4's ops-console queries.
- **Operator post-merge:** run the coupled Commit 1.1/1.2 verification (above). `db:seed` succeeding end-to-end is the real proof the driver swap works for the query-builder path.

## Files Likely to Touch (this branch)

- `packages/db/src/client.ts` — driver swap (done).
- `packages/db/src/test-migrations.ts` — comment update (done).
- `docs/dev/status/task-log.md` — Commit 1.3 entry (done, on this branch).
- `docs/dev/status/next-step.md` — this file.

## Next Commit After This

- **Phase 1 / Commit 1.4 — Ops-console scaffold + auth.** First real Next.js app. Deps: `next` 15, `next-auth` 5, `@bec/db` (now Pool-driver), `@bec/ui`, `@bec/logger`, `@bec/config`, and `@sentry/nextjs` (deferred from Commit 0.4 — per-app Sentry init lands with the first Next.js app). Acceptance per master plan: ops-console boots locally, NextAuth login works, theming reflects `@bec/ui` tokens.

## Handoff Notes

- Master ADR and master plan are the source of truth.
- Off-plan task ordering: this task is inserted between Commit 1.3 and Commit 1.4 as remediation; it does not renumber any commit. `MASTER-bec-project-plan.md` is untouched.
- The `db:seed` verification for Commits 1.1/1.2 is the natural smoke test for this task's driver swap — they're now coupled. Operator should do them together once this task merges.
- Operator's Phase-0 Storybook/Vercel WIP (`packages/ui/.storybook/main.ts`, `packages/ui/{package.json,vercel.json,vite.config.ts}`, `turbo.json`, `scripts/seed-1password-vault.sh`, `vercel.storybook.json`, `.gitignore`) is still parked in the working tree across branches. Untouched by Phase 1 + this task.
