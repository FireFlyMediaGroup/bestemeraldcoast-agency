# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## 🔴 Security action (still open)

- **Rotate the Neon `neondb_owner` password.** A shell `.env` sourcing during the Commit 1.4 DB verification echoed the connection string into command output. Rotate in Neon → update `.env` (`DATABASE_URL` + `DATABASE_URL_UNPOOLED`) → update the `BEC-Production` 1Password item. Dev branch, low real-world risk, but rotate on principle.

## Operator Pre-Flight

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency
**Runbooks:** [`secrets-setup.md`](../../runbooks/secrets-setup.md) · [`storybook-deploy.md`](../../runbooks/storybook-deploy.md) · [`ops-console-deploy.md`](../../runbooks/ops-console-deploy.md)

- [x] Phase 0 ADR-035 gate passed; 1Password + Vercel Pro + Storybook + Neon/Turbo GH secrets done.
- [x] Commit 1.1/1.2 live-verified (db:migrate + db:seed ×2 against Neon dev branch).
- [x] **Pass-2 branch protection LIVE**; PRs #16/#17/#18 merged naturally under it.
- [x] **CodeRabbit advisory policy proven** across #17/#18 — zero per-PR operator decisions.
- [ ] **Rotate Neon password** (security action above).
- [ ] **Deploy `bec-ops-console` to Vercel + verify Resend domain** — per `ops-console-deploy.md`. Unblocks device/operator-gated acceptance for Commits 1.4 (iPhone login), 1.5 (agent API curl), 1.6 (mobile Leads), 1.7 (Add-to-home-screen), **and 1.8 (Scout writes to the live agent API).**
- [ ] **Provision Upstash Redis + set `UPSTASH_REDIS_REST_URL` / `_TOKEN`** in Vercel. Production anti-abuse OFF until set.
- [ ] **Set `GOOGLE_MAPS_API_KEY`** (Places API enabled) for the Scout MCP — add to `.env` + `BEC-Production` 1Password. Commit 1.8 registers the Google Maps MCP; Scout cannot discover businesses without it. **ADR-038 follow-up:** add `GOOGLE_MAPS_API_KEY` to the `@bec/config` env schema (dev-optional, prod-required) when Phase 1 agent runtime is wired — noted, not done in 1.8 (1.8 ships prompt/MCP artifacts only, no app code touching `@bec/config`).
- [ ] **Set `AGENT_API_KEY` + `OPS_CONSOLE_URL`** in the agent runtime environment — Scout authenticates to the Commit-1.5 agent API with the Bearer key and posts to `${OPS_CONSOLE_URL}/api/agent/*`. Same key the operator sets in Vercel for the ops-console.
- [ ] Add a 180×180 `apps/ops-console/app/apple-icon.png` (Commit 1.7 follow-up; Add-to-home-screen works without it, glyph just unbranded).
- [ ] (Optional, deferred) Promote `CodeRabbit` to a required check only if its reliability is fixed.

## Current Step

- **Phase:** 1 — Database, Ops Console, Lead Pipeline.
- **Commit:** **1.8 — Agent runtime: Scout** (this branch: `phase-1/commit-1.8-agent-scout`).
- **Plan ref:** `MASTER-bec-project-plan.md` § Phase 1 → Commit 1.8.
- **ADRs:** ADR-003 (Postgres is source of truth; agents mutate **only** via the agent API; filesystem is for prompt artifacts), ADR-019 (prompt YAML frontmatter `version: N` → written to `agentRuns.promptVersion`), ADR-018 (all work logged via `agent_runs`), ADR-035 (Scout daily caps: 150 scanned / 30 leads added), ADR-031 (`doNotContact` excluded from Scout queries). Gap-score formula per the architecture doc (review_count×0.3 + rating×0.2 + website_age×0.3 + channel_diversity×0.1 + niche_priority×0.1, 0–100). No ADR text changes.
- **Status:** branch cut from `8e4ee58`; bookkeeping (this rewrite + the Commit 1.7 task-log entry) lands first, then the Scout artifacts.

## What Commit 1.8 must ship

Per master plan § Commit 1.8 — **prompt/config artifacts only, no application code**:

> `agency/.claude/agents/scout.md` (frontmatter `version: 1`): input = query (niche + city); Google Maps MCP → ≤150 businesses within the city geo radius; resolve `googlePlaceId`; check existence via the agent API; if new, POST it; evaluate gap-score signals; if score ≥ 60 create a lead with status `new`; respect daily caps (150 scanned, 30 leads added); log all work via `agent_runs`. `agency/.mcp.json`: register Google Maps MCP + a read-only Postgres MCP. `agency/.claude/commands/scout.md`: `/scout` taking a query string.

**Acceptance**: `claude /scout pensacola charter fishing` produces ≥10 lead rows in DB with diagnoses pending. Daily cap enforced.

Implementation notes:
- ADR-003 boundary: Scout **writes only through the Commit-1.5 agent API** (`POST /api/agent/agent-runs` start → `…/businesses` upsert-by-googlePlaceId → `…/leads` create → `…/agent-runs/:id/finalize`). The read-only Postgres MCP is for **dedup/cap visibility reads only**, never writes.
- Daily caps are derived from `agent_runs` (today's scanned/added counts via the read-only Postgres MCP), not a filesystem state file — ADR-003 keeps the filesystem prompt-artifact-only.
- `.mcp.json` uses `${VAR}` expansion (`GOOGLE_MAPS_API_KEY`, `DATABASE_URL_UNPOOLED`, `AGENT_API_KEY`, `OPS_CONSOLE_URL`) — no secrets committed.
- Acceptance (`claude /scout …` → ≥10 leads) is runtime/operator-gated (needs the deployed agent API + Google Maps key); locally-provable parts: artifacts exist, valid YAML frontmatter with `version: 1`, `.mcp.json` is valid JSON, `/scout` references the Scout agent + the daily-cap/ADR-003 rules. No workspace code changes → `pnpm turbo` stays 48/48.

## Next Commit After This

- **Phase 1 / Commit 1.9 — Agent runtime: Diagnoser.**

## Handoff Notes

- Master ADR + master plan are source of truth. Loop-doc/bookkeeping changes recorded in adr-log/task-log; renumber nothing.
- CodeRabbit-advisory is standing policy — follow `RALPH-LOOP.md` 7b–7e; do not re-litigate per-PR.
- Commit 1.8 touches no TS/workspace code (prompt + MCP + command markdown/JSON only); the local gate is artifact validity + JSON lint, and `pnpm turbo` remains 48/48 (nothing for it to rebuild).
- Operator's parked Phase-0 Storybook/Vercel WIP stays unstaged across branches.
- Commits 1.4–1.8 device/runtime-gated acceptance all collapse onto the single `bec-ops-console` Vercel deploy + the Scout env keys in the pre-flight.
