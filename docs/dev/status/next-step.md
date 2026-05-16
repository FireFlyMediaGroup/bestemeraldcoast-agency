# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## 🔴 Security action (still open)

- **Rotate the Neon `neondb_owner` password.** A shell `.env` sourcing during the Commit 1.4 DB verification echoed the connection string into command output. Rotate in Neon → update `.env` (`DATABASE_URL` + `DATABASE_URL_UNPOOLED`) → update the `BEC-Production` 1Password item. Dev branch, low real-world risk, but rotate on principle. (Subsequent commands are filtered to never reprint connection strings.)

## Operator Pre-Flight

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency
**Runbooks:** [`secrets-setup.md`](../../runbooks/secrets-setup.md) · [`storybook-deploy.md`](../../runbooks/storybook-deploy.md) · [`ops-console-deploy.md`](../../runbooks/ops-console-deploy.md)

- [x] Phase 0 ADR-035 gate passed; 1Password + Vercel Pro + Storybook + Neon/Turbo GH secrets done.
- [x] Commit 1.1/1.2 live-verified (db:migrate + db:seed ×2 against Neon dev branch).
- [x] **Pass-2 branch protection LIVE** — `main`: required checks `lint`/`type-check`/`unit-tests`, strict (branch up to date), 0 human approvals, `enforce_admins: false`. `CodeRabbit` intentionally NOT a required check until its reliability/credit problem is fixed (see below).
- [ ] **Rotate Neon password** (security action above).
- [ ] **Deploy `bec-ops-console` to Vercel + verify Resend domain** — per `ops-console-deploy.md`. Required for Commit 1.4 acceptance (login on iPhone Safari / magic-link e2e), operator-gated, untestable locally. Now buildable: `main` has the real app + the auth.ts build-inertness fix.
- [ ] **Provision Upstash Redis + set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`** in Vercel (and 1Password). Commit 1.5 wires the ADR-017 limiter; it **no-ops without these** (dev/CI fail-open by design, like the @bec/logger transports). Production anti-abuse on the agent API + magic-link route is OFF until these are set.
- [ ] **CodeRabbit credit/reliability** — recurring blocker (rate-limits, ~12-min stalls, incremental re-flags caused the Commit 1.4 gate-relaxation). Fix the plan/credits, then add `CodeRabbit` to Pass-2 required checks (one `gh api` call).

## Current Step

- **Phase:** 1 — Database, Ops Console, Lead Pipeline.
- **Commit:** **1.5 — Internal agent API** (in PR, this branch).
- **Plan ref:** `MASTER-bec-project-plan.md` § Phase 1 → Commit 1.5.
- **ADRs:** ADR-003 (Bearer AGENT_API_KEY agent auth), ADR-017 (Upstash rate-limit — and **closes** the 2026-05-16 adr-log exemption by retro-covering the auth route), ADR-018 (agent_runs cost tracking), ADR-012 (handler error capture via @bec/logger).
- **Status:** built; CI-equivalent gate `lint`+`type-check`+`test:unit` **48/48** workspace-wide.

## What Commit 1.5 shipped

`apps/ops-console/app/api/agent/` — Bearer-`AGENT_API_KEY`-gated surface, all handlers: agent-auth (401) → ADR-017 rate-limit (60/key/min, 429) → @bec/logger error capture (500) → Zod-validated body → Pool-client write. All env-touching imports are dynamic (build-inert, per the Commit 1.4 cubic-P1 lesson).

- `leads` POST (create), `leads/[id]` PATCH (update + transition-validated status change → writes `lead_status_history` in a transaction; 422 invalid transition), `leads/[id]/lock` POST (atomic conditional UPDATE — concurrent acquirers → 409, master-plan acceptance), `leads/[id]/release` POST (lock-holder-only), `businesses` POST (upsert by googlePlaceId), `agent-runs` POST (start), `agent-runs/[id]/finalize` POST (cost+outcome, ADR-018).
- `lib/`: `ratelimit.ts` (@upstash/ratelimit sliding window, two limiters: agentApi 60/min + magicLink 5/15min; no-ops without Upstash env), `agent-auth.ts` (constant-time Bearer compare, fail-closed), `lead-transitions.ts` (valid `lead_status` edge map; closed_won/closed_lost terminal), `agent-handler.ts` (the auth→limit→log pipeline wrapper).
- **Auth route now rate-limited** (`app/api/auth/[...nextauth]/route.ts` POST → magicLink limiter, IP-keyed) — **closes the ADR-017 adr-log exemption** (2026-05-16 entry; the closing adr-log entry is recorded).
- `@bec/db` now re-exports drizzle operators (`eq`/`and`/`isNull`/…) so consumers bind to its single drizzle-orm instance (avoids the cross-package `PgColumn`-identity TS2769).

## Acceptance

Per master plan § Commit 1.5: "Postman/curl tests pass. Lock acquisition is exclusive (concurrent requests get 409). Unauthorized requests get 401." The exclusivity is structurally guaranteed (single conditional `UPDATE … WHERE locked_by IS NULL`); 401 is enforced by `requireAgentAuth`. End-to-end curl verification is operator-gated (needs the deployed URL + `AGENT_API_KEY` + Upstash for the 429 path) — recorded on Commit 1.6's task-log entry. Locally-provable parts (type-check, structure, auth/limit/validation logic) all green.

## Next Commit After This

- **Phase 1 / Commit 1.6 — Ops-console: Leads view.** `(app)/leads` table + `(app)/leads/[id]` detail with manual transition controls; HIG skeleton/empty/optimistic states + pull-to-refresh. First read-UI consumer of the agent-API-populated data.

## Handoff Notes

- Master ADR + master plan are source of truth. The two off-plan tasks (PR #14 driver swap, the ADR-017 exemptions) are recorded in adr-log/task-log and renumber nothing.
- `next build` remains Vercel-authoritative (OOM-bound locally); `type-check` is the local gate; CI runs `lint`/`type-check`/`unit-tests` only.
- Operator's parked Phase-0 Storybook/Vercel WIP is still in the working tree across branches; untouched by Phase 1.
- After Commit 1.5 merges, the operator can curl-verify the agent API once `bec-ops-console` is deployed with `AGENT_API_KEY` + Upstash env set.
