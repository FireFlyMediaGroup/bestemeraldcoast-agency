# Validation Checklist

Repeatable checks the Validator agent runs after every commit. The commit's own `**Acceptance**:` line in the master plan is **always** the primary gate — this checklist is the secondary, generic layer that catches regressions the acceptance line doesn't cover.

Not every section applies to every commit. Run the sections relevant to the files touched.

---

## Always (every commit)
- [ ] Branch name follows `phase-<N>/commit-<N>.<M>-<slug>`.
- [ ] Commit message and PR title reference `Phase <N> / Commit <N>.<M>: <title>`.
- [ ] PR is open against `main` with auto-merge enabled (`gh pr view --json autoMergeRequest` returns non-null).
- [ ] CI is green on the PR before merge (auto-merge will not fire otherwise).
- [ ] CodeRabbit has reviewed and final review state is `APPROVED` (`gh pr view --json reviews --jq '.reviews | map(select(.author.login == "coderabbitai[bot]")) | last | .state'`).
- [ ] Every CodeRabbit comment is either fixed (visible in subsequent commits) or replied to with a `gh pr comment` rationale. No silent dismissals.
- [ ] After merge: branch is auto-deleted (`gh pr view --json headRefName,state` confirms).
- [ ] After merge: `git checkout main && git pull --ff-only` completes cleanly.
- [ ] No file outside the task's declared scope was modified.
- [ ] `MASTER-bec-architecture-decisions.md` and `MASTER-bec-project-plan.md` are unchanged unless the task is explicitly a docs-update task.
- [ ] `docs/dev/status/next-step.md` reflects the new current step.
- [ ] `docs/dev/status/task-log.md` has an entry for what just shipped, including merge SHA + PR URL + CodeRabbit final state + comment-resolution count.

## Foundations (Phase 0 commits)
- [ ] `pnpm install` succeeds from a clean clone.
- [ ] `pnpm turbo build` succeeds.
- [ ] `pnpm turbo lint` and `pnpm turbo type-check` pass.
- [ ] `.env.example` includes any new variable introduced by this commit.
- [ ] No secret committed (scan with `git diff` for `_KEY`, `_TOKEN`, `_SECRET`, `_URL` patterns).

## Database (Phase 1 commits + any commit touching `packages/db`)
- [ ] `drizzle-kit migrate` runs cleanly against an ephemeral Neon branch.
- [ ] `drizzle-kit migrate` is idempotent (re-running is a no-op).
- [ ] Migration tests (per ADR-016) pass.
- [ ] No prod-DB write attempted from local (per ADR-038's `PROD_DB_ALLOWED` rail).

## Apps / Frontend (any commit touching `apps/*`)
- [ ] `pnpm dev` starts the affected app without errors.
- [ ] Each route added / changed renders without console errors.
- [ ] Empty states render (per the master plan's commit prompts).
- [ ] Mobile route changes verified in iPhone Safari simulator (per ADR-029).
- [ ] Accessibility: keyboard reachable, no axe violations introduced (per ADR-036).

## Agent runtime (any commit touching `packages/agents`)
- [ ] Agent runs end-to-end against a sample input.
- [ ] Daily caps enforced (per ADR-018).
- [ ] Cost telemetry written.
- [ ] `pipeline_signals` rows written if the agent is in the editorial-rotation flow (per ADR-040).

## API endpoints (any commit adding `/api/*`)
- [ ] Authentication required (per the relevant ADR).
- [ ] Rate limit applied (per ADR-017).
- [ ] Input validated with Zod.
- [ ] Errors logged via `packages/logger` (Sentry + Axiom per ADR-012).

## Email / Newsletter (Phase 3 + any commit touching `packages/email`)
- [ ] Send is gated by `EMAIL_REAL_SEND_ENABLED` outside production (per ADR-038).
- [ ] Sending domain matches ADR-013.
- [ ] React Email components render correctly across clients.
- [ ] FTC sponsored-content disclosure present where required (per ADR-015).

## Tests
- [ ] New behavior has a unit test (per ADR-016).
- [ ] User-facing flows have a Playwright test where applicable.
- [ ] `pnpm turbo test:unit` passes.

## Phase Gate (run only when the last commit of a phase ships)
- [ ] Open the phase's "Phase X quality gate (ADR-035)" checklist in the master plan.
- [ ] Walk the list end-to-end. Every box checked, no exceptions.
- [ ] Append `PHASE X GATE PASSED` entry to `task-log.md`.
- [ ] Only then update `next-step.md` to point at Phase X+1 / Commit X+1.1.
