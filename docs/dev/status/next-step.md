# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## 🔴 Security action (still open)

- **Rotate the Neon `neondb_owner` password.** A shell `.env` sourcing during the Commit 1.4 DB verification echoed the connection string into command output. Rotate in Neon → update `.env` (`DATABASE_URL` + `DATABASE_URL_UNPOOLED`) → update the `BEC-Production` 1Password item. Dev branch, low real-world risk, but rotate on principle.

## Operator Pre-Flight

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency
**Runbooks:** [`secrets-setup.md`](../../runbooks/secrets-setup.md) · [`storybook-deploy.md`](../../runbooks/storybook-deploy.md) · [`ops-console-deploy.md`](../../runbooks/ops-console-deploy.md)

- [x] Phase 0 ADR-035 gate passed; 1Password + Vercel Pro + Storybook + Neon/Turbo GH secrets done.
- [x] Commit 1.1/1.2 live-verified; Pass-2 branch protection LIVE; CodeRabbit-advisory policy proven across PRs #17–#19 (zero per-PR operator decisions).
- [ ] **Rotate Neon password** (security action above).
- [ ] **Deploy `bec-ops-console` to Vercel + verify Resend domain** — unblocks device/runtime-gated acceptance for Commits 1.4 (login), 1.5 (agent API curl), 1.6 (mobile Leads), 1.7 (Add-to-home-screen), 1.8 (Scout), **and 1.9 (Diagnoser PATCHes leads via the live agent API).**
- [ ] **Provision Upstash Redis + set `UPSTASH_REDIS_REST_URL` / `_TOKEN`** in Vercel. Production anti-abuse OFF until set.
- [ ] **Set `GOOGLE_MAPS_API_KEY`** (Places API) + **`AGENT_API_KEY`** + **`OPS_CONSOLE_URL`** + ensure **`DATABASE_URL_UNPOOLED`** in the agent runtime env — Scout (1.8) and Diagnoser (1.9) need these for the Google Maps MCP, the Bearer agent API, and the read-only Postgres MCP respectively. ADR-038: add `GOOGLE_MAPS_API_KEY` to the `@bec/config` schema when agent-runtime app code lands (not in 1.8/1.9 — prompt artifacts only).
- [ ] Add a 180×180 `apps/ops-console/app/apple-icon.png` (Commit 1.7 follow-up; non-blocking).
- [ ] (Optional, deferred) Promote `CodeRabbit` to a required check only if its reliability is fixed.

## Current Step

- **Phase:** 1 — Database, Ops Console, Lead Pipeline.
- **Commit:** **1.9 — Agent runtime: Diagnoser** (this branch: `phase-1/commit-1.9-agent-diagnoser`).
- **Plan ref:** `MASTER-bec-project-plan.md` § Phase 1 → Commit 1.9.
- **ADRs:** ADR-019 (prompt `version: 1` → `agentRuns.promptVersion`), ADR-003 (writes via agent API only; reads via read-only Postgres MCP — the agent surface is POST/PATCH-only, no GET), ADR-018 (`agent_runs` logging), ADR-035 (Diagnoser daily cap **30**), ADR-034 (copy-quality rubric + banned phrases — Diagnoser applies it to the diagnosis text). No ADR text changes; no schema; no app code.
- **Status:** branch cut from `82366fd`; bookkeeping (this rewrite + the Commit 1.8 task-log entry) lands first, then the Diagnoser artifacts.

## What Commit 1.9 must ship

Per master plan § Commit 1.9 — **prompt/config artifacts only**:

> `agency/.claude/agents/diagnoser.md` (frontmatter `version: 1`): input = a lead id with status `new`; fetch business detail, visit website (or note absence), evaluate the Diagnoser checklist (loading speed, mobile responsiveness, age signals, conversion-element presence, schema markup, indexing), write a **50-word diagnosis**, propose a tiered offer ($1.5K starter / $3.5K standard / $7.5K growth / $200-mo maintenance) based on `gap_score`, apply the ADR-034 copy rubric, update the lead via API to status `diagnosed`, log to `agent_runs`. Slash commands `/diagnose [lead_id]` and batch `/diagnose-pending` (up to today's remaining cap of 30).

**Acceptance**: For 10 leads, Diagnoser produces 10 diagnoses. Operator review confirms ≥7/10 sound like a thoughtful human consultant.

Implementation notes:
- **Also create the two ADR-034 rubric files** `agency/.claude/rubrics/copy-quality.md` + `banned-phrases.md` (currently only `.gitkeep`). ADR-034 mandates them as the single source of truth referenced by the Diagnoser now and Checker later — Diagnoser must reference, not inline-duplicate, them.
- Reads (lead + business detail, `new`-status leads for the batch, today's diagnosed-count for the cap) go through the **read-only Postgres MCP** (no GET API per ADR-003). Cap accounting = count `lead_status_history` rows with `to_status = 'diagnosed'` and `created_at >= date_trunc('day', now())` (authoritative) — remaining = 30 − that.
- Write path: `PATCH ${OPS_CONSOLE_URL}/api/agent/leads/<id>` with `{ status: "diagnosed", changedBy: "diagnoser", reason, diagnosis: {…}, offer: {…} }` (the Commit-1.5 PatchLead schema — `changedBy` required; `new → diagnosed` is a valid transition; status + jsonb applied atomically; concurrent move → 409, already-diagnosed → skip). `diagnosis` must conform to the `Diagnosis` jsonb shape (gapScore/components/summary/findings/recommendedOffer/scoringVersion); `offer` to the `Offer` shape (type∈enum/headline/bullets/priceCents/expiresAt?).
- `agent_runs`: open with `agentName: "diagnoser"`, `promptVersion: 1`, `inputLeadIds: [<id>]`; finalize `status` ∈ `succeeded|failed|aborted` with a `[diagnoser-metrics diagnosed=K]` token in `output_summary`.
- Acceptance is operator-judged on diagnosis quality (≥7/10 human-sounding) — runtime-gated; locally-provable: artifacts exist, valid `version: 1` frontmatter, rubric files present, commands delegate correctly, `pnpm turbo` stays 48/48 (no workspace code).

## Next Commit After This

- **Phase 1 / Commit 1.10 — Editorial rotation foundation schema** (real `packages/db` schema + migrations + seed work — back to code).

## Handoff Notes

- Master ADR + master plan are source of truth. CodeRabbit-advisory standing; follow `RALPH-LOOP.md` 7b–7e.
- Commits 1.8/1.9 touch no TS/workspace code (prompt + MCP + command + rubric markdown/JSON); local gate is artifact validity; `pnpm turbo` stays 48/48.
- Operator's parked Phase-0 Storybook/Vercel WIP stays unstaged across branches.
- Commits 1.4–1.9 device/runtime-gated acceptance all collapse onto the single `bec-ops-console` Vercel deploy + the agent env keys in the pre-flight.
