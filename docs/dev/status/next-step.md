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

- **Rotate the Neon `neondb_owner` password.** A shell `.env` sourcing during the Commit 1.4 DB verification echoed the connection string. Rotate in Neon → update `.env` (`DATABASE_URL` + `DATABASE_URL_UNPOOLED`) → update the `BEC-Production` 1Password item.

## Operator action list to clear the Phase 1 gate

Ordered so each step unblocks the next:

1. **Provision Neon via Vercel; verify prod + preview branches** (gate box 1). Confirm `DATABASE_URL` / `DATABASE_URL_UNPOOLED` for each environment land in `.env` + 1Password (`BEC-Production`).
2. **Run the live DB bring-up against the Neon dev branch** (gate boxes 3–8): `pnpm --filter @bec/db db:migrate` then `pnpm --filter @bec/db db:seed`. Capture the seed tail line `getSeasonalWeight('charter_fishing', 2026-06-15) = 1.5` and the per-table "rows attempted" counts (8 sites / 10 niches / 30 mappings / 120 weights / 8 events) as gate evidence. (ADR-038: needs `PROD_DB_ALLOWED`-style opt-in only if pointing at non-dev; dev branch is fine.)
3. **Deploy `bec-ops-console` to `ops.bestemeraldcoast.com`** per `runbooks/ops-console-deploy.md`; verify the Resend sending domain; set Vercel env: `OPERATOR_EMAIL`, `AGENT_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `GOOGLE_MAPS_API_KEY`, `OPS_CONSOLE_URL` (= the deployed URL), DB URLs. (Gate boxes 9.)
4. **Log in on iPhone Safari** via the magic link; confirm no bugs; add to Home Screen and confirm chrome-less standalone launch (closes Commit 1.4 + 1.7 device acceptance; gate box 10). *(Drop a 180×180 `apps/ops-console/app/apple-icon.png` first if you want a branded glyph — optional.)*
5. **Run Scout**: `claude /scout pensacola charter fishing` (agent env: `GOOGLE_MAPS_API_KEY`, `AGENT_API_KEY`, `OPS_CONSOLE_URL`, `DATABASE_URL_UNPOOLED`). Confirm ≥10 `leads` rows + matching `pipeline_signals` (`lead_added`) rows; daily cap respected (gate boxes 11, 12).
6. **Run Diagnoser**: `/diagnose-pending`. Confirm a ~50-word diagnosis per lead + `pipeline_signals` (`diagnosis_done`) rows; spot-check the `GET /api/agent/pipeline-signals?niche=charter_fishing&since=<14d-ago>` trailing query (gate boxes 13, 14).
7. **External blind validation** (gate box 15): show 3 peers 5 random Diagnoser `summary` outputs blind; record ≥3/5 "human". If it fails, that is a Diagnoser-prompt iteration (ADR-019 `version: 2` + adr-log note) — a real loop task, *not* a gate skip.
8. **Run one restore drill** (ADR-006, gate box 17): restore the Neon backup to a scratch branch, verify row counts, document the runbook timing.

When all boxes are green: replace the `PHASE 1 GATE — STATUS` entry in
`task-log.md` with `## <date> — PHASE 1 GATE PASSED` (paste the fully-checked
checklist), then set this file's Current Step to **Phase 2 / Commit 2.1** and
the loop resumes.

## Current Step

- **Phase:** 1 — quality gate (ADR-035). **Status: NOT PASSED — blocked on the operator action list above.**
- **Plan ref:** `MASTER-bec-project-plan.md` § Phase 1 quality gate.
- **Do NOT:** start Phase 2 / Commit 2.1, or mark the gate passed, until the operator closes the items and records `PHASE 1 GATE PASSED`.

## Next Step After the Gate Passes

- **Phase 2 / Commit 2.1** (Outreach + Editorial Foundation — Pitcher/Checker/Editor; see `MASTER-bec-project-plan.md` § Phase 2).

## Handoff Notes

- Master ADR + master plan are source of truth. CodeRabbit-advisory standing; `RALPH-LOOP.md` 7b–7e. The policy held cleanly for 6 consecutive PRs (#17–#22) — zero per-PR operator decisions.
- The loop is at a legitimate operator-gated stop. This is **not** a failure — it is the ADR-035 design: implementation is exhausted; deploy + live-agent + human-eval + DR are operator responsibilities.
- If the operator wants the loop to keep producing value while the gate is open, the only ADR-035-safe options are: (a) Diagnoser-prompt quality iteration ahead of the blind test, or (b) operator explicitly authorizes starting Phase 2 prep at their own risk (a documented gate exception in `adr-log.md`). Default: wait.
- Operator's parked Phase-0 Storybook/Vercel WIP stays unstaged across branches.
