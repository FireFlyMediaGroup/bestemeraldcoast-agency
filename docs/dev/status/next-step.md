# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## 🔴 Security action (still open)

- **Rotate the Neon `neondb_owner` password.** A shell `.env` sourcing during the Commit 1.4 DB verification echoed the connection string into command output. Rotate in Neon → update `.env` (`DATABASE_URL` + `DATABASE_URL_UNPOOLED`) → update the `BEC-Production` 1Password item. Dev branch, low real-world risk, but rotate on principle.

## Operator Pre-Flight

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency
**Runbooks:** [`secrets-setup.md`](../../runbooks/secrets-setup.md) · [`storybook-deploy.md`](../../runbooks/storybook-deploy.md) · [`ops-console-deploy.md`](../../runbooks/ops-console-deploy.md)

- [x] Phase 0 ADR-035 gate passed; 1Password + Vercel Pro + Storybook + Neon/Turbo GH secrets done.
- [x] Commit 1.1/1.2 live-verified; Pass-2 branch protection LIVE; CodeRabbit-advisory proven across PRs #17–#20.
- [ ] **Rotate Neon password** (security action above).
- [ ] **Run `db:migrate` + `db:seed` for the Commit 1.10 editorial-rotation tables** against the Neon dev branch (operator-gated like the Commit 1.1/1.2 verification — local `next build`/DB writes are env-guarded by ADR-038; CI runs the migration test on an ephemeral branch). The seed's tail asserts `getSeasonalWeight('charter_fishing', 2026-06-15) === 1.5` (Commit 1.10 acceptance) — capture that line as evidence.
- [ ] **Deploy `bec-ops-console` to Vercel + verify Resend domain** — unblocks device/runtime-gated acceptance for Commits 1.4–1.9.
- [ ] **Provision Upstash Redis** + set `UPSTASH_REDIS_REST_URL` / `_TOKEN`.
- [ ] **Set `GOOGLE_MAPS_API_KEY` / `AGENT_API_KEY` / `OPS_CONSOLE_URL` / `DATABASE_URL_UNPOOLED`** in the agent runtime env (Scout 1.8 + Diagnoser 1.9).
- [ ] Add a 180×180 `apps/ops-console/app/apple-icon.png` (1.7 follow-up; non-blocking).
- [ ] (Optional) Promote `CodeRabbit` to a required check only if reliability is fixed.

## Current Step

- **Phase:** 1 — Database, Ops Console, Lead Pipeline.
- **Commit:** **1.10 — Editorial rotation foundation schema** (this branch: `phase-1/commit-1.10-editorial-rotation-schema`).
- **Plan ref:** `MASTER-bec-project-plan.md` § Phase 1 → Commit 1.10 + § Editorial Rotation Specification (ADR-040).
- **ADRs:** ADR-040 (editorial-pipeline coupling + niche rotation — the schema + seed data come straight from its spec tables), ADR-002/003 (Postgres source of truth; Drizzle migrations), ADR-038 (prod-write guard on the migrate/seed scripts — unchanged). **Back to real `packages/db` code** (schema + migration + seed), not prompt artifacts.
- **Status:** branch cut from `33a1e7b`; bookkeeping (this rewrite + the Commit 1.9 task-log entry) lands first, then the schema/migration/seed/helper.

## What Commit 1.10 must ship

Per master plan § Commit 1.10:

> Add `packages/db/schema/editorial-rotation.ts`: `niches`, `niche_category_map`, `season_weights`, `season_events`, `pipeline_signals`. Generate migrations. Update `packages/db/seed.ts` to seed the **10 priority niches** (commercial/editorial values per the profile table), the **30 niche-category-archetype mappings** (3 archetypes × 10 niches), the **120 monthly season weights** (10 niches × 12 months), and the **8 named season events**. Add `minimumWeeklyArticles` (default 2) + `maximumWeeklyArticles` (default 3) to the `sites` table.

**Acceptance**: All tables created. Seeded data is queryable. `getSeasonalWeight('charter_fishing', new Date('2026-06-15'))` returns **1.5** with the "Wedding peak" event active (it boosts other niches, not charter, so charter returns its June base 1.5).

Implementation notes:
- New schema file `packages/db/src/schema/editorial-rotation.ts`; add to the `schema/index.ts` barrel; add the 2 integer columns to `sites.ts`.
- `season_events` gets a `uniqueIndex` on `name` (a deliberate, spec-compatible addition) so the seed can `onConflictDoNothing` and stay idempotent — same pattern as every other seeded table. Document the rationale inline.
- Migration via `pnpm --filter @bec/db db:generate` (offline schema diff → `migrations/0003_*.sql`; drizzle-kit `generate` needs no DB connection per `drizzle.config.ts`).
- `getSeasonalWeight` helper: pure core `computeSeasonalWeight(weights, events, nicheId, date)` (monthly base; an active named event whose `boostedNicheIds` includes the niche overrides with its multiplier — take the max if several) + a thin DB wrapper `getSeasonalWeight(nicheId, date)`. Export from the package entry.
- The seed-tail asserts the acceptance example (`charter_fishing` @ 2026-06-15 → 1.5) and logs it — the live verification runs under the existing operator/CI-gated `db:seed` flow (matches the Commit 1.1/1.2 precedent; no new test infra, `@bec/db` has no vitest).
- `test-migrations.ts`: bump `EXPECTED_TABLES` 27 → **32** (the 5 new tables; no new enums) so the canonical-schema assertion stays loud-on-drift.
- Local gate: `pnpm turbo lint type-check test:unit` (type-check covers the new schema + helper). Live migrate/seed is operator-gated (ADR-038), captured in the pre-flight.

## Next Commit After This

- **Phase 1 / Commit 1.11 — Pipeline signal capture** (Scout/Diagnoser write `pipeline_signals`; `POST/GET /pipeline-signals` agent-API endpoints).

## Handoff Notes

- Master ADR + master plan are source of truth. CodeRabbit-advisory standing; follow `RALPH-LOOP.md` 7b–7e.
- Commit 1.10 is the first code-bearing commit since 1.7 — `type-check` is the load-bearing local gate; `next build` Vercel-authoritative; live DB migrate/seed is ADR-038-guarded + operator-gated (CI runs the migration test on an ephemeral Neon branch).
- Operator's parked Phase-0 Storybook/Vercel WIP stays unstaged across branches.
- Commits 1.4–1.10 device/runtime/DB-gated acceptance collapse onto the Vercel deploy + the agent env keys + the dev-branch migrate/seed run in the pre-flight.
