# ops-console deployment runbook

**Scope**: One-time operator setup to satisfy Phase 1 / Commit 1.4's acceptance — "Operator can log in on iPhone Safari. Unauthenticated requests redirect to login. Magic link works end-to-end."

**Prerequisite**: Vercel Pro account active (already provisioned for `bec-storybook`).

**Outcome**: Vercel project `bec-ops-console` deployed from `apps/ops-console`, mapped to `ops.bestemeraldcoast.com`, with operator magic-link sign-in working through Resend.

> Mirrors [`storybook-deploy.md`](./storybook-deploy.md). Read the **Environment variable topology** section below before running any `vercel` CLI command — there's a footgun that can silently break the local Neon db tooling.

---

## 1. Create the Vercel project

1. Vercel dashboard → **Add New… → Project** → import `FireFlyMediaGroup/bestemeraldcoast-agency`.
2. **Project Name**: `bec-ops-console`.
3. **Framework Preset**: **Next.js**. Set this explicitly — do not leave it on *Other*. If a `bec-ops-console` project was cloned/copied from `bec-storybook`, its Framework + Build/Output overrides will be Storybook's (`pnpm turbo run build-storybook`, output `storybook-static`); that silently deploys Storybook to `ops.bestemeraldcoast.com` in ~8s instead of the app. The Next.js preset gives the correct serverless build + output handling.
4. **Root Directory**: `apps/ops-console` — use the **Edit** button; Vercel defaults to the repo root. (Same gotcha as `bec-storybook`.) Keep **"Include source files outside of the Root Directory"** *enabled* — the monorepo workspace deps live above it.
5. **Build & Output settings** (Settings → Build and Deployment). These are **not** the Next.js defaults — a plain `next build` from `apps/ops-console` fails on Vercel for two verified reasons, so override:
   - **Build Command** (Override ON):
     `cd ../.. && pnpm turbo run build --filter=@bec/ops-console`
     Why: (a) `@bec/db` / `@bec/config` / `@bec/logger` resolve their *runtime* entry to compiled `dist/` (`exports.default → ./dist/index.js`); nothing builds those on a clean Vercel checkout, so `next build` dies with `Module not found: Can't resolve '@bec/db'`. Turbo's `build` task `dependsOn: ["^build"]` builds those deps' `dist/` first. (b) The `apps/ops-console` `build` script is `next build --webpack` — **Turbopack** (Next 16's default `next build`) **deadlocks** for this app (every thread parked in `uv_cond_wait`, 0% CPU — a hang, *not* OOM; more RAM does not help). The webpack path is verified working. Because the package script carries `--webpack`, the turbo filter command above needs no extra flags. (Equivalent explicit form if you must bypass turbo: `cd ../.. && pnpm turbo run build --filter=@bec/ops-console^... && cd apps/ops-console && next build --webpack`.)
   - **Install Command** (Override ON): `cd ../.. && pnpm install --frozen-lockfile` (monorepo install from repo root).
   - **Output Directory**: Override **OFF** (let the Next.js preset manage `.next` + serverless packaging). Never set `storybook-static`.
   - After changing settings, redeploy with **"Use existing Build Cache" unchecked** — a cache from a Storybook-misconfigured build poisons the corrected one.
6. **Do not deploy yet** — set the environment variables (§3) first, or the first production build fails `@bec/config`'s `productionRequired` validation at "Collecting page data" (ADR-038, by design). All 9 prod-required vars must be present: `DATABASE_URL`, `AGENT_API_KEY`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `OPERATOR_EMAIL`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `SENTRY_DSN`, `CRON_SECRET` (see §3 — confirm `AGENT_API_KEY`, `ANTHROPIC_API_KEY`, `CRON_SECRET` are not omitted).

## 2. Attach the custom domain

1. Project → **Settings → Domains → Add Domain** → `ops.bestemeraldcoast.com`.
2. Add the CNAME / A record Vercel shows you at the registrar managing `bestemeraldcoast.com`. Wait for DNS propagation (status → *Valid Configuration*, typically <10 min).
3. The domain is **functionally required**, not cosmetic: `NEXTAUTH_URL` must equal the real origin or NextAuth's magic-link callback URLs are wrong and sign-in fails.

## 3. Environment variables

Set these in **Settings → Environment Variables**, scoped to **Production** and **Preview**. Source every value from the `BEC-Production` 1Password vault (`docs/runbooks/secrets-setup.md`).

The first nine rows are the **exact `@bec/config` `productionRequired` set** — every one must be present or the build fails at `@bec/config` validation during "Collecting page data" (ADR-038). They match the §1 step-6 list one-for-one.

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | Neon pooled connection URL | **Required.** If the Neon password is rotated, update here too |
| `NEXTAUTH_URL` | `https://ops.bestemeraldcoast.com` | **Required.** Must match the attached domain exactly |
| `NEXTAUTH_SECRET` | 32+ char secret | **Required.** `openssl rand -hex 32` if generating fresh |
| `OPERATOR_EMAIL` | the single allow-listed login address | **Required.** The NextAuth `signIn` callback rejects every other address |
| `AGENT_API_KEY` | Bearer token for the agent API | **Required.** Scout/Diagnoser authenticate to the ops-console agent endpoints with this |
| `ANTHROPIC_API_KEY` | `sk-ant-…` | **Required.** Agent runtime (Scout/Diagnoser prompts), ADR-004/ADR-018 |
| `RESEND_API_KEY` | `re_…` | **Required.** Magic-link delivery (ADR-013) |
| `SENTRY_DSN` | ops/server Sentry DSN | **Required.** Server + edge error capture (ADR-012) |
| `CRON_SECRET` | secret for scheduled-job endpoint auth | **Required.** Secures the cron-triggered agent jobs |
| `DATABASE_URL_UNPOOLED` | Neon direct connection URL | Not in `@bec/config`'s nine, but the agent runtime + `db:*` tooling use the direct (unpooled) URL — set it for full function |
| `SENTRY_AUTH_TOKEN` | Sentry source-map upload token | Optional but recommended; build skips upload if absent |
| `NEXT_PUBLIC_SENTRY_DSN` | client Sentry DSN | Optional; client Sentry no-ops if omitted |

**Production needs no `.env` file** — Vercel injects these into the serverless runtime and `@bec/config` reads them from `process.env`.

## 4. Resend sending domain (separate from the Vercel domain)

Magic-link email won't deliver until Resend can send from your verified domain (`noreply@ops.bestemeraldcoast.com` matches a Resend-verified `ops.bestemeraldcoast.com` zone; use `@bestemeraldcoast.com` only after the apex is verified there):

1. Resend dashboard → **Domains → Add Domain** → the hostname you will send from (`ops.bestemeraldcoast.com` or apex `bestemeraldcoast.com`). The verified hostname must match the domain part of `From`.
2. Add the DKIM + SPF + return-path DNS records Resend provides at the registrar.
3. Wait for Resend to mark the domain *Verified*.

Until verified, NextAuth falls back to Resend's onboarding sender and deliverability is unreliable — the e2e acceptance can't be confirmed.

## 5. Environment variable topology (read before any `vercel` CLI use)

There are **three distinct env consumers in different locations**. Conflating them silently breaks tooling:

| Consumer | Reads env from | Mechanism |
|---|---|---|
| `@bec/db` CLI (`db:seed`, `db:migrate`, `db:test-migrations`) + `@bec/config` | **repo-root `.env`** | explicit `dotenv.config()` pointed at the repo root |
| `ops-console` local dev (`next dev`) | **`apps/ops-console/.env.local`** | Next.js built-in env loading (app dir only) |
| `ops-console` production | **process env** | Vercel injects at runtime — no file |

**Footgun: never run `vercel env pull` (or `vercel link` + pull) from the repo root.** It writes the pulled env file into the current directory; at the repo root it overwrites the hand-maintained `.env` that the Neon `db:*` tooling depends on, replacing real dev-branch URLs with the Vercel *Development* set. That breaks `db:seed` / `db:migrate` with no obvious error.

Correct usage:

- **Local `next dev` on ops-console**: `cd apps/ops-console` → `vercel link` (link *that directory* to the `bec-ops-console` project) → `vercel env pull` → creates `apps/ops-console/.env.local` (the isolated location Next reads). `vercel env pull` defaults to the **Development** environment — ensure that environment has usable values, or pass `--environment=preview|production` deliberately.
- **Repo-root `.env`**: keep it the canonical source for db/CLI tooling. Maintain it manually or via `op inject` from 1Password. Do not let `vercel env pull` touch it.
- **Production**: dashboard env vars only (§3); no file.

All of `.env`, `.env.*`, `apps/**/.env*`, and `.vercel/` are gitignored — pulled secrets cannot be committed.

## 6. Verify acceptance

From a signed-out iPhone Safari session (or desktop incognito):

1. Open `https://ops.bestemeraldcoast.com`.
2. Unauthenticated → redirected to `/login`.
3. Enter the `OPERATOR_EMAIL` address → "check your inbox" screen.
4. Open the magic link from the email → land on the dashboard, signed in.
5. **Negative check**: request a link for a non-allow-listed address → sign-in is rejected (the `signIn` callback returns false).
6. Sign out → back to `/login`; protected routes redirect again.

Record the production URL + the verification outcome on the Phase 1 / Commit 1.5 task-log entry (Commit 1.4's acceptance is operator-gated and closes here).

## 7. Rollback / disable

- **Take it offline**: Project → **Settings → General → Pause Project**.
- **Revoke operator access fast**: change `OPERATOR_EMAIL` to an address you don't control and redeploy — every sign-in then fails closed.
- **Delete the project**: Settings → General → Delete Project. DNS records survive at the registrar; remove separately if reusing the domain.

## Cross-references

- ADR-001 — Vercel for all hosting.
- ADR-007 — 1Password as the secret system of record.
- ADR-012 — Sentry + Axiom observability (per-app Sentry init lives in `apps/ops-console/instrumentation.ts` + `sentry.{server,edge}.config.ts`).
- ADR-013 — Resend sending strategy.
- ADR-038 — per-environment config + the `PROD_DB_ALLOWED` rail; `OPERATOR_EMAIL` is part of the validated schema.
- Apple HIG § Operator-side UX (project plan) — dark default, 44pt targets, safe-area.
- `docs/runbooks/storybook-deploy.md` — the sibling runbook this mirrors.
- `docs/runbooks/secrets-setup.md` — the 1Password vault these values come from.
