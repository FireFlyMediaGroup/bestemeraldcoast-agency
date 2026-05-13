# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## Operator Pre-Flight

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency

- [x] Create the GitHub repo (`FireFlyMediaGroup/bestemeraldcoast-agency`, public, default branch `main`).
- [x] Visibility: **public** (kept public while CodeRabbit OSS free tier is active; flip to private once dev concludes).
- [x] Auto-merge enabled, auto-delete head branches enabled.
- [x] CodeRabbit GitHub App installed; `.coderabbit.yaml` at repo root.
- [x] `gh auth status` shows authenticated user `FireFlyMediaGroup` with ADMIN.
- [x] Initialize git and add the GitHub remote (Commit 0.1).
- [x] CodeRabbit has reviewed at least one PR (PR #1).
- [x] **Pass 1 branch protection** applied.
- [ ] **Pass 2 branch protection** — apply after Commit 0.6 lands CI. Add required status checks: CI job(s) + `CodeRabbit`. Check "Require branches to be up to date before merging".

## Current Step

- **Phase:** 0 — Workspace & Foundations
- **Commit:** 0.3 — Environment validation
- **Plan reference:** `docs/dev/MASTER-bec-project-plan.md` § Phase 0 → Commit 0.3
- **ADRs in scope:** ADR-038 (primary), ADR-002 (`DATABASE_URL`), ADR-003 (`AGENT_API_KEY`), ADR-005 (Blob + B2), ADR-011 (PostHog), ADR-012 (Sentry + Axiom), ADR-013 (Resend + SES), ADR-017 (Upstash + Turnstile), ADR-018 (Anthropic).
- **Status:** in-flight (branch cut, PR not yet opened)

## Commit Prompt (excerpt)

> Create `packages/config/env.ts` that defines a Zod schema for every environment variable used in BEC. Group by app/package. Export typed `serverEnv` and `clientEnv` objects. The schema must boot-fail if a required variable is missing in production. Also create a `.env.example` at the repo root with every variable documented and grouped by purpose. Implement the safety rails from ADR-038 (`PROD_DB_ALLOWED`, `EMAIL_REAL_SEND_ENABLED`).

## Acceptance

- Removing `DATABASE_URL` from `.env` causes `pnpm dev` to fail with a clear message — **verified locally**: `pnpm dev` exits 1 with `✗ Environment validation failed (env=development): • DATABASE_URL: Required`.
- `.env.example` is comprehensive — covers every var in the schema, grouped by ADR with inline documentation.
- `pnpm turbo build lint type-check test:unit` produces `56 successful, 56 total` (12 Vitest tests inside `@bec/config` cover happy + sad paths, including production-strict missing-key, wrong-prefix `ANTHROPIC_API_KEY`, short `NEXTAUTH_SECRET`, empty-string-as-undefined normalization).

## PR Discipline (new this commit — Option A)

Auto-merge on this repo currently fires within seconds of opening a PR — faster than CodeRabbit's review webhook. To preserve the loop's hard gate (CodeRabbit `APPROVED` before merge), this commit and every subsequent commit follow this sequence:

1. `git push -u origin HEAD` and `gh pr create --base main` (no draft).
2. **Do NOT** enable auto-merge yet.
3. Poll `gh pr view <PR> --json reviews --jq '[.reviews[] | select(.author.login == "coderabbitai")] | length'` until the count rises (typical 1–3 min).
4. Triage CodeRabbit findings (fix → push; or reply with rationale).
5. Confirm latest CodeRabbit review state is `APPROVED`.
6. Only then `gh pr merge --auto --squash --delete-branch`.

This is a temporary workaround until Pass-2 branch protection adds `CodeRabbit` as a required status check (after Commit 0.6 lands CI). A doc-fix to `RALPH-LOOP.md` § Git Discipline is queued — proceed assuming the new ordering and update the doc next.

## Files Likely to Touch

- `packages/config/src/env.ts` (Zod schema + parseEnv)
- `packages/config/src/index.ts` (singleton export + ADR-038 safety rails)
- `packages/config/src/dev.ts` (boot-time validator wired to `pnpm dev`)
- `packages/config/src/env.test.ts` (Vitest tests)
- `packages/config/{tsconfig.json,vitest.config.ts,package.json}`
- `.env.example` (root, comprehensive)
- `turbo.json` (bump `concurrency` to handle 12+ persistent dev tasks)

## Validation

- `validation-checklist.md` § Always (every commit) + § Foundations.
- Run `pnpm turbo build lint type-check test:unit` — expect `56/56` successful.
- Manual acceptance: copy `.env.example` to `.env`, run `pnpm dev` (expect ✓), remove `DATABASE_URL` line, run `pnpm dev` again (expect ✗ with clear field error).

## Next Commit After This

- **Commit 0.4** — Logger and Sentry. Wires Pino + Sentry transport into `packages/logger`, initializes `@sentry/nextjs` in each app. Acceptance: a test `logger.error()` shows up in Sentry. **Prereqs operator must complete first**: Sentry projects (×3) + Axiom workspace (deferral markers in Commit 0.2's checklist).

## Handoff Notes

- Master ADR and master plan are the source of truth. If anything in this file conflicts with them, trust the masters and re-derive the next step.
- Schema design: per-env strictness via `serverSchema.merge(productionRequired)` when `env === "production"`. Optional fields use `.optional()` and accept empty strings (normalized to `undefined` at parse time — `.env` files commonly leave placeholders as `KEY=`).
- ADR-038 safety rails are exposed as functions (`assertProdDbAccessible()`, `shouldSendRealEmail()`) rather than properties, so the throw fires at the call site rather than at module load.
- Phase 0 ends with the ADR-035 quality gate at `MASTER-bec-project-plan.md` § "Phase 0 quality gate (ADR-035)". Do not begin Phase 1 / Commit 1.1 until that gate is 100% green.
