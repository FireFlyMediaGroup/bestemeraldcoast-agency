# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## 🔴 Security action (still open)

- **Rotate the Neon `neondb_owner` password.** A shell `.env` sourcing during the Commit 1.4 DB verification echoed the connection string into command output. Rotate in Neon → update `.env` (`DATABASE_URL` + `DATABASE_URL_UNPOOLED`) → update the `BEC-Production` 1Password item. Dev branch, low real-world risk, but rotate on principle.

## Operator Pre-Flight

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency
**Runbooks:** [`secrets-setup.md`](../../runbooks/secrets-setup.md) · [`storybook-deploy.md`](../../runbooks/storybook-deploy.md) · [`ops-console-deploy.md`](../../runbooks/ops-console-deploy.md)

- [x] Phase 0 ADR-035 gate passed; 1Password + Vercel Pro + Storybook + Neon/Turbo GH secrets done.
- [x] Commit 1.1/1.2 live-verified; Pass-2 LIVE; CodeRabbit-advisory proven across PRs #17–#21.
- [ ] **Rotate Neon password** (security action above).
- [ ] **Run `db:migrate` + `db:seed` for the editorial-rotation tables** (Commit 1.10) against the Neon dev branch — operator-gated (ADR-038). The seed tail prints `getSeasonalWeight('charter_fishing', 2026-06-15) = 1.5` — capture as evidence.
- [ ] **Deploy `bec-ops-console` to Vercel + verify Resend domain** — unblocks device/runtime acceptance for Commits 1.4–1.11 (incl. the new `/api/agent/pipeline-signals` endpoint Scout/Diagnoser POST to).
- [ ] **Provision Upstash Redis** + set `UPSTASH_REDIS_REST_URL` / `_TOKEN`.
- [ ] **Set `GOOGLE_MAPS_API_KEY` / `AGENT_API_KEY` / `OPS_CONSOLE_URL` / `DATABASE_URL_UNPOOLED`** in the agent runtime env.
- [ ] Add a 180×180 `apps/ops-console/app/apple-icon.png` (1.7 follow-up; non-blocking).
- [ ] (Optional) Promote `CodeRabbit` to a required check only if reliability is fixed.

## Current Step

- **Phase:** 1 — Database, Ops Console, Lead Pipeline.
- **Commit:** **1.11 — Pipeline signal capture** (this branch: `phase-1/commit-1.11-pipeline-signal-capture`).
- **Plan ref:** `MASTER-bec-project-plan.md` § Phase 1 → Commit 1.11 + § Pipeline signal capture / signal-weight table (ADR-040).
- **ADRs:** ADR-040 (pipeline_signals event log feeds the Curator), ADR-003 (agents write only via the Bearer agent API), ADR-017 (the new endpoint inherits the shared rate-limiter via `agentRoute`), ADR-018 (unchanged). No ADR text changes.
- **Status:** branch cut from `3a693f5`; bookkeeping (this rewrite + the Commit 1.10 task-log entry) lands first, then the endpoint + agent-prompt updates.

## What Commit 1.11 must ship

Per master plan § Commit 1.11:

> Update Scout + Diagnoser (and prepare hooks for Builder/Filmer/Pitcher/inbound — Phase 2-5) to write `pipeline_signals` rows alongside their work. Add agent-API `POST /pipeline-signals` and `GET /pipeline-signals?niche=&city=&since=`. Signal types + strengths per the spec table.

**Acceptance**: Running Scout on a sample query produces matching `pipeline_signals` rows. The trailing-14-day query returns expected signals. Pipeline data accumulates through Phase 1→5; Curator (Phase 6) launches against 8-12 weeks of real data.

Implementation notes:
- New `apps/ops-console/app/api/agent/pipeline-signals/route.ts` — `POST` + `GET`, both wrapped by the shared `agentRoute` (Bearer auth + ADR-017 limiter + ADR-012 error capture), identical pattern to the other agent endpoints.
- **Strength is canonical/server-side** (`SIGNAL_STRENGTHS` map = the spec table) — the client only names the `signalType`; a misbehaving agent can't poison Curator scoring. The enum already includes the future Builder/Filmer/Pitcher/inbound/Calendly signal types, so the "prepare hooks" ask = those agents just POST the same endpoint when they land (no schema change later).
- `GET` requires `niche`; `city` + `since` optional; `since` is the Curator's trailing-window cursor (typically now−14d). Returns `{ signals, count }`.
- Scout (`5b`) + Diagnoser (`6b`) prompts: after the lead create / diagnosis, POST one signal (`lead_added`/`diagnosis_done`), resolving the free-text niche to a real `niches.id` via `mcp__postgres-ro` (FK-constrained — skip the signal, never the lead, if the niche isn't one of the 10). Signal failure must not fail the primary work.
- Live acceptance (Scout run → signal rows; trailing-14d GET) is operator/runtime-gated (deployed agent API + DB); locally-provable: route type-checks under `agentRoute`, prompts reference the endpoint correctly, `pnpm turbo` 48/48.

## Next Commit After This

- **Phase 1 quality gate (ADR-035)** — the Phase 1 acceptance checklist must be 100% green before Phase 2 opens. (Several boxes are operator/deploy-gated; the gate entry will record status + any deferrals.)

## Handoff Notes

- Master ADR + master plan are source of truth. CodeRabbit-advisory standing; follow `RALPH-LOOP.md` 7b–7e.
- Commit 1.11 mixes app code (the endpoint — `type-check` is the load-bearing local gate) + prompt edits. `next build` Vercel-authoritative.
- After 1.11 the next loop step is the **Phase 1 ADR-035 quality gate**, not a Commit 1.12 — read the gate checklist in the project plan and record it in `task-log.md` as a `PHASE 1 GATE` entry (do not skip per ADR-035; deferrable items get explicit operator-gated notes).
- Operator's parked Phase-0 Storybook/Vercel WIP stays unstaged across branches.
