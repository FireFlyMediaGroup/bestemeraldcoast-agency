# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## ⛔ Loop status: BLOCKED at the Phase 1 ADR-035 quality gate

All Phase 1 implementation is merged (**Commits 1.1–1.11, PRs #3–#22**). The
autonomous loop has completed everything code/CI-provable and **must not
open Phase 2** until this gate passes (ADR-035 non-negotiable: gates are not
skipped to make progress). The remaining work is operator/infra/human and
cannot be done or self-certified by the loop. Gate status detail is the
`PHASE 1 GATE — STATUS` entry in `task-log.md`.

## 🔴 Security action (do this first; still open)

- **Rotate the Neon `neondb_owner` password.** A shell `.env` sourcing during the Commit 1.4 DB verification echoed the connection string. Rotate in Neon → update `.env` (`DATABASE_URL` + `DATABASE_URL_UNPOOLED`) → update the `BEC-Production` 1Password item. **Note (2026-05-18):** Neon was *reconfigured* during the deploy fix — operator to confirm whether that reconfiguration already rotated the credential (closing this item) or if the principle-rotation is still outstanding.

## ✅ Ops-console deploy GREEN — operator login working (2026-05-18)

The full deploy-remediation arc is done — see the **2026-05-18 off-plan
entry** in `task-log.md`. `bec-ops-console` deploys cleanly to
`ops.bestemeraldcoast.com` and operator magic-link sign-in works
end-to-end (operator-confirmed). The arc: PR #24 (auth edge split) →
PR #26 (hardened `__dirname`: externalize Sentry/OTEL, defer instrumentation
imports — properly superseded the `f5a05d0` direct-to-`main` deviation) →
PR #27 (generic route types + CI `next typegen`) → PR #29 (Resend `From`
→ verified `noreply@ops.bestemeraldcoast.com` subdomain) → operator: Neon
reconfigured + the Vercel env root cause fixed (`NEXTAUTH_URL`/
`NEXTAUTH_SECRET` were empty on the `bec-ops-console` Production scope;
set via Vercel CLI on the correctly-linked project).

**Gate impact:** boxes 9 (deploy + magic link) + Neon-verify ✅;
**boxes 11–14 ✅ (2026-05-18)** — live Scout + live Diagnoser proven
end-to-end against the deployed app with canonical-niche
`pipeline_signals` (PR #33 fixed the auth-middleware bypass, PR #36 the
`@bec/db` fetch-transport `db.transaction()` 500; both merged +
deployed off `main`). Box 10 (iPhone-Safari) 🟡 (login proven; device
confirmation + add-to-home-screen pending — quick check). The gate is
still **NOT PASSED** (ADR-035): box 15 blind validation + box 17
restore drill remain. Repo: local `main` == `origin/main` ==
`1d5373c`; PR for this status record open (`task/2026-05-18-gate-1314-record`).

## Operator action list to clear the Phase 1 gate

Ordered so each step unblocks the next:

