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
- [x] **Pass-2 branch protection LIVE** — `main`: required checks `lint`/`type-check`/`unit-tests`, strict (branch up to date), 0 human approvals, `enforce_admins: false`. PR #16 was the first merge gated naturally by it.
- [x] **CodeRabbit is now advisory, not a merge gate** (operator decision, 2026-05-16; adr-log ADR-035 entry; `CLAUDE.md` §29–30 + `RALPH-LOOP.md` 7b–7e reworded — folded into this Commit 1.6 branch). Use CodeRabbit when it responds; address/reply to every posted finding; but its review *state* and any stall/rate-limit/no-show never block merge. The gate is: required CI green **+** cubic clean **+** posted findings triaged.
- [ ] **Rotate Neon password** (security action above).
- [ ] **Deploy `bec-ops-console` to Vercel + verify Resend domain** — per `ops-console-deploy.md`. Required for Commit 1.4 acceptance (login on iPhone Safari / magic-link e2e) **and** Commit 1.5 curl-verification of the agent API. Operator-gated, untestable locally. `main` has the real app + auth.ts build-inertness fix + the agent API.
- [ ] **Provision Upstash Redis + set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`** in Vercel (and 1Password). Commit 1.5 wired the ADR-017 limiter; it **no-ops without these** (dev/CI fail-open by design). Production anti-abuse on the agent API + magic-link route is OFF until these are set.
- [ ] **Curl-verify the agent API** (Commit 1.5 operator-gated acceptance) once `bec-ops-console` is deployed with `AGENT_API_KEY` + Upstash env: unauthorized → 401; concurrent lock acquire → one 200 + one 409; rate-limit → 429 after 60/min.
- [ ] (Optional, deferred) **Promote CodeRabbit back to a Pass-2 required check** *only if* its reliability/credit problem is fixed — one `gh api` call. Not blocking; default posture is now advisory.

## Current Step

- **Phase:** 1 — Database, Ops Console, Lead Pipeline.
- **Commit:** **1.6 — Ops-console: Leads view** (this branch: `phase-1/commit-1.6-leads-view`).
- **Plan ref:** `MASTER-bec-project-plan.md` § Phase 1 → Commit 1.6.
- **ADRs:** ADR-036 + Apple HIG (skeleton/empty/optimistic/pull-to-refresh), ADR-012 (error capture on any new server actions / route handlers), ADR-038 (no new env without schema). No ADR text changes expected.
- **Status:** branch cut from `25711ce`; bookkeeping + the CodeRabbit-advisory loop-doc policy change land in this branch's first commit, then the Leads-view feature work.

## What Commit 1.6 must ship

Per master plan § Commit 1.6:

> Create `(app)/leads/page.tsx` showing a table of leads — columns: business name, niche, city, status, gap score, days in current status, lock holder. Filter by status. Sort by gap score desc by default. Click a row → `(app)/leads/[id]` with full detail (diagnosis, offer, mockup if present, status history, manual transition controls). Apply HIG: skeleton loading, empty states, optimistic transitions with rollback toast, pull-to-refresh on mobile.

**Acceptance**: Loads correctly. Empty state ("No leads yet — run Scout to populate.") renders when DB empty. Status changes optimistically and roll back on error.

Implementation notes:
- First **read-UI** consumer of the agent-API-populated `leads` / `lead_status_history` data. Server Components read via `@bec/db` `getDb()`; manual transition controls go through a server action (not the Bearer agent API — this is the authenticated operator surface, gated by the `auth.ts` allow-list, not `AGENT_API_KEY`).
- Reuse the Commit 1.5 `lead-transitions.ts` valid-edge map for the manual transition controls so the UI and agent API share one source of transition truth.
- Keep env-touching imports build-inert (dynamic import inside request scope) per the Commit-1.4 cubic-P1 lesson — `next build` must not trigger eager `parseEnv()`.
- `type-check` is the load-bearing local gate; `next build` is Vercel-authoritative (OOM-bound locally).

## Next Commit After This

- **Phase 1 / Commit 1.7 — Mobile `/m` route — basic shell.**

## Handoff Notes

- Master ADR + master plan are source of truth. Off-plan/loop-doc changes are recorded in adr-log/task-log and renumber nothing.
- CodeRabbit-advisory is now the standing policy — do **not** re-litigate the gate per-PR; follow `RALPH-LOOP.md` 7b–7e (best-effort poll with 10-min proceed-anyway timeout; pre-merge re-fetch checks CI/cubic/mergeable, not CodeRabbit review state).
- `next build` remains Vercel-authoritative (OOM-bound locally); CI runs `lint`/`type-check`/`unit-tests` only.
- Operator's parked Phase-0 Storybook/Vercel WIP is still in the working tree across branches; untouched by Phase 1 — keep it unstaged.
- Commit 1.4 (iPhone login/magic-link e2e) and Commit 1.5 (agent API curl) acceptance remain operator-gated on the Vercel deploy; tracked in the pre-flight above.
