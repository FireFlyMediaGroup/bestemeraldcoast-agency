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

**Gate impact:** boxes 9 (deploy + magic link) and Neon-verify are now
✅; box 10 (iPhone-Safari) is 🟡 (login proven; device confirmation +
add-to-home-screen still pending — quick check, blocker removed). The gate
is still **NOT PASSED** (ADR-035): live agents + human eval + DR remain.
Repo: local `main` == `origin/main` == `814fb38`; no open PRs.

## Operator action list to clear the Phase 1 gate

Ordered so each step unblocks the next:

1. ✅ **DONE — Provision Neon via Vercel; verify prod + preview** (gate box 1). Neon reconfigured 2026-05-18; verified by the successful end-to-end magic-link sign-in.
2. ✅ **DONE — live DB bring-up** (gate boxes 3–8). `db:migrate` applied 0000–0003; `PROD_DB_ALLOWED=true … db:seed` (process-scoped ADR-038 opt-in) succeeded idempotently against prod Neon: 8 sites / 48 categories / 2 authors / 9 agent_budgets / 10 niches / 30 mappings / 120 season_weights / 8 season_events; acceptance `getSeasonalWeight('charter_fishing', 2026-06-15) = 1.5`. Evidence recorded in the PHASE 1 GATE — STATUS entry.
3. ✅ **DONE — Deploy `bec-ops-console` + magic link** (gate box 9). Deployed to `ops.bestemeraldcoast.com`; Resend `noreply@ops.bestemeraldcoast.com` subdomain verified; env set via Vercel CLI on the correctly-linked project; operator-confirmed sign-in 2026-05-18.
4. **Log in on iPhone Safari** (gate box 10 — 🟡, blocker removed): repeat the now-working sign-in on iPhone Safari, confirm no bugs, add to Home Screen, confirm chrome-less standalone launch (closes Commit 1.4 + 1.7 device acceptance). *(Optional: drop a 180×180 `apps/ops-console/app/apple-icon.png` for a branded glyph.)*
5. **Run Scout**: `claude /scout pensacola charter fishing` (gate boxes 11, 12). **Prereqs (discovered + partly fixed 2026-05-18):**
   - ✅ **Agent-API middleware bypass fixed (PR #33, SHA `96ce5c9`)** — `/api/agent/*` was 302→`/login` behind the NextAuth session guard, making the entire agent write path unreachable. Now excluded from the matcher (it has its own Bearer boundary, ADR-003).
   - ⏳ **Redeploy ops-console off `main`** so PR #33 is live, then verify: `curl -s -o /dev/null -w '%{http_code}' -X POST https://ops.bestemeraldcoast.com/api/agent/agent-runs` → must be **401**, not 302.
   - ⏳ **Scout launch env** — `OPS_CONSOLE_URL` is defined **nowhere** (`.env`/`.env.example`): add `OPS_CONSOLE_URL=https://ops.bestemeraldcoast.com`. Relaunch `claude` with the repo env exported so `DATABASE_URL_UNPOOLED`, `AGENT_API_KEY`, `GOOGLE_MAPS_API_KEY` reach the process and `postgres-ro` MCP connects (verify: `claude mcp list` → `postgres-ro ✓ Connected`).
   - Then run Scout. Confirm ≥10 `leads` rows + matching `pipeline_signals` (`lead_added`) rows; daily cap respected.
6. **Run Diagnoser**: `/diagnose-pending`. Confirm a ~50-word diagnosis per lead + `pipeline_signals` (`diagnosis_done`) rows; spot-check the `GET /api/agent/pipeline-signals?niche=charter_fishing&since=<14d-ago>` trailing query (gate boxes 13, 14).
7. **External blind validation** (gate box 15): show 3 peers 5 random Diagnoser `summary` outputs blind; record ≥3/5 "human". If it fails, that is a Diagnoser-prompt iteration (ADR-019 `version: 2` + adr-log note) — a real loop task, *not* a gate skip.
8. **Run one restore drill** (ADR-006, gate box 17): restore the Neon backup to a scratch branch, verify row counts, document the runbook timing.

When all boxes are green: replace the `PHASE 1 GATE — STATUS` entry in
`task-log.md` with `## <date> — PHASE 1 GATE PASSED` (paste the fully-checked
checklist), then set this file's Current Step to **Phase 2 / Commit 2.1** and
the loop resumes.

## Current Step

- **Phase:** 1 — quality gate (ADR-035). **Status: NOT PASSED — but materially advanced (2026-05-18): DB + deploy + login all closed; 6/13 boxes green, 1 yellow.** Residual blockers: live Scout run, live Diagnoser run, iPhone-Safari device check, blind validation, restore drill (operator action list above).
- **Plan ref:** `MASTER-bec-project-plan.md` § Phase 1 quality gate.
- **Do NOT:** start Phase 2 / Commit 2.1, or mark the gate passed, until the operator closes the items and records `PHASE 1 GATE PASSED`.

## Next Step After the Gate Passes

- **Phase 2 / Commit 2.1** (Outreach + Editorial Foundation — Pitcher/Checker/Editor; see `MASTER-bec-project-plan.md` § Phase 2).

## Handoff Notes

- Master ADR + master plan are source of truth. CodeRabbit-advisory standing; `RALPH-LOOP.md` 7b–7e. The policy held cleanly for 6 consecutive PRs (#17–#22) — zero per-PR operator decisions.
- The loop is at a legitimate operator-gated stop. This is **not** a failure — it is the ADR-035 design: implementation is exhausted; deploy + live-agent + human-eval + DR are operator responsibilities.
- If the operator wants the loop to keep producing value while the gate is open, the only ADR-035-safe options are: (a) Diagnoser-prompt quality iteration ahead of the blind test, or (b) operator explicitly authorizes starting Phase 2 prep at their own risk (a documented gate exception in `adr-log.md`). Default: wait.
- Operator's parked Phase-0 Storybook/Vercel WIP stays unstaged across branches.