1. ✅ **DONE — Provision Neon via Vercel; verify prod + preview** (gate box 1). Neon reconfigured 2026-05-18; verified by the successful end-to-end magic-link sign-in.
2. ✅ **DONE — live DB bring-up** (gate boxes 3–8). `db:migrate` applied 0000–0003; `PROD_DB_ALLOWED=true … db:seed` (process-scoped ADR-038 opt-in) succeeded idempotently against prod Neon: 8 sites / 48 categories / 2 authors / 9 agent_budgets / 10 niches / 30 mappings / 120 season_weights / 8 season_events; acceptance `getSeasonalWeight('charter_fishing', 2026-06-15) = 1.5`. Evidence recorded in the PHASE 1 GATE — STATUS entry.
3. ✅ **DONE — Deploy `bec-ops-console` + magic link** (gate box 9). Deployed to `ops.bestemeraldcoast.com`; Resend `noreply@ops.bestemeraldcoast.com` subdomain verified; env set via Vercel CLI on the correctly-linked project; operator-confirmed sign-in 2026-05-18.
4. **Log in on iPhone Safari** (gate box 10 — 🟡, blocker removed): repeat the now-working sign-in on iPhone Safari, confirm no bugs, add to Home Screen, confirm chrome-less standalone launch (closes Commit 1.4 + 1.7 device acceptance). *(Optional: drop a 180×180 `apps/ops-console/app/apple-icon.png` for a branded glyph.)*
5. ✅ **DONE — Run Scout** (gate boxes 11, 12). Prereqs all closed: PR #33 (agent-API middleware bypass, SHA `96ce5c9`) **and** PR #36 (lead-transition fetch-tx 500, SHA `1d5373c`) both merged + deployed off `main`; `POST /api/agent/agent-runs` (no bearer) returns **401**. Live `/scout pensacola charter fishing` run `fa9b1fe0-…`: 20 scanned, **7 `charter_fishing` leads created + 7 `lead_added` `pipeline_signals`**, daily caps respected. (An earlier `beach chair rentals` run added 2 leads — non-canonical niche, signals correctly skipped.)
6. ✅ **DONE — Run Diagnoser** (gate boxes 13, 14). `/diagnose-pending` on the 7 `charter_fishing` leads: **7/7 diagnosed**, every `PATCH /api/agent/leads/:id` → HTTP 200 `transitioned:true`, ~50-word consultant-voice diagnosis + tiered offer per lead (rubric-screened), **7 `diagnosis_done` `pipeline_signals`** written. ADR-040 trailing window verified in Postgres: `charter_fishing` 14d = 7 `lead_added` + 7 `diagnosis_done`; `diagnosed_today=9`; 0 leads left `new`. (The 2 `beach chair rentals` leads were also diagnosed as the post-#36-deploy fix verification.)
7. **External blind validation** (gate box 15): show 3 peers 5 random Diagnoser `summary` outputs blind; record ≥3/5 "human". If it fails, that is a Diagnoser-prompt iteration (ADR-019 `version: 2` + adr-log note) — a real loop task, *not* a gate skip.
8. **Run one restore drill** (ADR-006, gate box 17): restore the Neon backup to a scratch branch, verify row counts, document the runbook timing.

When all boxes are green: replace the `PHASE 1 GATE — STATUS` entry in
`task-log.md` with `## <date> — PHASE 1 GATE PASSED` (paste the fully-checked
checklist), then set this file's Current Step to **Phase 2 / Commit 2.1** and
the loop resumes.

## Current Step

- **Phase:** 1 — quality gate (ADR-035). **Status: NOT PASSED — but materially advanced (2026-05-18): DB + deploy + login + live Scout + live Diagnoser all closed; boxes 11–14 green; 1 yellow (box 10).** Residual blockers: iPhone-Safari device check (box 10 🟡), external blind validation (box 15), restore drill (box 17) — operator action list above.
- **Plan ref:** `MASTER-bec-project-plan.md` § Phase 1 quality gate.
- **Do NOT:** start Phase 2 / Commit 2.1, or mark the gate passed, until the operator closes the items and records `PHASE 1 GATE PASSED`.

## Next Step After the Gate Passes

- **Phase 2 / Commit 2.1** (Outreach + Editorial Foundation — Pitcher/Checker/Editor; see `MASTER-bec-project-plan.md` § Phase 2).

## Handoff Notes

- Master ADR + master plan are source of truth. CodeRabbit-advisory standing; `RALPH-LOOP.md` 7b–7e. The policy held cleanly for 6 consecutive PRs (#17–#22) — zero per-PR operator decisions.
- The loop is at a legitimate operator-gated stop. This is **not** a failure — it is the ADR-035 design: implementation is exhausted; deploy + live-agent + human-eval + DR are operator responsibilities.
- If the operator wants the loop to keep producing value while the gate is open, the only ADR-035-safe options are: (a) Diagnoser-prompt quality iteration ahead of the blind test, or (b) operator explicitly authorizes starting Phase 2 prep at their own risk (a documented gate exception in `adr-log.md`). Default: wait.
- Operator's parked Phase-0 Storybook/Vercel WIP stays unstaged across branches.
