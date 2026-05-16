# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## 🔴 Security action (do this first)

- **Rotate the Neon `neondb_owner` password.** During Commit 1.4's DB verification a shell `.env` sourcing caused job-control to echo the full Neon connection string (with password) into command output. Treat `npg_…` as exposed. Rotate in the Neon console → update `.env` (`DATABASE_URL` + `DATABASE_URL_UNPOOLED`) → update the `BEC-Production` 1Password item. Low real-world risk (Neon branch, IP-scoped, short-lived dev data) but rotate on principle. All subsequent commands were filtered to never reprint connection strings.

## Operator Pre-Flight

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency
**Runbooks:** [`secrets-setup.md`](../../runbooks/secrets-setup.md) · [`storybook-deploy.md`](../../runbooks/storybook-deploy.md)

- [x] Phase 0 ADR-035 gate passed (PR #10).
- [x] 1Password `BEC-Production` populated; Vercel Pro + Storybook live; Neon + Turbo-cache GH secrets set.
- [x] **Neon dev-branch URLs in `.env`** + **Commit 1.1/1.2 verification done** — see § Verified Live below.
- [ ] **Rotate Neon password** (see Security action above).
- [ ] **Pass 2 branch protection** — apply now. `main` rule → required checks `lint`, `type-check`, `unit-tests`, `CodeRabbit`; "require branches up to date"; recommended "Include administrators". Commit 1.4 is a large surface and a good gate-before point; do it before 1.5.
- [ ] **CodeRabbit credit limit** — still a coin-flip per merge. ~6 Phase-1 commits remain.
- [ ] **ops-console Vercel deploy** (operator, parallels the Storybook runbook) — create Vercel project `bec-ops-console`, root `apps/ops-console`, map `ops.bestemeraldcoast.com`. Set env: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL=https://ops.bestemeraldcoast.com`, `OPERATOR_EMAIL`, `RESEND_API_KEY`, `SENTRY_DSN` (+ `SENTRY_AUTH_TOKEN` for source-map upload), optional `NEXT_PUBLIC_SENTRY_DSN`. This is required for Commit 1.4's acceptance (login on iPhone Safari, magic link e2e) — that acceptance is operator-gated and cannot be tested locally.
- [ ] **Resend sending domain** — verify `bestemeraldcoast.com` (or a subdomain) in Resend + add the DNS records, so `ops@bestemeraldcoast.com` magic-link mail delivers (ADR-013). Until then NextAuth falls back to Resend's onboarding sender.

## Verified Live (this session, against the Neon dev branch)

These close acceptance for prior commits empirically (not just type-check):

- ✅ **Commit 1.1 acceptance** — `pnpm --filter @bec/db db:migrate` applied `0000_worthless_falcon` (23 tables) **and** the new `0001_previous_rhino` (4 Auth.js tables) cleanly. 27 tables total.
- ✅ **Commit 1.2 acceptance** — `db:seed` run 1 populated 8 sites + 48 categories + 2 authors + 9 agent budgets; run 2 was an idempotent no-op (exit 0, `.onConflictDoNothing`). Ran with a process-scoped `PROD_DB_ALLOWED=true` (the documented ADR-038 escape hatch — `.env` default stays `false`; never edited).
- ✅ **Driver swap (PR #14)** — the Pool query-builder path works end-to-end against a live DB (the seed proves it). The neon-http/drizzle-0.39 saga is conclusively closed.
- ✅ **Migration 0001 (Auth.js tables)** — applied cleanly; `db:migrate` is idempotent on re-run.

## Current Step

- **Phase:** 1 — Database, Ops Console, Lead Pipeline.
- **Commit:** **1.4 — Ops-console scaffold + auth** (in PR, this branch).
- **Plan ref:** `MASTER-bec-project-plan.md` § Phase 1 → Commit 1.4.
- **ADRs:** ADR-001 (Vercel), ADR-007 (1Password secrets), ADR-012 (Sentry — closes the deferred per-app-init half of Commit 0.4's prompt), ADR-013 (Resend), ADR-036 (a11y) + Apple HIG § Operator-side UX. ADR-038 extended: `OPERATOR_EMAIL` added to the env schema (optional in dev, required in prod).
- **Status:** built; CI-equivalent gate (`lint`+`type-check`+`test:unit`) **48/48 green** workspace-wide including the new app.

## What Commit 1.4 shipped

- `apps/ops-console`: Next 16 App Router app. `app/layout.tsx` (dark-default, safe-area, themeColor, noindex), `app/globals.css` (reuses `@bec/ui` token contract, forces dark ops palette, reduced-motion).
- **Auth (NextAuth v5 / Auth.js beta — operator-approved as the future-proof choice):** `auth.ts` — lazy `NextAuth(() => …)` factory (defers `@bec/config` env resolution to request time so `next build` doesn't boot-fail on `productionRequired`), Resend magic-link provider, `@auth/drizzle-adapter` over `@bec/db`'s Pool client + the new Auth.js tables, JWT sessions, hard `signIn` allow-list against `serverEnv.OPERATOR_EMAIL`. `app/api/auth/[...nextauth]/route.ts` handlers. Explicit `NextAuthResult` annotations (TS2742 pnpm workaround).
- **Route guard:** `middleware.ts` (edge redirect to `/login`, matcher excludes auth API/login/static) + `(app)/layout.tsx` server-side `auth()` check (defense in depth). `(auth)/login/page.tsx` (server action → `signIn`, HIG: bottom-region CTA, 44pt targets) + `(app)/page.tsx` dashboard placeholder + sign-out.
- **Per-app Sentry (deferred Commit 0.4 half — now done):** `instrumentation.ts` + `sentry.server/edge.config.ts` (DSN from `serverEnv`), `instrumentation-client.ts` (optional `NEXT_PUBLIC_SENTRY_DSN`, no-ops if absent), `next.config.ts` wrapped with `withSentryConfig`.
- **DB:** `packages/db/src/schema/auth.ts` (4 Auth.js tables — the master DB Schema section didn't enumerate them; magic-link can't work without token persistence, so this is necessary infra, documented as an implementation-surfaced gap). `migrations/0001_previous_rhino.sql` regenerated. `test-migrations.ts` EXPECTED_TABLES/ENUMS updated to 27 tables (deliberate canonical-set bump). `drizzle.config.ts` now loads repo-root `.env` via dotenv (so `db:migrate`/`studio`/`push` work without fragile shell sourcing — this is what made the live verification possible).
- **Config:** `OPERATOR_EMAIL` added to `@bec/config` server + productionRequired schemas + `.env.example` + 2 new env tests (16/16).

## Build reality (important for review + deploy)

- **CI does not run `next build`** (the workflow runs `lint`+`type-check`+`unit-tests` only). The PR's real gates are green: 48/48.
- **`next build` is OOM-bound on this machine** — same memory ceiling that forced Storybook's `--max-old-space-size=12288` workaround (operator's parked WIP). Next 16 defaults to Turbopack for build; the worker got SIGKILL'd (signal 9 = OOM), not a code panic. `type-check` (the load-bearing local correctness signal) is green. The authoritative `next build` runs on **Vercel** (ample memory), exactly like `bec-storybook`. `next.config.ts` carries both a Turbopack config (root pinned, resolveExtensions) and a webpack `extensionAlias` fallback so the Vercel build resolves `@bec/ui`'s `.js`→`.ts` source specifiers either way.

## Acceptance

Per master plan § Commit 1.4: "Operator can log in on iPhone Safari. Unauthenticated requests redirect to login. Magic link works end-to-end." **Entirely operator-gated** — needs the Vercel deploy + Resend domain (Pre-Flight items). Locally provable parts: structure, type-check, auth-guard logic, allow-list, Sentry wiring — all green. The e2e magic-link is verified by the operator post-deploy and recorded on Commit 1.5's task-log entry.

## Next Commit After This

- **Phase 1 / Commit 1.5 — Internal agent API.** `apps/ops-console/app/api/agent/` — `POST /leads`, `PATCH /leads/:id` (status transitions → `lead_status_history`), `POST /leads/:id/lock|release`, `POST /businesses` (upsert by googlePlaceId), `POST /agent-runs` + `/finalize`. Auth via `Bearer ${AGENT_API_KEY}` (separate from operator auth). Rate-limit per ADR-017. This is the first consumer of the `@bec/db` Pool client's write path under real load.

## Handoff Notes

- Master ADR + master plan are source of truth. Off-plan driver task (PR #14) is recorded; it renumbers nothing.
- Auth.js v5 is **beta** — operator explicitly accepted this as the future-proof choice over v4 (App Router native, the v4→v5 churn is worse later than now).
- Operator's parked Phase-0 Storybook/Vercel WIP is still in the working tree across branches; untouched by Phase 1 + this commit.
- The 4 Auth.js tables in `@bec/db` are the canonical `@auth/drizzle-adapter` Postgres shape (the `accounts` table's mixed snake/camel JS keys are the adapter's required structural contract — do not "tidy" them).
