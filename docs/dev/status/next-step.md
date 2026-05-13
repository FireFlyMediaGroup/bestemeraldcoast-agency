# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## Operator Pre-Flight

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency

**Credential procurement runbook:** [`docs/runbooks/secrets-setup.md`](../../runbooks/secrets-setup.md) — full 1Password vault setup, item template, per-phase credential checklist, and three options for getting values into local `.env` (manual copy / `op inject` / `op run`).

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

- **Phase:** N/A — off-plan task (per `docs/dev/task-template.md`)
- **Task:** Secrets & 1Password setup runbook
- **Branch:** `task/2026-05-13-secrets-setup-runbook`
- **ADRs in scope:** none directly (operationalizes ADR-007 and ADR-038)
- **Status:** in-flight (branch cut, PR not yet opened)

## Task Prompt

> Write `docs/runbooks/secrets-setup.md` that walks the operator through 1Password vault setup, the standard item template (custom fields: `value`, `vendor_url`, `rotation_due`, `env_used`, `env_var`, `adr`), the full per-credential checklist organized by the commit that first needs each one, three options for getting values into local `.env` (manual copy / `op inject` / `op run`), and ADR-007's rotation policy. Link from `docs/dev/status/next-step.md` § Operator Pre-Flight.

## Acceptance

- `docs/runbooks/secrets-setup.md` exists and covers: 1Password account + vault setup, CLI install + signin, the per-item field template, every `.env` variable mapped to its source service and 1Password item title, ADR cross-references, and the rotation policy.
- `docs/dev/status/next-step.md` § Operator Pre-Flight contains a link to the runbook.
- PR opens against `main` (non-draft, no auto-merge enabled), CodeRabbit `APPROVED`, then squash-merged.

## Files Touched

- `docs/runbooks/secrets-setup.md` (new)
- `docs/runbooks/.gitkeep` (removed — directory now has real content)
- `docs/dev/status/next-step.md` (this file — runbook link + advance pointer)
- `docs/dev/status/task-log.md` (Commit 0.3 entry + this task's entry, folded in per the post-Pass-1 write policy)

## Validation

- `validation-checklist.md` § Always (every commit) — docs-only PR; no test or schema impact.
- Links resolve: the runbook reference from `next-step.md` and from `task-log.md` both work via relative paths.

## Next Step After This

- **Commit 0.4 — Logger and Sentry.** Implements `packages/logger/` (Pino + multi-transport: pretty stdout in dev, JSON in prod, Sentry transport for `warn+`, Axiom transport for everything). Wires `@sentry/nextjs` into each Next.js app. Acceptance: a test `logger.error()` shows up in Sentry.
- **Prereq operator action (deferred from Commit 0.2):** provision Sentry × 3 projects + Axiom workspace per the runbook above. Local `.env` should have `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `AXIOM_TOKEN`, `AXIOM_DATASET` populated before Commit 0.4 begins.

## Handoff Notes

- Master ADR and master plan are the source of truth. If anything in this file conflicts with them, trust the masters and re-derive the next step.
- This task is **off-plan** — it does not appear in `MASTER-bec-project-plan.md` (per the convention that task-template work is operational/supplementary rather than architectural). `task-log.md` records it under a date-stamped "Task" header instead of a Phase/Commit header.
- Two doc-fix items still queued for `RALPH-LOOP.md`: (1) Option A — open PR without auto-merge, wait for `APPROVED`, then enable auto-merge; (2) formalize the task-template entry format in `task-log.md`. Both fold into a future commit's PR.
- Phase 0 ends with the ADR-035 quality gate at `MASTER-bec-project-plan.md` § "Phase 0 quality gate (ADR-035)". Do not begin Phase 1 / Commit 1.1 until that gate is 100% green.
