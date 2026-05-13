# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## Operator Pre-Flight

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency

**Credential procurement runbook:** [`docs/runbooks/secrets-setup.md`](../../runbooks/secrets-setup.md) — full 1Password vault setup, item template, per-phase credential checklist, and three options for getting values into local `.env` (manual copy / `op inject` / `op run`).

- [x] Create the GitHub repo, public visibility, default branch `main`.
- [x] Auto-merge + auto-delete head branches enabled.
- [x] CodeRabbit GitHub App installed; `.coderabbit.yaml` at repo root.
- [x] `gh auth status` shows ADMIN.
- [x] Initialize git + GitHub remote (Commit 0.1).
- [x] CodeRabbit has reviewed at least one PR.
- [x] **Pass 1 branch protection** applied.
- [x] **1Password vault `BEC-Production`** populated with Sentry × 3 DSNs + auth token + Axiom token + dataset (for Commit 0.4).
- [ ] **Pass 2 branch protection** — apply **after Commit 0.6** lands CI. Required status checks: CI job(s) + `CodeRabbit`. Check "Require branches to be up to date before merging".

## Current Step

- **Phase:** 0 — Workspace & Foundations
- **Commit:** 0.4 — Logger and Sentry
- **Plan reference:** `docs/dev/MASTER-bec-project-plan.md` § Phase 0 → Commit 0.4
- **ADRs in scope:** ADR-012 (primary), ADR-038 (env-var schema dependency from Commit 0.3).
- **Status:** in-flight (branch cut, PR not yet opened)

## Commit Prompt (excerpt)

> Create `packages/logger` exporting a Pino instance with multiple transports: pretty-print to stdout in dev, structured JSON in production with Sentry transport for warn+ and Axiom transport for everything. *(The "initialize Sentry in each Next.js app via @sentry/nextjs" half of the master plan's prompt is deferred to Commit 1.4 — the apps don't have Next.js yet.)*

## Acceptance

- `logger.error(...)` shows up in Sentry — **manual verification** via `pnpm --filter @bec/logger test-emit`, then check the Sentry web UI for 2 events (warn + error) tagged with the run's `traceId`.
- Axiom receives 3 structured log lines (info + warn + error) from the same `test-emit` run — manual verification via the Axiom web UI.
- `pnpm turbo build lint type-check test:unit` green; 13 Vitest cases inside `@bec/logger` cover sentry-transport level mapping, error reconstruction, sub-warn dropping, malformed-input resilience; axiom-transport URL building, dataset URL-encoding, custom endpoint, fetch-failure swallowing; and createLogger() shape + child loggers + base merging.

## Files Likely to Touch

- `packages/logger/src/index.ts`, `src/transports/{pretty,sentry,axiom}.ts`
- `packages/logger/src/index.test.ts`, `src/transports/{sentry,axiom}.test.ts`
- `packages/logger/scripts/test-emit.ts` (manual acceptance script)
- `packages/logger/{tsconfig.json,vitest.config.ts,test-setup.ts,package.json}` (real configs + deps)
- Bookkeeping (this PR): `docs/dev/status/task-log.md` (runbook task entry), `docs/dev/status/next-step.md` (this file), `docs/dev/claude/RALPH-LOOP.md` (three queued doc-fixes).

## Validation

- `validation-checklist.md` § Always + § Foundations.
- 13/13 Vitest cases green in `@bec/logger`.
- `pnpm turbo build lint type-check test:unit` returns `56 successful, 56 total`.
- Manual acceptance: `pnpm --filter @bec/logger test-emit` emits 3 lines with a per-run `traceId`; verify Sentry shows 2 events + Axiom shows 3.

## Next Commit After This

- **Commit 0.5 — Storybook scaffolding.** Sets up Storybook in `packages/ui` with theme switcher + `@storybook/addon-a11y`, deploys to `ui.bestemeraldcoast.com` (password-protected).
- **Prereq operator action (deferred from Commit 0.2):** Vercel Pro account active for Storybook's Vercel-hosted deployment. The deferral markers in the runbook (§4.2) flag this for Commit 0.6 — bringing it forward to 0.5 is fine.

## Handoff Notes

- Master ADR and master plan are the source of truth. If anything in this file conflicts with them, trust the masters and re-derive the next step.
- The `@sentry/nextjs` per-app initialization + Vercel source-map upload (second half of the master plan's Commit 0.4 prompt) is deferred to **Commit 1.4** — the 3 apps are still empty placeholders and `@sentry/nextjs` requires real Next.js app code to wrap.
- Sentry events from local dev DO fire when `SENTRY_DSN` is set (tagged `environment=development`). Filter `environment:production` in the Sentry UI to ignore dev noise.
- Axiom transport is a custom fetch-based stream (not `@axiomhq/pino`) — `@axiomhq/pino` requires Pino's worker-thread transport model, which conflicts with the sync `pino.multistream()` approach. Trade-off accepted: no built-in batching; per-line POSTs. Revisit if log volume climbs.
- Phase 0 ends with the ADR-035 quality gate at `MASTER-bec-project-plan.md` § "Phase 0 quality gate (ADR-035)". Do not begin Phase 1 / Commit 1.1 until that gate is 100% green.
