# Task Log

**Append-only log of completed commits.** `/ship-task` writes here. Do not rewrite history; if a commit is reverted, append a new entry noting the revert.

## Format
Each entry:
```
## YYYY-MM-DD — Phase X / Commit X.Y — <title>
- Branch: phase-<N>/commit-<N>.<M>-<slug>
- PR: <full PR URL>
- Merge SHA: <40-char SHA from `gh pr view --json mergeCommit`>
- CodeRabbit: APPROVED — <N> comments resolved (<F fixed, R replied>)
- ADRs touched: <list, or "none">
- Acceptance evidence: <one-line proof referencing the master plan's `Acceptance:` line>
- Validation: <what was run from validation-checklist.md; pass/fail>
- Files changed: <count + key files>
- Next commit queued: Phase X / Commit X.Y
- Notes: <optional>
```

For **operator-only** commits (e.g., Commit 0.2):
```
## YYYY-MM-DD — Phase X / Commit X.Y — <title> (Manual)
- Branch: none (operator work)
- PR: none
- Merge SHA: none
- Operator checklist: <link to filled-in checklist or paste>
- Next commit queued: Phase X / Commit X.Y
```

## Entries

## 2026-05-12 — Phase 0 / Commit 0.1 — Monorepo skeleton

- Branch: none (bootstrap exception per `claude/RALPH-LOOP.md` § Bootstrap — Commit 0.1 only)
- PR: none (no repo to PR against until initial `main` exists)
- Merge SHA: ec886e0d8052cff1dde01d0f0a7851fd3545c767
- CodeRabbit: N/A (no PR for the initial commit)
- ADRs touched: none (implements ADR-039; stubs scope for ADR-038's Commit 0.3 work)
- Acceptance evidence: `pnpm install` succeeded (15 workspace projects resolved, turbo 2.9.12 installed); `pnpm turbo build` produced `14 successful, 14 total` no-op tasks; tree matches `MASTER-bec-project-plan.md` § Repo structure (apps × 3, packages × 11, `agency/`, `infra/`, `docs/`).
- Validation: `pnpm turbo lint type-check` produced `28 successful, 28 total`; staged-diff secret scan returned only doc-text references (no real secrets); master ADR and master plan untouched.
- Files changed: 54 created (root configs, 14 workspace `package.json` files, two real shared-config packages, `.gitkeep` placeholders, plus the pre-existing docs and `.coderabbit.yaml` carried into the initial commit).
- Next commit queued: Phase 0 / Commit 0.1.5 — Install Ralph slash commands (off-plan loop-infrastructure commit added between 0.1 and 0.2 to wire `.claude/commands/` and exercise the standard PR + CodeRabbit flow before Commit 0.3)
- Notes: Node 22 in `.nvmrc` and `engines.node`; pnpm pinned to `10.13.1`. Local shell still on Node 20.19.5 — install ran with the expected "unsupported engine" warning. `.claude/settings.json` is the committed allowlist; `.claude/settings.local.json` is gitignored.

## 2026-05-13 — Phase 0 / Commit 0.1.5 — Install Ralph slash commands

- Branch: phase-0/commit-0.1.5-install-ralph-commands
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/1
- Merge SHA: 251f3c1249f5d4b0518acfd85fedc81ff15f7d1d
- CodeRabbit: APPROVED — 4 comments resolved (4 fixed, 0 replied)
- ADRs touched: none (off-plan loop-infrastructure work; required a project-plan amendment inserting Commit 0.1.5 between 0.1 and 0.2)
- Acceptance evidence: `.claude/commands/{adr-plan,ralph-next,ship-task}.md` exist on `main` as symlinks resolving to `docs/dev/claude/commands/*.md`; PR opened against `main` with manual `@coderabbitai review` trigger (required by `.coderabbit.yaml`'s `auto_review.drafts: false`); after fix commit `c883b25`, CodeRabbit posted `APPROVED`; squash-merged via `gh pr merge --auto --squash --delete-branch`; remote branch auto-deleted (HTTP 404 on the branch endpoint confirms).
- Validation: 4/4 CodeRabbit findings addressed in `c883b25` — 7 MD022 heading-spacing inserts in `next-step.md`, 1 status line correction, 1 MD022 in `task-log.md`, 1 short→full SHA expansion (`ec886e0` → 40-char). All validation-checklist § Always items satisfied.
- Files changed: 6 in PR (3 symlinks, master plan +6 lines, next-step.md rewritten, task-log.md +12 lines) + 2 in fix commit (next-step.md +9, task-log.md +2).
- Next commit queued: Phase 0 / Commit 0.2 — Cloud accounts & domains (operator-only manual work)
- Notes: First end-to-end exercise of the standard PR + CodeRabbit + auto-merge flow. Surfaces three doc-fix items, addressed in companion commit on `main`: (1) RALPH-LOOP.md step 7c example used `coderabbitai[bot]` but this repo's bot login is `coderabbitai` (no suffix); (2) `auto_review.drafts: false` means manual `@coderabbitai review` is required on every draft push; (3) `/ship-task`'s write path (status-file-only commits) was unspecified — now documented as "direct to main pre-Pass-1 protection; folded into next commit's PR post-protection." Pass-1 branch protection is now actionable (operator step).

## 2026-05-13 — Phase 0 / Commit 0.1.7 — Public repo hygiene

- Branch: phase-0/commit-0.1.7-public-repo-hygiene
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/2
- Merge SHA: 1bb1c5413aa167c64d70616dd90d5ceeb1046c25
- CodeRabbit: SKIPPED — auto-merge fired in seconds before CodeRabbit's webhook could queue a review; CodeRabbit posted a SUCCESS status check 16 min post-merge but no `reviews` API submission. Manual `@coderabbitai review` after merge produced no review either. **Mitigation**: starting with Commit 0.3, the standard flow opens a PR without enabling auto-merge, waits for CodeRabbit's `APPROVED` review, then enables auto-merge. RALPH-LOOP.md doc-fix queued for that change.
- ADRs touched: none (loop-infrastructure / hygiene commit; required an off-plan project-plan amendment inserting Commit 0.1.7 between 0.1.5 and 0.2).
- Acceptance evidence: `.gitignore` rewritten with categories (env, certs/keys, cloud caches, SSH, DB dumps, IaC state, OS/editor scratch) and smoke-tested with 8 placeholder credential filenames — all caught (`.env`, `.aws-credentials`, `aws-credentials.json`, `test.pem`, `id_rsa`, `credentials.json`, `service-account.json`, `client_secret_abc.json`). `next-step.md` § Commit 0.2 Acceptance preview annotates every item with its actual blocker (`now` / `kick off now` / `deferred to Commit X` / `deferred to Phase X`).
- Validation: pnpm install clean; pnpm turbo build / lint / type-check / test:unit all green; staged-diff scan for secrets returned only doc-text references; master plan amendment is the only modification to `MASTER-bec-project-plan.md`.
- Files changed: 3 (`.gitignore`, `docs/dev/MASTER-bec-project-plan.md`, `docs/dev/status/next-step.md`); 162 insertions / 46 deletions.
- Next commit queued: Phase 0 / Commit 0.3 — Environment validation
- Notes: A second AI reviewer (`cubic · AI code reviewer`) was discovered active on the repo via PR #2's check-runs; it's not configured by the loop docs. Deferred decision (use as second opinion vs. disable) is documented and unresolved.

## 2026-05-13 — Phase 0 / Commit 0.3 — Environment validation

- Branch: phase-0/commit-0.3-environment-validation
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/3
- Merge SHA: 7b80238cf21413d7180118adc2f348d570418936
- CodeRabbit: APPROVED — 1 comment resolved (1 fixed, 0 replied). Initial review COMMENTED with one Major outside-diff suggestion (add explicit empty-string normalization tests in env.test.ts), then APPROVED ~3s later as a second review object. Fix push (`e150efe`) added the two suggested tests; no re-review landed before merge (operator approved manually; the existing APPROVED state was sufficient). Final review state APPROVED via review #2.
- ADRs touched: none (implements ADR-038 + references ADRs 002/003/005/011/012/013/017/018).
- Acceptance evidence: `pnpm install` clean; `pnpm turbo build lint type-check test:unit` produced `56 successful, 56 total`; 14 Vitest cases inside `@bec/config` (env resolution, dev minimal path, missing-DATABASE_URL, wrong-prefix `ANTHROPIC_API_KEY`, short `NEXTAUTH_SECRET`, boolean normalization, empty-string-to-undefined for both optional and production-required fields). Manual acceptance: `cp .env.example .env && pnpm dev` → exit 0 with `✓ environment validated (env=development)`; removing the `DATABASE_URL` line → `pnpm dev` exits 1 with `✗ Environment validation failed (env=development): • DATABASE_URL: Required`.
- Validation: `validation-checklist.md` § Always + § Foundations all green.
- Files changed: 12 in the main commit (`.env.example`, 7 files under `packages/config/`, `turbo.json` concurrency bump, `pnpm-lock.yaml` regeneration, status-file updates) + 1 in the fix commit (`env.test.ts` +17 lines).
- Next commit queued: Phase 0 / Commit 0.4 — Logger and Sentry (operator must provision Sentry × 3 projects + Axiom workspace first per the deferral markers from Commit 0.1.7).
- Notes: First commit where the Option A discipline ran end-to-end: open non-draft PR → CodeRabbit auto-reviewed in ~30s → APPROVED → enable auto-merge → squash-merge in seconds. Turbo's default `concurrency: 10` rejected 12 persistent dev tasks; bumped to `concurrency: "20"` in `turbo.json`. `verbatimModuleSyntax: true` from the shared tsconfig forced explicit `.js` extensions on internal imports — works correctly with `tsx`. The bookkeeping for 0.3 (this entry + next-step advance) was deferred to the next merging PR per the post-Pass-1 write policy.

## 2026-05-13 — Task — Secrets & 1Password setup runbook

- Type: Off-plan documentation (task-template workflow per `docs/dev/task-template.md`).
- Branch: task/2026-05-13-secrets-setup-runbook
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/4
- Merge SHA: c457c2cda5a5dc4656b6eb7ef01733504e73c2db
- CodeRabbit: APPROVED — 7 findings total across 4 review rounds (6 fixed, 1 replied with rationale on the Emergency Kit thread).
- Secondary reviewer: `cubic-dev-ai` posted 2 findings (P1 PostHog API key + P2 placeholder task-log entry); both fixed.
- Acceptance evidence: `docs/runbooks/secrets-setup.md` exists on `main`, covers all 9 sections (purpose, account/vault setup, CLI install, item template, per-phase credential checklist, three .env-integration options, rotation policy, contractor onboarding, cross-refs); `docs/dev/status/next-step.md` § Operator Pre-Flight links to the runbook.
- Files changed: 4 (new `docs/runbooks/secrets-setup.md`, modified `docs/dev/status/next-step.md`, modified `docs/dev/status/task-log.md`, removed `docs/runbooks/.gitkeep`); ~316 insertions / 37 deletions across the PR's 4 push iterations.
- Notes: Discovered cubic-dev-ai is a second active AI reviewer on the repo (not configured by the loop docs). Earlier policy mistakenly dismissed cubic as no-op; corrected to treat both reviewers as gating with same triage weight — this revision is queued as a `RALPH-LOOP.md` doc-fix in Commit 0.4's PR. Also surfaced: the format for off-plan task-template entries in `task-log.md` is ad hoc — using a date-stamped "Task" header pending formalization.

## 2026-05-13 — Phase 0 / Commit 0.4 — Logger and Sentry

- Branch: phase-0/commit-0.4-logger-and-sentry
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/5
- Merge SHA: 861983fab2638dab1ce6ec0e9fd13c08da7181c9
- CodeRabbit: APPROVED — 1 comment resolved (1 fixed, 0 replied). Round 1 review CHANGES_REQUESTED with one Actionable finding on the axiom transport (non-2xx HTTP responses silently dropped); after fix push `8fd8cee` CodeRabbit re-reviewed APPROVED at the new HEAD.
- Secondary reviewer: `cubic-dev-ai` posted 2 findings (P2 axiom non-2xx duplicate of CodeRabbit's; P1 hyphenated `set-cookie` redact path). Both fixed in the same `8fd8cee` push; cubic's check-run = SUCCESS at the new HEAD.
- ADRs touched: none (implements ADR-012; the `@sentry/nextjs` per-app initialization half of the master plan's Commit 0.4 prompt is deferred to Commit 1.4 — the 3 apps are still empty placeholders).
- Acceptance evidence: 17 Vitest cases inside `@bec/logger` (sentry-transport level mapping + error reconstruction + sub-warn dropping + malformed-input resilience; axiom-transport URL building + dataset URL-encoding + custom endpoint + fetch-failure swallowing + non-2xx HTTP response logging; createLogger() shape + child loggers + base merging + 3 redact tests proving top-level `set-cookie`, nested `set-cookie`, and common secret fields are removed). `pnpm turbo build lint type-check test:unit` → `56 successful, 56 total`. Manual Sentry/Axiom acceptance (`pnpm --filter @bec/logger test-emit`) requires operator to populate `SENTRY_DSN` + `AXIOM_TOKEN` + `AXIOM_DATASET` in `.env`; gated on Phase 0 quality gate § "Sentry captures a test error from each app" — pending operator action.
- Validation: `validation-checklist.md` § Always + § Foundations all green.
- Files changed: 16 in the PR — 4 source (`packages/logger/src/index.ts`, `src/transports/{pretty,sentry,axiom}.ts`), 3 test (`src/index.test.ts`, `src/transports/{sentry,axiom}.test.ts`), 1 manual-acceptance script (`scripts/test-emit.ts`), 4 config (`packages/logger/{tsconfig.json,vitest.config.ts,test-setup.ts,package.json}`), 1 lockfile regeneration (`pnpm-lock.yaml`), 3 bookkeeping (`docs/dev/claude/RALPH-LOOP.md` queued doc-fixes, `docs/dev/status/{next-step.md,task-log.md}` runbook task entry).
- Next commit queued: Phase 0 / Commit 0.5 — Storybook scaffolding (operator prereq: Vercel Pro account active for the `bec-storybook` deployment at `ui.bestemeraldcoast.com`).
- Notes: Axiom transport is a custom fetch-based stream (not `@axiomhq/pino`) because `@axiomhq/pino` requires Pino's worker-thread transport model, which conflicts with the sync `pino.multistream()` approach. Trade-off accepted: no built-in batching; per-line POSTs. Acceptable at BEC log volume; revisit if volume climbs. The fix-round push (`8fd8cee`) closed CodeRabbit + cubic findings in one shot; CodeRabbit re-review took ~2 min. cubic-dev-ai is now formally part of the gating review set per the RALPH-LOOP.md doc-fixes carried in this PR.

## 2026-05-13 — Phase 0 / Commit 0.5 — Storybook scaffolding

- Branch: phase-0/commit-0.5-storybook-scaffolding
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/6
- Merge SHA: 7f894914f9dd9986537a16b19995d3c9d01b7264
- CodeRabbit: APPROVED — 2 unique findings resolved (2 fixed, 0 replied). Round 1 review CHANGES_REQUESTED with one Major + one Nitpick on `packages/ui/components/primitives/button.tsx`; after fix push `d46f6bf` CodeRabbit re-reviewed APPROVED at the new HEAD ~7 min later.
- Secondary reviewer: `cubic-dev-ai` posted 1 finding at HEAD `781354b` (P2 — duplicate of CodeRabbit's Major on the same `rounded-(--radius-*)` line); resolved in the same `d46f6bf` push. Cubic's check-run = SUCCESS at the merged HEAD.
- ADRs touched: none (implements ADR-032 — three archetypes + `SiteTheme` token contract; ADR-036 — WCAG 2.2 AA via `@storybook/addon-a11y`; ADR-037 — `packages/ui` shadcn-style layout, primitives populated).
- Acceptance evidence: **Storybook runs locally** — verified via successful `pnpm --filter @bec/ui build-storybook` (Storybook 8 + Vite 6 + Tailwind v4 + a11y addon all bundling cleanly in ~9s, emitting `storybook-static/iframe.html` + the `button.stories` chunk + the axe-core chunk). **Deployed Storybook reachable with password** — operator-gated on `docs/runbooks/storybook-deploy.md` (Vercel Pro + `ui.bestemeraldcoast.com` DNS + Vercel Password Protection); pending. `pnpm turbo build lint type-check test:unit` → `56 successful, 56 total`.
- Validation: `validation-checklist.md` § Always + § Foundations all green. `@bec/ui#type-check` (`tsc --noEmit`) passes over `theme/`, `components/primitives/`, `.storybook/`, `index.ts`, `vite.config.ts`.
- Files changed: 20 in the PR — 13 source under `packages/ui/` (`.storybook/{main,preview}.ts`, `components/primitives/button.{tsx,stories.tsx}`, `theme/tokens.ts`, `theme/archetypes/{magazine,coastal,premium,index}.ts`, `theme/index.ts`, `styles/globals.css`, `index.ts`, `vite.config.ts`), 5 config (`packages/ui/{tsconfig.json,vercel.json,package.json}`, `turbo.json`, `.gitignore`), 1 lockfile (`pnpm-lock.yaml`), 1 new operator runbook (`docs/runbooks/storybook-deploy.md`); 3,578 insertions / 138 deletions.
- Next commit queued: Phase 0 / Commit 0.6 — CI baseline (operator action also queued: complete `docs/runbooks/storybook-deploy.md` so the deployed-Storybook half of 0.5's acceptance can be checked off ahead of the Phase 0 ADR-035 gate).
- Notes: Storybook 8.6 + Vite 6 + Tailwind v4 + React 19 with the new ref-as-prop pattern. Tailwind v4 `@theme` mapping (`--color-*` and `--radius-*`) auto-generates utility classes (`bg-primary`, `rounded-sm`, etc.) — round-1 used the `rounded-(--radius-*)` arbitrary-value syntax which both bots correctly flagged as bypassing the theme; switched to standard utility names. CodeRabbit's React 19 modernization nitpick (forwardRef → ref-as-prop) was accepted because React 19 was already pinned. The "deployed Storybook is reachable with password" acceptance half is intentionally split off into operator action — Vercel Hobby cannot password-protect a custom domain, so this depends on Vercel Pro being active before the operator can complete it. Phase 0 ADR-035 quality gate item "Storybook deploys and renders the placeholder" rolls up the operator-gated half.

## 2026-05-13 — Phase 0 / Commit 0.6 — CI baseline

- Branch: phase-0/commit-0.6-ci-baseline
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/7
- Merge SHA: 04e070028dfe8afd5b2b57bfe3ef7b8154631709
- CodeRabbit: APPROVED — 4 unique findings resolved across 2 review rounds (4 fixed, 0 replied). Round 1 (HEAD `8827fb3`) CHANGES_REQUESTED with 4 Actionable findings: action SHA pinning + Neon `connection_uri` validation + `branch_id` ordering + `e_TBD` placeholder in next-step.md. Round 2 (HEAD `774f3c3`) CHANGES_REQUESTED with 1 Actionable: composite action `setup/action.yml` doesn't actually run `actions/checkout` (checkout is job-level, pre-composite); next-step.md description corrected. Round 3 (HEAD `946ae1f`) APPROVED.
- Secondary reviewer: `cubic-dev-ai` round 1 COMMENTED with 2 findings (P2 action SHA pinning + P1 `connection_uri` validation — both duplicates of CodeRabbit's). Round 2 silent (no new review at `774f3c3`); cubic's check-run = SUCCESS at every HEAD on this branch.
- ADRs touched: none (implements ADR-039 — Turbo task graph + remote cache; implements ADR-016's Vitest slice; closes ADR-035 quality-gate box 7 pending throwaway-PR verification).
- Acceptance evidence: CI itself ran on every push of this branch (the workflow triggers on `pull_request`) — `lint` = SUCCESS in 27s, `type-check` = SUCCESS in 22s, `unit-tests` = SUCCESS in 20s at HEAD `8827fb3`; similarly short at `774f3c3` and `946ae1f`. **Each of three CI jobs completed in well under 30 seconds, comfortably inside the 5-minute acceptance budget.** Formal throwaway no-op PR (the master plan's literal "throwaway PR runs CI in under 5 minutes" wording) is folded into the Phase 0 gate flow — the gate PR itself is no-op (docs only), so its own CI run satisfies box 7.
- Validation: `validation-checklist.md` § Always + § Foundations all green. `pnpm turbo build lint type-check test:unit` returned 56/56 with full Turbo cache at every push on this branch (CI files don't change Turbo task inputs).
- Files changed: 2 source (`.github/workflows/ci.yml`, `.github/actions/setup/action.yml`) + 2 bookkeeping (`docs/dev/status/task-log.md` Commit 0.5 entry, `docs/dev/status/next-step.md` rewrite for 0.6 then small round-2 doc correction); 197 insertions / 30 deletions.
- Next commit queued: **Phase 0 ADR-035 quality gate** (this commit is the last in Phase 0; the gate branch `phase-0/gate` is cut from `04e0700` and contains only this entry's bookkeeping until operator boxes close).
- Notes: First PR in the project where the CI workflow itself ran on the introducing PR — a useful confidence signal that the workflow is wired correctly. Pinned action SHAs after round 1: `actions/checkout@34e1148...` (v4.3.1), `actions/setup-node@49933ea...` (v4.4.0), `pnpm/action-setup@fc06bc1...` (v4.4.0). Dependabot will track via the `# vX.Y.Z` comment annotations. Neon ephemeral-branch logic gracefully no-ops when secrets are absent — important because operator hasn't provisioned the Neon API token yet, but CI is still passing today. After Pass-2 branch protection lands (operator post-merge action), the loop's status-file write path collapses back to "fold bookkeeping into the next commit's PR" with auto-merge firing immediately (required checks gate the merge naturally).

## 2026-05-14 — Task — @bec/logger smoke fix (Phase 0 ADR-035 gate Box 5 unblock)

- Type: Off-plan code fix (task-template workflow per `docs/dev/task-template.md`). Unblocks Phase 0 ADR-035 gate Box 5 ("Sentry captures a test error from each app") — Commit 0.4's mocked Vitest cases gave false confidence; the manual-acceptance smoke never worked end-to-end.
- Branch: task/2026-05-13-logger-flush-closes-sentry
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/8
- Merge SHA: 56af0103ca7953f471f8856b5685b7d40f1ed73a
- CodeRabbit: 1 finding resolved (1 fixed, 0 replied). Round 1 (HEAD `db841be`) CHANGES_REQUESTED with one Actionable: `types` field pointed at `./dist/index.d.ts` which doesn't exist when consumers run `tsc --noEmit`; CodeRabbit suggested switching to source-typed exports. Fix push `d10b7cd` adopted the suggestion verbatim. Round 2 never posted — CodeRabbit hit its hourly review/credit limit at `04:09:43Z` ("You've run out of usage credits"); manual `@coderabbitai review` nudge at `04:35:09Z` returned "Review triggered" with the boilerplate "does not re-review already reviewed commits." Merged with `gh pr merge 8 --admin --squash --delete-branch` per RALPH-LOOP § 7e exception path (CodeRabbit unavailable, not insisting) — defensible because (a) the round-1 fix was CodeRabbit's literal suggestion, (b) the round-2 diff is a 4-line types-field swap with no other surface, (c) CI's `type-check` flipped from FAILURE at `db841be` to SUCCESS at `d10b7cd` as empirical proof.
- Secondary reviewer: `cubic-dev-ai` check = SUCCESS at every HEAD on the branch; no findings posted at either round.
- CI on PR #8: `lint` + `type-check` + `unit-tests` all SUCCESS at the merged HEAD `d10b7cd` (type-check was FAILURE at round-1 HEAD `db841be` due to the very issue CodeRabbit flagged).
- ADRs touched: none (implements ADR-012's intent more correctly; the workspace-packages-emit-dist shift is consistent with ADR-039's Turborepo `^build` topology already in `turbo.json`).
- Acceptance evidence (this PR scope, not the gate evidence): `pnpm --filter @bec/logger test:unit` → 20/20 (was 17; +3 for `closeSentry`/`flushSentry`); `pnpm --filter @bec/logger test-emit` builds via Turbo (`@bec/config` first, then `@bec/logger`, ~7s), emits 3 log lines (info+warn+error) with `traceId=test-emit-<ts>`, exits with code 0. `pnpm turbo build lint type-check test:unit` → 56 successful, 56 total.
- Files changed: 10 in PR. Round 1 — `packages/logger/src/transports/sentry.ts` (+ `closeSentry()`), `src/transports/sentry.test.ts` (+ `close` mock + 3 tests), `src/index.ts` (+ `closeLogger()`), `scripts/test-emit.{ts→mjs}` (replaced tsx-driven .ts with plain-node-driven .mjs against compiled dist/), `tsconfig.json` (rootDir → ./src), `package.json` (`build → tsc`; `test-emit → turbo build + node`; main/exports → dist). Plus `packages/config/package.json` (build → tsc; main/exports → dist). Round 2 — `packages/{config,logger}/package.json` types field swap to source.
- Notes: **Two distinct latent defects in Commit 0.4 surfaced.** (1) `flushSentry()` called `Sentry.flush()` which drains events but doesn't close the HTTP transport, so the Node event loop never drains and any one-shot consumer hangs. Fixed with `closeSentry()` / `closeLogger()` that call `Sentry.close()` (flush + teardown). Kept `flushSentry`/`flushLogger` for long-running consumers — JSDoc explains which to use when. (2) `pnpm test-emit` hung in the *import* phase, before any logging. Bisected to a tsx + `@sentry/node` v8.x interop bug specific to the chain "tsx-transformed `.ts` entry → dynamic `await import(...)` → `@bec/logger` source bundle (pino-multistream + 3 transports)". Plain `node` imports `@sentry/node@8.55.2` cleanly; the same import via tsx in that chain shape hangs indefinitely. Workaround: switch the smoke runner from tsx to plain Node against compiled JS, requiring `@bec/logger` and `@bec/config` to emit dist/ via tsc. Architectural side-effect: workspace packages now emit dist/ as the runtime entry while `types` resolve from source — the conventional dual-entry pattern. `dev` script in `@bec/config` still works via tsx (relative imports inside the package are independent of `main`/`exports`). The smoke surfaced one real operator-side issue: `AXIOM_TOKEN` in `.env` returns `HTTP 401 — token not supported`; PR #5's axiom non-2xx logger correctly logged the failure mode. Operator follow-up captured in next-step.md § Operator Pre-Flight.

## 2026-05-14 — Task — bec-storybook Basic Auth gate (Phase 0 ADR-035 gate Box 6 unblock)

- Type: Off-plan code fix (task-template workflow per `docs/dev/task-template.md`). Unblocks Phase 0 ADR-035 gate Box 6 ("Storybook deploys and renders the placeholder") — Vercel's native Password Protection feature isn't available on the BEC plan (paywalled to Enterprise / Advanced Deployment Protection add-on, ~$150/mo on Pro).
- Branch: task/2026-05-14-storybook-basic-auth
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/9
- Merge SHA: 655ac2309e8db10d1abc688312c038aefce51bcb
- CodeRabbit: rate-limited again (credit exhaustion, same hourly cap that blocked PR #8's round-2 re-review). 0 reviews posted at HEAD `8129e0c`. Merged with `gh pr merge 9 --admin --squash --delete-branch` per the same RALPH-LOOP § 7e exception path as PR #8 (CodeRabbit unavailable, not insisting). Defensible: diff is 1 new middleware file + 3 small doc/config edits, CI all green, cubic SUCCESS, evidence pattern matches PR #8.
- Secondary reviewer: `cubic-dev-ai` check = SUCCESS at PR HEAD `8129e0c`; no findings posted.
- CI on PR #9: `lint` + `type-check` + `unit-tests` all SUCCESS at the merged HEAD.
- ADRs touched: none. Implements ADR-001 (Vercel hosting) + ADR-007 (1Password as system of record). The master plan was amended in place per housekeeping route 1 — a `> Amendment (2026-05-14)` block follows Commit 0.5's acceptance line in `docs/dev/MASTER-bec-project-plan.md` recording the substitution.
- Acceptance evidence (this PR scope): `pnpm --filter @bec/ui type-check` → green (`middleware.ts` added to tsconfig include); `pnpm turbo build lint type-check test:unit` → 56 successful, 56 total. **End-to-end gate proven in production:** the Vercel webhook didn't fire on the squash-merge of PR #9, so a manual empty commit `618016e` was pushed to `main` to wake it; that triggered deployment `bec-storybook-i5u940zb3-...` which built from `main@618016e` with `packages/ui/middleware.ts` in scope; operator confirmed in incognito that `https://ui.bestemeraldcoast.com` now prompts for HTTP Basic Auth and renders the Storybook UI after correct credentials.
- Files changed: 4 in PR. `packages/ui/middleware.ts` (NEW — Edge Middleware, web-standard Request/Response, constant-time password compare, fail-closed on missing env, WWW-Authenticate header). `packages/ui/tsconfig.json` (+ `middleware.ts` in include). `docs/runbooks/storybook-deploy.md` (rewrote §3-5 for the Basic Auth flow, added top-level rationale callout). `docs/dev/MASTER-bec-project-plan.md` (Amendment block on Commit 0.5).
- Notes: Vercel's GitHub webhook silently dropped on the PR #9 squash-merge. Empty-commit push (`618016e`) successfully triggered the webhook 17s later, confirming the integration *is* connected — just unreliable on certain event types (possibly squash-merge commit-event ordering). Follow-up item: investigate webhook reliability before Phase 1 lands many merges. Vercel's project Root Directory is `packages/ui` (per the runbook) and Production Branch is `main` (verified via Settings → Environments). The empty commit `618016e` direct-pushed to `main` despite Pass-1 branch protection — protection allowed admin direct-push with only a warning. Pass-2 protection (queued for after this gate) should close that gap.

## 2026-05-14 — PHASE 0 GATE PASSED

- Phase 0 — Workspace & Foundations — passed the ADR-035 quality gate.
- Checklist (7/7 green):
  1. **Repo structure matches plan.** ✅ Verified by Commit 0.1's acceptance: 15 workspace projects matching `MASTER-bec-project-plan.md` § Repo structure (apps × 3, packages × 11, agency/, infra/, docs/).
  2. **`pnpm install` and `pnpm turbo build` succeed.** ✅ Verified locally on every Phase 0 PR; CI confirms on every push to `main` since Commit 0.6 (PR #7).
  3. **All cloud accounts provisioned and 1Password is populated.** ✅ Operator-confirmed: Sentry × 3 DSNs + auth token + Axiom token + dataset (set up before Commit 0.4), GitHub Actions repo secrets `NEON_API_KEY` + `NEON_PROJECT_ID` + `TURBO_TOKEN` + `TURBO_TEAM`, and Vercel Pro account active. Storybook deploy password lives in `BEC-Production / Storybook deploy password`.
  4. **Env validation fails loudly when secrets are missing.** ✅ Closed in Commit 0.3 (PR #3) — `@bec/config`'s Zod schema rejects placeholder/malformed values at process boot with a formatted multi-line error.
  5. **Sentry captures a test error from each app.** ✅ Operator-confirmed post-PR #8 (`task/2026-05-13-logger-flush-closes-sentry`). `pnpm --filter @bec/logger test-emit` runs end-to-end, exits 0, and surfaces 2 events in the Sentry UI + 3 in the Axiom UI tagged with the printed `traceId`. (The `@sentry/nextjs` per-app initialization half of Commit 0.4's master-plan prompt is deferred to Commit 1.4 — the 3 apps are still empty placeholders. Logger smoke is the accepted Phase 0 proxy.)
  6. **Storybook deploys and renders the placeholder.** ✅ Production deployment `bec-storybook-i5u940zb3-fireflymediagroups-projects.vercel.app` (built from `main@618016e` after PR #9 + the manual webhook-wake commit), aliased to `https://ui.bestemeraldcoast.com`. Operator confirmed in incognito: HTTP Basic Auth dialog → password from 1Password (`BEC-Production / Storybook deploy password`) → Storybook UI loads with archetype toolbar + a11y addon. Master-plan acceptance literal wording "password protection" satisfied via the substitution recorded in `MASTER-bec-project-plan.md` § Commit 0.5 amendment.
  7. **CI runs green on a no-op PR.** ✅ Closed by this gate PR's own CI run — the gate branch (`phase-0/gate`) adds zero source code, only `task-log.md` + `next-step.md` edits. `lint` + `type-check` + `unit-tests` all SUCCESS on the gate PR confirms the master plan's "throwaway PR runs CI in under 5 minutes" wording. (Out-of-box evidence: PR #7, PR #8, PR #9 all ran CI under 30s wall-clock per job at every push, multiplying confidence.)
- Next phase opens: **Phase 1 / Commit 1.1 — Drizzle schemas.** Cut `phase-1/commit-1.1-drizzle-schemas` from `main` after this gate PR squash-merges. Pass-2 branch protection should land alongside or before that branch — required status checks: `lint` + `type-check` + `unit-tests` + `CodeRabbit`; require branches to be up to date before merging.

## Phase Gates

Each phase gate (per ADR-035) is a special entry:
```
## YYYY-MM-DD — PHASE X GATE PASSED
- Checklist: 100% green (link or paste of the checklist with all items checked)
- Next phase opens: Phase X+1 / Commit X+1.1
```

<!-- The first phase gate entry will land after all Phase 0 commits are shipped and the Phase 0 ADR-035 checklist is fully green. -->
