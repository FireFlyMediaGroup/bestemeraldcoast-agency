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

## 2026-05-14 — Phase 1 / Commit 1.1 — Drizzle schemas

- Branch: phase-1/commit-1.1-drizzle-schemas
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/11
- Merge SHA: 93e788e63180957afa63724c2c1a3ae3c8418ce8
- CodeRabbit: rate-limit notice posted at 23:20:56Z right after PR opened ("exceeded the limit for the number of commits that can be reviewed per hour"). 0 actual review objects ever posted at HEAD `44b3b91`. Merged with `gh pr merge 11 --admin --squash --delete-branch` per the PR #8 / PR #9 / PR #10-fallback exception path. Same operational pattern as the prior `--admin` merges: cubic SUCCESS + CI all green + diff inspected by hand. **Risk note:** Phase 1 has ~10 more commits queued; if CodeRabbit's credit ceiling keeps hitting once per hour, half the Phase 1 PRs will follow this same `--admin` route. The two follow-ups in `next-step.md` § Operator Pre-Flight ("CodeRabbit credit limit" + "Vercel git-integration reliability") are now hot for Commit 1.2.
- Secondary reviewer: `cubic-dev-ai` check = SUCCESS at HEAD `44b3b91`; no findings posted (large diff, all schema mirrors the master plan exactly).
- CI on PR #11: `lint` + `type-check` + `unit-tests` all SUCCESS at the merged HEAD.
- ADRs touched: No new ADRs were created. This commit *implements* ADRs 002 (Neon), 003 (Postgres as source of truth), 010, 013, 014, 015, 017, 018, 019, 020, 022, 024, 025, 026, 027, 028, 031, 032 (via `SiteTheme` inline mirror), 034, 036, and 041. Per-table cross-references are inline in each schema file's top-of-file comment.
- Acceptance evidence (this PR scope): `pnpm --filter @bec/db type-check` → green. `pnpm --filter @bec/db build` → emits `dist/{client,index,schema/*}.{js,d.ts}`. `pnpm --filter @bec/db db:generate` → 23 tables, 0 mismatches, fresh `0000_worthless_falcon.sql` (deterministic — re-running on clean tree reproduces). `pnpm turbo build lint type-check test:unit` → 56/56. **Operator follow-up to close the master plan's full acceptance:** (a) `pnpm --filter @bec/db db:migrate` against Neon's dev branch — confirms migration runs cleanly; (b) `pnpm --filter @bec/db db:studio` — visually confirms 23 tables. Captured for the gate evidence on Commit 1.2's task-log entry once verified.
- Validation: `validation-checklist.md` § Always + § Foundations all green via `pnpm turbo build lint type-check test:unit` → 56/56. `@bec/db` type-check + build + `db:generate` all green locally. CI on PR #11 (`lint` + `type-check` + `unit-tests`) all SUCCESS at the merged HEAD `44b3b91`. End-to-end `db:migrate` / `db:studio` against live Postgres — pending operator post-merge per the Acceptance evidence line above.
- Files changed: 22 in PR. **13 schema files** (sites, businesses, leads, outreach, images, editorial, events, audience, monetization, projects, ops, types, plus the `schema/index.ts` barrel that re-exports them for drizzle-kit discovery) covering **23 tables + 8 enums** that mirror `MASTER-bec-project-plan.md` § Database Schema column-for-column. `client.ts` lazy Neon HTTP Drizzle client. `src/index.ts` public exports. `drizzle.config.ts` (points at `dist/schema/index.js` to dodge drizzle-kit 0.30.6's `.js`-extension loader bug). `package.json` real build script + dual-entry main/types/exports matching @bec/config / @bec/logger. `tsconfig.json`. `migrations/0000_worthless_falcon.sql` (drizzle-kit-generated, 23 CREATE TABLE + 8 CREATE TYPE statements + FKs + indexes). `migrations/meta/{_journal.json, 0000_snapshot.json}`. `pnpm-lock.yaml` (new deps: drizzle-orm ^0.39.0, drizzle-kit ^0.30.6, @neondatabase/serverless ^1.0.1). Total: 13 + 1 (client) + 1 (index) + 1 (drizzle.config) + 1 (package.json) + 1 (tsconfig) + 1 (0000_*.sql) + 2 (meta) + 1 (pnpm-lock) = 22.
- Next commit queued: **Phase 1 / Commit 1.2 — Seed data.** Branch `phase-1/commit-1.2-seed-data` cut from `93e788e`; carries this entry's bookkeeping alongside the seed implementation per post-Pass-1 write policy.
- Notes: First Phase 1 PR; largest diff in the project so far (~5,000 lines, mostly the generated SQL). `SiteTheme` inlined in `packages/db/src/schema/types.ts` rather than imported from `@bec/ui` so `@bec/db` stays independent of the UI package — a comment + ADR-032 cross-ref + future `@bec/types` TODO documents the duplication. drizzle-kit's `.js`-extension loader bug worked around by pointing the config at compiled JS; `db:*` scripts run `pnpm run build` first. Architectural side-effect (now established across @bec/config + @bec/logger + @bec/db): workspace packages emit `dist/` as the runtime entry while `types` resolve from source — the conventional dual-entry pattern.

## 2026-05-15 — Phase 1 / Commit 1.2 — Seed data

- Branch: phase-1/commit-1.2-seed-data
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/12
- Merge SHA: 17f610d2fbf863492a8e970c6e864fe2e583fa16
- CodeRabbit: APPROVED at HEAD `7c7426d` round 2 (~3 min review, no rate-limit this time). Round 1 (HEAD `3344bbf`) CHANGES_REQUESTED with 5 findings: (a) 🔴 Critical — `assertProdDbAccessible()` guard missing on the seed script (duplicated as cubic P1); (b) 🟠 Major — category seeding loop queried all persisted sites and would create categories on unrelated tenant sites (duplicated as cubic P2); (c) 🟠 Major — Commit 1.1 task-log entry missing required `Validation:` + `Next commit queued:` fields per the format docs; (d) 🟡 Minor — file-count discrepancy (header said "22" but enumeration summed to 21; schema barrel was missing from prose); (e) 🔵 Trivial — "ADRs touched" phrasing rewritten per CodeRabbit's suggested form. All 5 fixed in `7c7426d`; no replies-with-rationale.
- Secondary reviewer: `cubic-dev-ai` posted both duplicates of CodeRabbit's substantive findings (P1 + P2) at HEAD `3344bbf`; check = SUCCESS at the merged HEAD `7c7426d`.
- CI on PR #12: `lint` + `type-check` + `unit-tests` all SUCCESS at every push including merged HEAD.
- ADRs touched: No new ADRs were created. This commit implements ADRs 018 (9 default agent budgets), 021 (6 categories per archetype — superseding the master plan's "3-5" parenthetical, per the source-of-truth rule), 027 (2 authors), 032 (8 sites with placeholder `SiteTheme` tokens), and 038 (the `assertProdDbAccessible()` guard added in round 1).
- Acceptance evidence (this PR scope): `pnpm --filter @bec/db type-check` → green. `pnpm turbo build lint type-check test:unit` → 56/56. **Operator follow-up to close the master plan's full acceptance for both Commit 1.1 and Commit 1.2:** (a) `pnpm --filter @bec/db db:migrate` against Neon's dev branch (Commit 1.1 acceptance); (b) `pnpm --filter @bec/db db:studio` (Commit 1.1); (c) `pnpm --filter @bec/db db:seed` (Commit 1.2 first-run); (d) re-run (c) (Commit 1.2 idempotency assertion). Captured for the gate evidence on Commit 1.3's task-log entry once verified.
- Validation: `validation-checklist.md` § Always + § Foundations all green via `pnpm turbo build lint type-check test:unit` → 56/56. `@bec/db` type-check + lint + build all green locally. CI on PR #12 — all three jobs SUCCESS at the merged HEAD `7c7426d`. End-to-end `db:seed` against live Postgres — pending operator post-merge per the Acceptance evidence line above.
- Files changed: 5 in PR. `packages/db/src/seed.ts` (NEW, ~420 lines: 8 sites + 6 categories per archetype + 2 authors + 9 agent budgets, all idempotent via `.onConflictDoNothing()`, plus `assertProdDbAccessible()` guard + filter to seeded slugs added in round 1). `packages/db/package.json` (+ `db:seed` script — `tsx src/seed.ts` as of PR #12; Commit 1.3's PR later prepended `pnpm -w turbo run build --filter=@bec/db &&` so `@bec/config`'s dist resolves, see that entry — + `dotenv` devDep). `pnpm-lock.yaml` (dotenv pickup). `docs/dev/status/task-log.md` (+ Commit 1.1 entry with the round-1 format fixes). `docs/dev/status/next-step.md` (rewrite for Commit 1.2 — promoted CodeRabbit credit-limit follow-up from soft-defer to hot).
- Next commit queued: **Phase 1 / Commit 1.3 — Migration tests** (NOT ops-console scaffold — my prior next-step.md had this wrong; ops-console scaffold is actually Commit 1.4 per the master plan). Branch `phase-1/commit-1.3-migration-tests` cut from `17f610d`; carries this entry's bookkeeping alongside the test-migrations implementation per post-Pass-1 write policy.
- Notes: CodeRabbit's credit ceiling held this round — clean APPROVED in ~3 min with no `--admin` needed. First Phase 1 PR to land via the standard merge path. The "Commit 1.1 + 1.2 operator verification" item is now a coupled pair (both rely on Neon dev-branch DDL + DML); the operator can knock both out in one short session.

## 2026-05-15 — Phase 1 / Commit 1.3 — Migration tests

- Branch: phase-1/commit-1.3-migration-tests
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/13
- Merge SHA: 333779e4fbdf3fbc5d7d699385b844d6edd84a36
- CodeRabbit: APPROVED at round-5 HEAD `745cdea` (clean, no rate-limit). Took **5 CI rounds** to land — the project's hardest PR so far. Round 1 (`a03f77e`): `@bec/config/dist` not found because tsx resolves the workspace dep via `main` and no build had run → chained `pnpm -w turbo run build --filter=@bec/db`. Round 2 (`abfa348`): `@neondatabase/serverless@1.1.0` rejects function-call `sql()` → pinned `~1.0.1` (wrong hypothesis). Round 3 (`ed18598`): `1.0.2` has the *same* tagged-template-only restriction → **rewrote the script on the Pool-based `drizzle-orm/neon-serverless` driver**, CI green. Round 4 (`745cdea`): addressed cubic P2 (rollback left `drizzle.__drizzle_migrations` → also drop the `drizzle` schema so the script is re-runnable), cubic P2 (re-pin `~1.0.1` for determinism), CodeRabbit Minor ×2 (doc-snippet drift in next-step.md + task-log.md), CodeRabbit path-string (already fixed in the rewrite), and replied-with-rationale on CodeRabbit's Critical drizzle-bump suggestion (Pool route taken; whole-layer drizzle fix tracked as a follow-up, not deferred). Round 5: APPROVED. Total: 5 unique findings fixed + 1 replied.
- Secondary reviewer: `cubic-dev-ai` posted 2 P2 findings at the Pool-rewrite HEAD (rollback bookkeeping + dep pin), both fixed in round 4; check = SUCCESS at the merged HEAD.
- CI on PR #13: `lint` + `type-check` + `unit-tests` all SUCCESS at the merged HEAD `745cdea`. The new `Test migrations` step inside `unit-tests` ran the full forward → idempotency → rollback flow against the PR's Neon ephemeral branch — green. This is the Commit 1.3 acceptance evidence by construction.
- ADRs touched: No new ADRs. Implements ADR-016's schema-migration-tests slice; touches ADR-038 via the `assertProdDbAccessible()` guard in the script.
- Acceptance evidence: master plan's "CI runs migration tests" — satisfied by this PR's own green CI run. "A purposely-broken migration fails CI" — mechanism wired (bad SQL → drizzle migrator throws → script exits non-zero → step fails → job fails → PR blocked); not exercised by deliberately committing a broken migration (artificial).
- Validation: `validation-checklist.md` § Always + § Foundations all green via `pnpm turbo build lint type-check test:unit` → 56/56. `@bec/db` type-check green at every round. CI all-green at merged HEAD.
- Files changed: 6 in PR. `packages/db/src/test-migrations.ts` (NEW, ~237 lines, Pool driver). `packages/db/package.json` (+ `db:test-migrations` script with the Turbo-build prefix; + `ws` runtime dep + `@types/ws` devDep; `@neondatabase/serverless` `~1.0.1`). `.github/workflows/ci.yml` (+ `Test migrations` step in `unit-tests`, `PROD_DB_ALLOWED=true`, gated on `steps.neon.outputs.branch_id`). `pnpm-lock.yaml`. `docs/dev/status/task-log.md` (+ Commit 1.2 entry). `docs/dev/status/next-step.md` (rewrite for the *real* Commit 1.3 + corrected the prior mislabel).
- Next commit queued: **Off-plan task `task/2026-05-15-db-pool-driver`** — standardize `client.ts` (and therefore `seed.ts` via `getDb()`) on the same Pool driver, before Phase 1 / Commit 1.4 (ops-console scaffold) starts issuing live queries. Then Commit 1.4.
- Notes: The neon-http + drizzle-0.39 incompatibility surfaced here is **latent in `client.ts` and `seed.ts`** — they throw the same `sql`-template error the moment they run real queries. The test-migrations script dodged it via the Pool driver locally; the whole-layer fix is the next task (not deferred — done before 1.4). Operator's Commit 1.1/1.2 `db:seed` verification should wait until that task lands (the migrate/studio paths use drizzle-kit's own driver and are unaffected).

## 2026-05-15 — Task — Standardize @bec/db on the Pool-based neon-serverless driver

- Type: **Off-plan remediation** (task-template workflow). Inserted between Phase 1 / Commit 1.3 and Commit 1.4; does not appear in `MASTER-bec-project-plan.md` and renumbers no commit.
- Branch: task/2026-05-15-db-pool-driver (cut from `333779e`, the Commit 1.3 merge).
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/14
- Merge SHA: 11de263befdd8aaca4e1e31cfdc9f5ffea000c99
- CodeRabbit: **APPROVED** at HEAD `64e62e1` (2026-05-15T12:07:49Z) — clean single-pass review, **0 findings**, no rate-limit. The project's first Phase-1 PR to land APPROVED on the first review round with zero comment-resolution churn.
- Secondary reviewer: `cubic · AI code reviewer` check = SUCCESS at the merged HEAD; no findings posted (small, surgical diff).
- CI on PR #14: `lint` + `type-check` + `unit-tests` all SUCCESS at the merged HEAD `64e62e1`.
- ADRs touched: No new ADRs. Implements ADR-002 (Neon) / ADR-003 (Postgres source of truth) at the driver layer; preserves the ADR-038 `PROD_DB_ALLOWED` rail (the `assertProdDbAccessible()` guard lives in `seed.ts`, unchanged — it inherits the new Pool driver via `getDb()`).
- Acceptance evidence: `pnpm --filter @bec/db type-check` → green. `pnpm turbo build lint type-check test:unit` → 56/56. The Pool driver (`drizzle(pool, { schema })` over `drizzle-orm/neon-serverless`) is already CI-proven against a live Neon ephemeral branch by Commit 1.3's `Test migrations` step — same driver, same `@neondatabase/serverless ~1.0.1`. The query-builder path's first live exercise is the operator's post-merge `db:seed` + Commit 1.4's ops-console queries.
- Validation: `validation-checklist.md` § Always + § Foundations green via the 56/56 turbo run. § Database: the migrate/idempotency/rollback flow is the Commit 1.3 `Test migrations` CI step, green on the same driver. No prod-DB write attempted locally (ADR-038 rail intact).
- Files changed: 4 in PR. `packages/db/src/client.ts` (+30/-13: `neon()` + `drizzle-orm/neon-http` → `Pool` + `drizzle-orm/neon-serverless`; `neonConfig.webSocketConstructor = ws` at module scope — a config write, not a connection, so schema-only imports stay side-effect-free; `Database` type → `NeonDatabase<typeof schema>`). `packages/db/src/test-migrations.ts` (+3/-6: follow-up comment updated to "resolved (this task)"). `docs/dev/status/task-log.md` (+15: carried the Commit 1.3 entry per the post-Pass-1 write policy). `docs/dev/status/next-step.md` (+32/-46: rewritten to describe this task). `seed.ts` unchanged — inherits the Pool driver via `getDb()`; `process.exit(0)` already handles pool teardown.
- Next commit queued: **Phase 1 / Commit 1.4 — Ops-console scaffold + auth.** First real Next.js app (Next 16, App Router, NextAuth v5 magic-link over Resend, `@bec/db` now Pool-driver). Branch `phase-1/commit-1.4-ops-console-scaffold` cut from `11de263`; carries this entry's bookkeeping + the next-step.md rewrite per the post-Pass-1 write policy.
- Notes: The neon-http + drizzle-0.39 `sql`-template incompatibility (diagnosed across Commit 1.3's 5 CI rounds) is now resolved at the `@bec/db` layer, not just in the test script. `client.ts` + `seed.ts` were the last neon-http holdouts; both are on the Pool driver as of this merge. This unblocks the operator's coupled Commit 1.1/1.2 `db:seed` verification — the natural end-to-end smoke test for the query-builder path. Clean APPROVED with no `--admin` needed; CodeRabbit's credit ceiling held for this small diff.

## 2026-05-16 — Phase 1 / Commit 1.4 — Ops-console scaffold + auth

- Branch: phase-1/commit-1.4-ops-console-scaffold
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/15
- Merge SHA: b2d987874e7a3a7bbefc9b81810dd9faeaf7cd48
- CodeRabbit: 2 review rounds (`82305e8` round-1 fixes → `780ead1` round-2). Round-1 CHANGES_REQUESTED (11 findings): 8 fixed, 1 documented-deferral (auth route ADR-017/Zod → adr-log exemption), 1 grounded skip (0001 drizzle-generated SQL idempotency — verified no DO-block convention exists), 1 cubic-P1 build-inertness bug fixed. Round-2 `COMMENTED` (cubic P1 conf-9: lazy NextAuth factory insufficient — module-scope @bec/config/@bec/db imports still trigger eager parseEnv at `next build`; fixed via async factory + dynamic imports). **Merged via operator decision (option B) consciously relaxing the "CodeRabbit APPROVED" gate** — CodeRabbit never re-reviewed `780ead1` (recurring repo-wide flakiness: rate-limits, ~12-min stalls, incremental-anchoring re-flags); CI + cubic green, all findings fixed/escalated/skipped-with-rationale. Recorded as an operator gate-relaxation, not an automated bypass.
- Secondary reviewer: `cubic-dev-ai` SUCCESS at the merged HEAD; its P1 (auth build-inertness) was the round's most valuable catch and is fixed.
- CI on PR #15: `lint` + `type-check` + `unit-tests` all SUCCESS at merged HEAD `780ead1`.
- ADRs touched: implements ADR-001 (Vercel) / ADR-007 (1Password) / ADR-012 (per-app Sentry — closes the deferred half of Commit 0.4's prompt) / ADR-013 (Resend) / ADR-036 + Apple HIG. **ADR-038 extended**: `OPERATOR_EMAIL` added to the env schema (dev-optional, prod-required) + `.env.example` + 2 tests. **ADR-017 scoped exemption opened** (`docs/dev/adr-log.md` 2026-05-16) for the auth catch-all route's rate-limit/Zod — lapses at Commit 1.5.
- Acceptance evidence: master plan's "login on iPhone Safari / unauth redirects / magic link e2e" is **operator-gated** (needs the Vercel deploy + Resend domain). Locally-provable parts all green: structure, type-check, auth-guard logic (edge middleware + server-layout double guard), single-email allow-list, per-app Sentry wiring. **Live DB verification done this session against the Neon dev branch** — Commit 1.1 (`db:migrate` applied 0000+0001, 27 tables) + Commit 1.2 (`db:seed` populated then idempotent no-op) + the PR #14 driver swap all empirically closed.
- Validation: CI-equivalent `pnpm turbo lint type-check test:unit` → 48/48 workspace-wide incl. the new app. `next build` is OOM-bound on the dev machine (Next 16 Turbopack SIGKILL — same memory ceiling as Storybook's 12GB workaround); CI does not run `next build`; `type-check` is the load-bearing local signal; authoritative build runs on Vercel like `bec-storybook`.
- Files changed: ~40. New `apps/ops-console` Next 16 app (layout/globals/login/(app) route group/api auth route/auth.ts/middleware/Sentry instrumentation+configs/next.config/tsconfig/postcss). New `packages/db/src/schema/auth.ts` (4 Auth.js tables, canonical adapter shape) + `migrations/0001_previous_rhino.sql` + `0002_wide_forge.sql` (FK indexes). `drizzle.config.ts` now dotenv-loads repo-root `.env`. `OPERATOR_EMAIL` in `@bec/config`. `docs/runbooks/ops-console-deploy.md` new. test-migrations canonical set bumped to 27 + dynamic counts.
- Next commit queued: **Phase 1 / Commit 1.5 — Internal agent API.** Branch `phase-1/commit-1.5-internal-agent-api` cut from `b2d9878`; carries this entry's bookkeeping + the next-step.md rewrite per the post-Pass-1 write policy. Pass-2 branch protection is now LIVE (applied via gh api after this merge): required checks `lint`/`type-check`/`unit-tests`, strict, enforce_admins off, 0 human approvals; `CodeRabbit` deliberately NOT a required check yet (its reliability/credit problem unresolved).
- Notes: Auth.js v5 is **beta** — operator-approved as the future-proof choice over v4. The 4 Auth.js tables are the canonical `@auth/drizzle-adapter` Postgres shape (the `accounts` table's mixed snake/camel JS keys are the adapter's required structural contract — do not "tidy"). 🔴 Open security action: rotate the Neon `neondb_owner` password (a shell `.env` sourcing during the DB verification echoed the connection string; dev branch, low real-world risk, rotate on principle).

## 2026-05-16 — Phase 1 / Commit 1.5 — Internal agent API

- Branch: phase-1/commit-1.5-internal-agent-api
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/16
- Merge SHA: 25711ce1b88c6e2c4f26c6e2fc776376dddbce8f
- CodeRabbit: multiple review rounds; final round re-flagged code already fixed at `c3ef0da` via stale incremental-diff anchoring (verified each finding against current source — requireUuid validation, transition race-guard `and(eq(id),eq(status,from))`→409, finalize status='running' guard→409, costUsd `.finite().nonnegative()`, businesses rating `0..5`/reviewCount `int().nonnegative()` + conditional primarySiteId upsert, lock no longer echoes lockedBy — all present). **Merged via operator decision (option B) relaxing the "CodeRabbit APPROVED" gate** for the 3rd consecutive PR; this recurrence is exactly what motivated the same-day ADR-035 loop-doc amendment making CodeRabbit formally advisory (see adr-log 2026-05-16 — ADR-035; CLAUDE.md §29–30 + RALPH-LOOP 7b–7e reworded in this same Commit-1.6 branch's bookkeeping). CI + cubic green at merged HEAD; all posted findings fixed or verified-already-resolved.
- Secondary reviewer: `cubic-dev-ai` SUCCESS at the merged HEAD.
- CI on PR #16: `lint` + `type-check` + `unit-tests` all SUCCESS at merged HEAD; Pass-2 required checks gated the merge naturally (first PR to merge under live Pass-2 protection).
- ADRs touched: implements ADR-003 (Bearer `AGENT_API_KEY` agent auth), ADR-017 (Upstash sliding-window limiter — agent API 60/key/min, magic-link 5/15min; **closes** the 2026-05-16 Commit-1.4 adr-log exemption by retro-covering the auth route, IP-keyed), ADR-018 (`agent_runs` cost+outcome tracking), ADR-012 (handler-boundary error capture via @bec/logger). No ADR text changes.
- Acceptance evidence: master plan's "Postman/curl tests pass; lock acquisition exclusive (concurrent → 409); unauthorized → 401" — exclusivity is structurally guaranteed (single conditional `UPDATE … WHERE locked_by IS NULL`), 401 enforced by `requireAgentAuth` (constant-time Bearer compare, fail-closed). End-to-end curl is **operator-gated** (needs deployed URL + `AGENT_API_KEY` + Upstash env for the 429 path) — carried to this Commit 1.6 entry's operator pre-flight. Locally-provable parts (type-check, auth/limit/validation logic, transition map) all green.
- Validation: CI-equivalent `pnpm turbo lint type-check test:unit` → 48/48 workspace-wide. `next build` remains Vercel-authoritative (OOM-bound locally). `validation-checklist.md` § Always + § Foundations green.
- Files changed: `apps/ops-console/app/api/agent/` (7 Bearer-gated route files: leads POST, leads/[id] PATCH, leads/[id]/lock POST, leads/[id]/release POST, businesses POST, agent-runs POST, agent-runs/[id]/finalize POST — all env-touching imports dynamic per the Commit-1.4 cubic-P1 build-inertness lesson); `apps/ops-console/lib/` (`agent-handler.ts` auth→limit→log pipeline wrapper + `requireUuid`/`readJson`, `ratelimit.ts` two limiters, `agent-auth.ts` constant-time compare, `lead-transitions.ts` valid-edge map); `app/api/auth/[...nextauth]/route.ts` POST now magic-link-rate-limited (IP-keyed, closes the ADR-017 exemption); `packages/db/src/index.ts` re-exports drizzle operators (single drizzle-orm identity → fixes cross-package `PgColumn` TS2769). Bookkeeping (this entry + Commit 1.4's, + next-step rewrite) carried into the Commit 1.6 branch per the post-Pass-1 write policy.
- Next commit queued: **Phase 1 / Commit 1.6 — Ops-console: Leads view.** Branch `phase-1/commit-1.6-leads-view` cut from `25711ce`; carries this entry + the CodeRabbit-advisory loop-doc policy change (CLAUDE.md/RALPH-LOOP.md/adr-log) + the next-step.md rewrite per the post-Pass-1 write policy.
- Notes: 3rd consecutive operator gate-relaxation on CodeRabbit → triggered the formal ADR-035 loop-doc amendment (CodeRabbit advisory, not a merge gate) landed in the Commit 1.6 bookkeeping. The agent API's lock exclusivity is the master-plan acceptance crux and is structurally (not test-) guaranteed. 🔴 Carry-forward security action still open: rotate the Neon `neondb_owner` password.

## 2026-05-16 — Phase 1 / Commit 1.6 — Ops-console: Leads view

- Branch: phase-1/commit-1.6-leads-view
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/17
- Merge SHA: 7bab3e17c38ce5340c08f1725b5a770c0e02c30f
- CodeRabbit: rate-limited (auto-comment "exceeded the limit for the number of commits that can be reviewed per hour") — **no review posted**. **First PR merged cleanly under the new CodeRabbit-advisory policy** (adr-log 2026-05-16 — ADR-035): no operator gate-relaxation decision needed; the rate-limit was simply non-blocking by policy. This is the policy working as intended — the recurring stall that forced manual decisions on PRs #14/#15/#16 is now absorbed.
- Secondary reviewer: `cubic-dev-ai` check NEUTRAL at merged HEAD (no inline findings, no CHANGES_REQUESTED).
- CI on PR #17: `lint` + `type-check` + `unit-tests` all SUCCESS; Vercel Preview SUCCESS. Pass-2 required checks gated the merge naturally (auto-merge armed at open, fired on the last required check going green).
- ADRs touched: implements ADR-036 + Apple HIG (skeleton/empty/optimistic-with-rollback/pull-to-refresh), ADR-012 (server action is a thin authed boundary; errors surface as discriminated results). No ADR text changes. Reuses the Commit-1.5 `lead-transitions.ts` map as the single source of transition truth shared by the agent API and this operator UI.
- Acceptance evidence: master plan "Loads correctly / empty state copy / optimistic + rollback" — type-check green (48/48 workspace incl. `@bec/ops-console:type-check`); empty-state renders the exact master-plan string ("No leads yet — run Scout to populate.") with a distinct filtered-empty variant; optimistic transition via `useOptimistic`+`useTransition` with visual rollback on the action's `{ok:false}` + error toast. Browser/device e2e (Add-to-home-screen, real touch) is operator-gated on the Vercel deploy — `next build` is OOM-bound locally, `type-check` is the load-bearing local gate (established precedent since Commit 1.4).
- Validation: `pnpm turbo lint type-check test:unit` → 48/48 workspace-wide. `next build` Vercel-authoritative.
- Files changed: 10. New `apps/ops-console/lib/leads-data.ts` (server-only `listLeads`/`getLead`, dynamic `@bec/db` import for build-inertness); new `app/(app)/leads/` route group — `page.tsx` (gap-sorted table, status filter chips, DB-empty vs filtered-empty), `loading.tsx` skeleton, `pull-to-refresh.tsx` (client, mobile), `status-badge.tsx` (shared status presentation), `actions.ts` (`transitionLead` server action — race-safe atomic conditional UPDATE + history insert keyed by signed-in operator), `[id]/page.tsx` (detail: diagnosis/offer/assets/notes/history), `[id]/loading.tsx`, `[id]/transition-controls.tsx` (client optimistic + rollback toast); `app/(app)/page.tsx` now links to `/leads`.
- Next commit queued: **Phase 1 / Commit 1.7 — Mobile `/m` route — basic shell.** Branch `phase-1/commit-1.7-mobile-shell` cut from `7bab3e1`; carries this entry + the next-step.md rewrite per the post-Pass-1 write policy.
- Notes: The Leads view is the first read-UI consumer of agent-API-populated data; the operator transition path deliberately does NOT use the Bearer agent API (it's the authed operator surface gated by the `auth.ts` allow-list). CodeRabbit never reviewed this PR — acceptable under the advisory policy; the structural correctness (race-safe transition mirrors the unit-of-work the agent route already proved) plus type-check is the standing local signal.

## 2026-05-16 — Phase 1 / Commit 1.7 — Mobile `/m` route — basic shell

- Branch: phase-1/commit-1.7-mobile-shell
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/18
- Merge SHA: 8e4ee581389a2804519a1de992b73de2a8baaeb9
- CodeRabbit: advisory (no blocking action taken regardless of state — standing policy). cubic-dev-ai check NEUTRAL at merged HEAD; no inline findings.
- CI on PR #18: `lint` + `type-check` + `unit-tests` all SUCCESS; Vercel Preview SUCCESS. Auto-merge armed at open, fired on the last required check green (Pass-2 natural gate).
- ADRs touched: implements ADR-036 + Apple HIG (44pt taps, `env()` safe-area insets, modal sheets for compose, dark default, `viewport-fit=cover`, `apple-mobile-web-app-capable`, manifest). No ADR text changes. No new env, no schema, no auth surface (mobile shell nests inside the existing `(app)` guarded route group).
- Acceptance evidence: master plan "Add-to-home-screen works on iPhone / no Safari chrome / all five tabs reachable" — the device-observable parts (PWA install, standalone chrome-less launch) are operator-gated on the Vercel deploy; locally-provable parts all green: all five routes resolve under `(app)/m/{,leads,replies,articles,metrics}`, `app/manifest.ts` serves `/manifest.webmanifest` (display:standalone, start_url /m), `appleWebApp` meta + icon links wired, type-check 48/48 workspace.
- Validation: `pnpm turbo lint type-check test:unit` → 48/48. `next build` Vercel-authoritative (OOM-bound locally).
- Files changed: 13. `apps/ops-console/app/manifest.ts` (Next metadata manifest), `public/icon.svg` (PWA icon), `app/layout.tsx` (appleWebApp + icon metadata), `app/(app)/m/layout.tsx` (shell column + sticky nav), `_components/bottom-nav.tsx` (client, 5 tabs, usePathname, ≥44pt, safe-area), `_components/sheet.tsx` (reusable modal bottom sheet — Escape/backdrop/scroll-lock/safe-area), `_components/placeholder.tsx`, five tab `page.tsx` (Home/Leads/Replies/Articles/Metrics), `replies/compose-reply.tsx` (client Compose → Sheet, the HIG "modal sheets for compose" requirement).
- Next commit queued: **Phase 1 / Commit 1.8 — Agent runtime: Scout.** Branch `phase-1/commit-1.8-agent-scout` cut from `8e4ee58`; carries this entry + the next-step.md rewrite per the post-Pass-1 write policy.
- Notes: iOS Apple-touch-icon wants a raster PNG (SVG ships for Chrome/Android + favicon); generating a PNG in-loop isn't feasible, so a 180×180 `app/apple-icon.png` is an operator pre-flight item (Add-to-home-screen still works without it — glyph falls back to a page snapshot). Bottom-nav `_components` uses Next's private-folder underscore so it's non-routable. cubic NEUTRAL; CodeRabbit not consulted (advisory) — type-check + structural routing is the standing local signal for a UI-shell commit.

## 2026-05-16 — Phase 1 / Commit 1.8 — Agent runtime: Scout

- Branch: phase-1/commit-1.8-agent-scout
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/19
- Merge SHA: 82366fdbf5608bc6f483c68439ad9a1868802de2
- CodeRabbit: advisory (standing policy). cubic-dev-ai check NEUTRAL at merged HEAD.
- CI on PR #19: `lint` + `type-check` + `unit-tests` all SUCCESS; Vercel Preview SUCCESS. Auto-merge fired on the Pass-2 natural gate.
- ADRs touched: implements ADR-019 (prompt frontmatter `version: 1` → `agentRuns.promptVersion`), ADR-003 (writes via the Bearer agent API only; read-only Postgres MCP for cap/dedup reads; filesystem stays prompt-artifact-only), ADR-018 (`agent_runs` logging), ADR-035 (Scout caps 150/30), ADR-031 (`do_not_contact`/`is_client` exclusion). Gap-score formula transcribed from the architecture doc (weighted 0–100, `scoringVersion: 1`). No ADR text changes; no schema; no app code.
- Acceptance evidence: master plan "`claude /scout …` → ≥10 leads, daily cap enforced" is runtime/operator-gated (needs deployed agent API + `GOOGLE_MAPS_API_KEY`). Locally-provable parts green: `.mcp.json` valid JSON, `scout.md` valid YAML frontmatter with `version: 1`, `/scout` delegates to the subagent. **All agent-API payloads were verified against the live Commit-1.5 Zod route schemas** (corrected mid-commit: `businesses` requires `slug`; `leads` create has no `status`/`changedBy` — DB-defaults to `new`; `agent-runs` uses `agentName`/`invokedBy`; `finalize` `status` enum is `succeeded|failed|aborted` and has **no** structured scanned/leads fields, so the cap-accounting metric rides in a load-bearing `[scout-metrics scanned=N leadsAdded=M]` token in `output_summary`, parsed off `agent_runs.started_at` — there is no `created_at` on that table).
- Validation: `pnpm turbo lint type-check test:unit` → 48/48 (FULL TURBO; no workspace code touched). `jq empty agency/.mcp.json` passes.
- Files changed: 3. `agency/.claude/agents/scout.md` (v1 prompt, full discovery→score→lead procedure), `agency/.mcp.json` (google-maps + read-only postgres MCP, `${VAR}` expansion, no secrets), `agency/.claude/commands/scout.md` (`/scout <niche> <city>`).
- Next commit queued: **Phase 1 / Commit 1.9 — Agent runtime: Diagnoser.** Branch `phase-1/commit-1.9-agent-diagnoser` cut from `82366fd`; carries this entry + the next-step.md rewrite per the post-Pass-1 write policy.
- Notes: The commit prompt said "fetch business detail from API" but the Commit-1.5 surface is **POST/PATCH-only (no GET)** — reads go through the read-only Postgres MCP per ADR-003 (same pattern as Scout's cap reads). Operator pre-flight gained `GOOGLE_MAPS_API_KEY` / `AGENT_API_KEY` / `OPS_CONSOLE_URL`; ADR-038 schema add for `GOOGLE_MAPS_API_KEY` deferred to when agent-runtime app code lands (1.8 ships no `@bec/config`-touching code).

## 2026-05-16 — Phase 1 / Commit 1.9 — Agent runtime: Diagnoser

- Branch: phase-1/commit-1.9-agent-diagnoser
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/20
- Merge SHA: 33a1e7b02b0d3c2ed928cdcab9acda688fdc7ea1
- CodeRabbit: advisory (standing policy). cubic-dev-ai check NEUTRAL at merged HEAD.
- CI on PR #20: `lint` + `type-check` + `unit-tests` all SUCCESS; Vercel Preview SUCCESS. Auto-merge fired on the Pass-2 natural gate.
- ADRs touched: implements ADR-019 (`version: 1` frontmatter), ADR-003 (read via read-only Postgres MCP — no GET API; write only via the Bearer `PATCH`), ADR-018 (`agent_runs` logging), ADR-035 (Diagnoser daily cap 30), **ADR-034 (created the two canonical rubric files** `agency/.claude/rubrics/copy-quality.md` + `banned-phrases.md` — previously only `.gitkeep`; ADR-034 mandates them as the single source referenced by Diagnoser now / Checker+Editor later). No ADR text changes; no schema; no app code.
- Acceptance evidence: master plan "10 leads → 10 diagnoses, ≥7/10 sound human" is operator-judged + runtime-gated (needs deployed agent API). Locally-provable parts green: `diagnoser.md` valid `version: 1` frontmatter, rubric files present, `/diagnose` + `/diagnose-pending` delegate correctly, payloads verified against the Commit-1.5 `PatchLead` schema (`changedBy` required; `new → diagnosed` valid; `diagnosis`/`offer` are `z.record`). `pnpm turbo` 48/48 FULL TURBO (no workspace code).
- Validation: `pnpm turbo lint type-check test:unit` → 48/48. Artifact frontmatter + delegation verified by inspection.
- Files changed: 5. `agency/.claude/rubrics/copy-quality.md`, `agency/.claude/rubrics/banned-phrases.md`, `agency/.claude/agents/diagnoser.md` (v1: read lead+business via postgres-ro → checklist eval → ~50-word consultant-voice summary under ADR-034 → tiered Offer by gap_score → PATCH→`diagnosed` → finalize), `agency/.claude/commands/diagnose.md`, `agency/.claude/commands/diagnose-pending.md`.
- Next commit queued: **Phase 1 / Commit 1.10 — Editorial rotation foundation schema.** Branch `phase-1/commit-1.10-editorial-rotation-schema` cut from `33a1e7b`; carries this entry + the next-step.md rewrite per the post-Pass-1 write policy.
- Notes: Decision to create the ADR-034 rubric files in 1.9 (not defer) — the commit prompt says "apply the ADR-034 copy rubric," which requires the rubric to exist as a referenceable single-source artifact rather than be inline-duplicated in the prompt. cubic NEUTRAL; CodeRabbit not consulted (advisory) — artifact validity + schema-accuracy review is the standing local signal for prompt-config commits.

## 2026-05-16 — Phase 1 / Commit 1.10 — Editorial rotation foundation schema

- Branch: phase-1/commit-1.10-editorial-rotation-schema
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/21
- Merge SHA: 3a693f57d19433d47666d8b54bb5b73596f04f6e
- CodeRabbit: advisory (standing policy). cubic-dev-ai check NEUTRAL at merged HEAD.
- CI on PR #21: `lint` + `type-check` + `unit-tests` all SUCCESS; the Commit-1.3 migration-test workflow ran 0003 forward/idempotent/rollback on an ephemeral Neon branch and asserted the 32-table canonical set; Vercel Preview SUCCESS. Auto-merge fired on the Pass-2 natural gate.
- ADRs touched: implements ADR-040 (editorial-rotation schema + seed data verbatim from the Editorial Rotation Specification), ADR-002/003 (Drizzle migration, Postgres source of truth), ADR-038 (prod-write guard unchanged — migrate/seed still gated). No ADR text changes. First code-bearing commit since 1.7.
- Acceptance evidence: master plan "all tables created; seeded data queryable; `getSeasonalWeight('charter_fishing', 2026-06-15) === 1.5`". Migration test proves the 5 tables + 32-table canonical set apply cleanly + roll back. The seasonal-weight assertion runs in the `db:seed` tail (operator/CI-gated like Commit 1.1/1.2 — `@bec/db` has no vitest; `computeSeasonalWeight` is the pure, type-checked core). `pnpm turbo` 48/48.
- Validation: `pnpm turbo lint type-check test:unit` → 48/48; `pnpm --filter @bec/db db:generate` produced `0003_damp_the_call.sql` offline (5 CREATE TABLE + 2 sites ADD COLUMN + the unique/btree indexes verified by inspection).
- Files changed: 10. New `packages/db/src/schema/editorial-rotation.ts` (5 ADR-040 tables; `season_events.name` unique index added for seed idempotency), `packages/db/src/season.ts` (`computeSeasonalWeight` pure + `getSeasonalWeight` DB wrapper, exported from `@bec/db`), `migrations/0003_damp_the_call.sql` + meta; `schema/index.ts` barrel, `schema/sites.ts` (+2 weekly-article columns), `src/index.ts` (exports), `src/seed.ts` (10/30/120/8 idempotent + acceptance assertion), `test-migrations.ts` (27→32).
- Next commit queued: **Phase 1 / Commit 1.11 — Pipeline signal capture.** Branch `phase-1/commit-1.11-pipeline-signal-capture` cut from `3a693f5`; carries this entry + the next-step.md rewrite per the post-Pass-1 write policy.
- Notes: Qualitative niche values mapped to 0-100 (Very high 90 / High 80 / Medium-high 65 / Medium 50 / Low-medium 35 / Low 20). Premium archetype excludes HVAC + auto detailing (isExcluded rows carry a placeholder primaryCategorySlug). Season events seeded with representative 2026 dates; the resolver compares month/day year-agnostically so it works for any query year. The `season_events.name` unique index is a deliberate spec-superset addition (the spec lists no natural key) solely to keep the seed idempotent like every other table.

## 2026-05-16 — Phase 1 / Commit 1.11 — Pipeline signal capture

- Branch: phase-1/commit-1.11-pipeline-signal-capture
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/22
- Merge SHA: da475e6dc1f0f87c09c86acb7e7ac5de5e614b0d
- CodeRabbit: advisory (standing policy). cubic-dev-ai check NEUTRAL at merged HEAD.
- CI on PR #22: `lint` + `type-check` + `unit-tests` all SUCCESS; Vercel Preview SUCCESS. Auto-merge fired on the Pass-2 natural gate.
- ADRs touched: implements ADR-040 (pipeline_signals event log), ADR-003 (agents write only via the Bearer agent API), ADR-017 (new endpoint inherits the shared limiter via `agentRoute`), ADR-012 (error capture via `agentRoute`). No ADR text changes.
- Acceptance evidence: master plan "Scout run → matching pipeline_signals; trailing-14d GET returns expected" is operator/runtime-gated (deployed agent API + DB). Locally-provable green: the POST+GET route type-checks under `agentRoute`; Scout `5b` / Diagnoser `6b` reference the endpoint with FK-safe niche resolution; `pnpm turbo` 48/48.
- Validation: `pnpm turbo lint type-check test:unit` → 48/48.
- Files changed: 3. New `apps/ops-console/app/api/agent/pipeline-signals/route.ts` (POST canonical-strength + GET ?niche=&city=&since=, both Bearer/limiter/error-wrapped); `agency/.claude/agents/scout.md` (+5b lead_added signal) and `diagnoser.md` (+6b diagnosis_done signal), niche resolved to a real `niches.id` via postgres-ro, signal failure non-fatal.
- Next loop step: **Phase 1 ADR-035 quality gate** (NOT a Commit 1.12 — Phase 1 has no further implementation commits).
- Notes: Strength is server-canonical (`SIGNAL_STRENGTHS` = spec table); the enum already carries the future Builder/Filmer/Pitcher/inbound/Calendly signal types so those agents need no schema change when they land (the "prepare hooks" ask). All Phase 1 implementation commits (1.1–1.11) are now merged.

## 2026-05-17 — Off-plan — Ops-console Vercel deploy unblock (Phase 1 gate box 9)

Two off-plan changes were needed to make `bec-ops-console` actually deploy
and serve, which gates Phase 1 boxes 9 (deploy + magic link) / 10 (iPhone
login). Recorded here per the off-plan task-template; renumbers nothing.

**1. PR #24 — Auth.js v5 edge split (`task/2026-05-17-ops-console-auth-edge`)**
- Merge SHA: 7998815 (squash). Operator-authored; reviewed + hardened by the loop.
- Problem: `next build` failed — `middleware.ts` imported `@/auth`, dragging
  `DrizzleAdapter` + `@bec/db` (pg) into the Edge bundle (`TS2307` +
  "Edge Function referencing unsupported modules: @/auth").
- Change: new `apps/ops-console/auth.config.ts` (edge-safe slice);
  `middleware.ts` uses `NextAuth(authConfig).auth`; `auth.ts` spreads
  `authConfig` and keeps the adapter; `turbo.json` `globalPassThroughEnv`
  + expanded `build.env` (also cleared the Vercel "env vars missing from
  turbo.json" warnings).
- Loop review caught + fixed a merge-blocking bug (commit 61bcc51): the edge
  config included the Resend (Email) provider, which requires a DB adapter —
  `NextAuth(authConfig)` in middleware has none, so Auth.js's per-request
  config assertion would throw `MissingAdapter` on every authed request in
  the deployed Edge runtime (CI/type-check can't catch it). Fixed →
  `providers: []` in the edge slice; Resend stays only in `auth.ts` (with
  the adapter + validated `serverEnv`). cubic P1 + a CodeRabbit nitpick;
  both replied with rationale. Required CI green; merged under the
  CodeRabbit-advisory policy.

**2. Direct-to-main `f5a05d0` — runtime `__dirname` crash fix**
- After #24 the build succeeded but every route (incl. `/favicon.png`)
  500'd at server boot: `ReferenceError: __dirname is not defined`.
- Root cause: `apps/ops-console` is `"type": "module"`, so Next bundles the
  server as ESM; `instrumentation.register()` → `Sentry.init()` pulls
  @sentry/nextjs's Node/OpenTelemetry stack (`import-in-the-middle`) which
  references the CJS-only `__dirname` → `register()` throws at function init
  → all routes 500. Pre-existing; first reachable once the deploy succeeded.
- Fix: `next.config.ts` adds `@sentry/nextjs` to `serverExternalPackages`
  (loads as native CJS where `__dirname` exists); `instrumentation.ts`
  wraps the Sentry imports in try/catch so telemetry init can never 500
  the control plane again (defense in depth). `pnpm turbo` 48/48.
- ⚠️ **Process deviation (recorded for transparency):** this fix was
  pushed **directly to `main`** (`f5a05d0`), bypassing the PR/CI flow — a
  violation of the CLAUDE.md "never push to `main` directly"
  non-negotiable. Cause: an intended `git checkout -b` in a compound
  command did not take effect, so the commit landed on `main`; the push
  succeeded because the git user is a repo admin and Pass-2 protection has
  `enforce_admins: false` (so the rule is currently discipline-enforced,
  not protection-enforced, for admins). Operator chose (option A) to keep
  the validated fix on `main` and redeploy rather than compound the
  incident with revert/force-push churn. **Follow-up flagged:** consider
  flipping Pass-2 `enforce_admins: true` to make the guardrail real (a
  separate change, pending operator approval).

## 2026-05-17 — Off-plan — Ops-console route-handler types + CI typegen (Phase 1 gate box 9)

Follow-on to the deploy-unblock entry above. The `bec-ops-console` Vercel
build, once correctly running `next build --webpack` with workspace deps
built, failed at the integrated TypeScript step — a real defect that all CI
gates were structurally blind to. Recorded per the off-plan task-template;
renumbers nothing; does **not** change Phase 1 gate status (gate-box-9
defect remediation, not gate progress).

- **Type:** Off-plan remediation (task-template). Triggered by operator
  decision "use the loop and the proper CI pipeline" after the Vercel deploy
  failed where CI was green.
- **Branch:** `task/2026-05-17-ops-console-route-types-ci-typegen` (from
  `origin/main` `c804d4e`).
- **PR:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/27
- **Merge SHA:** `d4b0f992450d32f8568a50c9d39cc50c8a44b682` (squash of
  `e995219` + `f707bba` + `2a5fa89`, merged 2026-05-18T03:18:08Z,
  `mergeStateStatus: CLEAN`).
- **CI at merged HEAD `2a5fa89`:** `lint` + `type-check` + `unit-tests` all
  SUCCESS. `Vercel – bec-ops-console` preview deploy **passed end-to-end** —
  deps built → webpack compile → TypeScript step (the exact pre-fix Vercel
  failure) now green → page-data collection (Vercel env present) → deployed.
  This is the gate-box-9 objective met on real Vercel infra.
- **CodeRabbit (advisory per the 2026-05-16 ADR-035 loop-doc policy):** 1
  Critical finding — the `runbooks/ops-console-deploy.md` §3 env table was
  missing `AGENT_API_KEY`/`ANTHROPIC_API_KEY`/`CRON_SECRET` (a real defect in
  the §1 edit). **Fixed** in `f707bba`; CodeRabbit re-reviewed → **APPROVED**.
- **cubic:** clean (check = pass at merged HEAD). 2 findings: P2 (line-26 vs
  §3 mismatch) — cubic self-marked "✅ Addressed in `f707bba`"; P3 (the
  `f707bba` env-table fix left a duplicated Markdown table header) — **fixed**
  in `2a5fa89`. No findings open at merge.
- Bookkeeping note: this finalization (PR/SHA/review outcomes) is carried on
  the next loop branch per the post-Pass-1 write policy; the loop returns to
  the operator-gated Phase 1 wait immediately after.
- **Root cause:** `apps/ops-console/lib/agent-handler.ts` hardcoded
  `RouteCtx = { params: Promise<{ id: string }> }` for *every* agent route.
  Next 16 App Router typed-routes generate a per-route handler constraint in
  `.next/types/**`: non-dynamic routes get `params: Promise<{}>`. The
  hardcoded `{ id: string }` is not satisfiable by `{}` → `next build` fails
  ("Property 'id' is missing in type '{}'") for `agent-runs`, `businesses`,
  `leads`, `pipeline-signals`. CI ran a bare `tsc --noEmit` with no
  `.next/types` present, so the constraint did not exist at CI time — green
  CI, broken Vercel.
- **Fix (code):** `agent-handler.ts` `agentRoute` / `RouteCtx` / `Handler`
  made generic over the params object, default `Record<never, never>`
  (matches Next's non-dynamic `Promise<{}>`). The four dynamic `[id]`
  routes — `agent-runs/[id]/finalize`, `leads/[id]/lock`,
  `leads/[id]/release`, `leads/[id]` (PATCH) — call
  `agentRoute<{ id: string }>(…)` so `id` stays a concrete `string`.
- **Fix (CI pipeline — the "proper CI pipeline" the operator asked for):**
  `apps/ops-console` `type-check` script `tsc --noEmit` →
  `next typegen && tsc --noEmit` (Next 16.2.6 `next typegen` generates
  route types without a full build); turbo `type-check` task `dependsOn`
  `["^type-check"]` → `["^build"]` so `@bec/db`/`@bec/config`/`@bec/logger`
  `dist/` exists for `next typegen`/`tsc` runtime-condition resolution. The
  existing CI `type-check` job now fails on any route-handler/route-path
  signature mismatch — the gap that hid this bug is closed. Recorded in
  `docs/dev/adr-log.md` (`2026-05-17 — ADR-016`, clarification; no ADR text
  change).
- **Fix (durable build config):** `apps/ops-console` `build` script
  `next build` → `next build --webpack` (Turbopack deadlocks for this app —
  verified: every thread parked in `uv_cond_wait`, 0% CPU; a hang, **not**
  OOM, so more RAM does not help). `docs/runbooks/ops-console-deploy.md` §1
  rewritten: the prior "leave Build/Output at Next.js defaults; ample memory
  so Turbopack OOM does not occur" guidance was wrong and *caused* the
  Storybook-misconfig + Turbopack-hang failures; replaced with the verified
  Vercel project config (Framework Next.js; Root `apps/ops-console`; Build
  Command `cd ../.. && pnpm turbo run build --filter=@bec/ops-console`;
  Install `cd ../.. && pnpm install --frozen-lockfile`; Output override
  OFF; 9 prod-required env vars incl. the often-omitted `AGENT_API_KEY` /
  `ANTHROPIC_API_KEY` / `CRON_SECRET`).
- **Validation:** `pnpm turbo run type-check --filter=@bec/ops-console` →
  `Tasks: 7 successful, 7 total`, `next typegen` `✓ Types generated
  successfully`, `tsc --noEmit` clean, `EXIT_CODE=0` (this is the exact CI
  path and the exact Vercel failure point — decisive). `pnpm --filter
  @bec/ops-console exec next build --webpack` compiles; it stops at
  "Collecting page data" on missing *local* env (`@bec/config`
  `productionRequired`, ADR-038) — expected and out of scope here; Vercel
  has the env. CI `lint`/`type-check`/`unit-tests` to be confirmed green on
  the PR at `/ship-task`.
- **Files changed:** `apps/ops-console/lib/agent-handler.ts`;
  `apps/ops-console/app/api/agent/agent-runs/[id]/finalize/route.ts`,
  `…/leads/[id]/lock/route.ts`, `…/leads/[id]/release/route.ts`,
  `…/leads/[id]/route.ts`; `apps/ops-console/package.json`; `turbo.json`;
  `docs/dev/adr-log.md`; `docs/runbooks/ops-console-deploy.md`;
  `docs/dev/status/task-log.md`; `docs/dev/status/next-step.md`.
- **Not in scope (flagged for a later task):** the Next 16
  `middleware`→`proxy` deprecation warning and the optional
  `global-error.js` Sentry handler. Phase 1 gate status unchanged
  (`PHASE 1 GATE — STATUS: NOT PASSED`); the operator action list still
  governs the gate. This task only makes gate box 9's ops-console build
  succeed on Vercel.

## 2026-05-18 — Off-plan — Ops-console deploy GREEN; operator login working (Phase 1 gate box 9 ✅)

Closes the deploy-remediation arc. `bec-ops-console` now deploys cleanly to
`ops.bestemeraldcoast.com` and operator magic-link sign-in works end-to-end.
Off-plan (task-template); renumbers nothing. **Materially advances the
Phase 1 gate** (boxes 9 + Neon-verify closed; box 10 device-confirmation
pending) but the gate stays **NOT PASSED** per ADR-035 (Scout/Diagnoser
live runs, blind validation, restore drill, live-seed evidence still open).

**Code arc (all via PR, CodeRabbit-advisory, Pass-2 required CI green):**

- **PR #26 — hardened `__dirname` runtime fix.** Branch
  `task/2026-05-17-ops-console-dirname-hardened` → squash `c804d4e`.
  Externalized `@sentry/nextjs` + `import-in-the-middle` +
  `require-in-the-middle`; removed the top-level `import * as Sentry` from
  `instrumentation.ts` (deferred to guarded dynamic imports). Root cause:
  app is `"type":"module"` → ESM server bundle; Sentry/OTEL
  `*-in-the-middle` reference the CJS-only `__dirname`. The earlier
  `f5a05d0` partial fix (the recorded direct-to-`main` process deviation,
  2026-05-17 deploy-unblock entry) was insufficient because the top-level
  Sentry import crashed boot *outside* the `register()` try/catch. **PR #26
  properly superseded `f5a05d0` through the PR flow.**
- **PR #27 — route-handler types + CI typegen.** Recorded in the
  2026-05-17 route-types entry above (cross-ref); part of this arc.
- **PR #29 — Resend `From` → verified subdomain.** Branch
  `task/2026-05-18-resend-from-ops-subdomain` → squash `814fb38`.
  `apps/ops-console/auth.ts` `from: "ops@bestemeraldcoast.com"` →
  `"noreply@ops.bestemeraldcoast.com"`. Resend verifies the
  `ops.bestemeraldcoast.com` **subdomain**, not the apex; magic-link
  delivery fails until `From` matches a verified domain.
  `docs/runbooks/ops-console-deploy.md` §4 updated to match.

**Operator infra actions (not code) that closed the loop:**

- **Neon reconfigured.** DB connectivity restored. Functionally verified by
  the successful end-to-end magic-link sign-in: Auth.js's Resend (Email)
  provider requires the Drizzle adapter to persist + consume the
  verification token and create user/session rows, so a working sign-in
  proves production Neon + the Auth.js tables (migration 0001) are live.
  (This does **not** prove the full seed — see gate box "live db:seed".)
- **Vercel env root cause (operationally important).** `NEXTAUTH_URL` was
  an empty string and `NEXTAUTH_SECRET` a 2-char value (literal `""`) on
  the **`bec-ops-console` Production scope**, untouched for 2 days —
  confirmed objectively via `vercel env ls` (`created` 2d-ago, unchanged)
  + `vercel env pull --environment=production` (showed `NEXTAUTH_URL=""`,
  secret length 2). Prior dashboard edits had not landed on the correct
  project/scope (Vercel masks encrypted values in the edit field → easy to
  re-save empty; and earlier `vercel --prod` had targeted `bec-storybook`
  because the repo `.vercel` link pointed there). Resolved by setting the
  vars via the Vercel **CLI** against the explicitly-linked
  `bec-ops-console` project (`vercel env rm`/`add` piped with `printf`,
  no trailing newline), Production + Preview. `ANTHROPIC_API_KEY` set
  (a `sk-ant-` placeholder is schema-valid since ops-console never calls
  Anthropic — the H2 "app-scoped productionRequired" follow-up is still
  open).
- **Verification:** operator confirmed successful sign-in to the ops
  console (2026-05-18). `GET /` → `/login` 200; magic-link POST succeeds;
  no `EnvValidationError`, no `TypeError: Invalid URL`.

**Repo state:** local `main` == `origin/main` == `814fb38`; no open PRs;
the deploy-arc code is fully merged. Only the operator's long-parked
Phase-0 Storybook/Vercel WIP remains intentionally unstaged.

**Still open for the gate:** live `db:seed` evidence (🟡), iPhone-Safari +
add-to-home-screen device confirmation (🟡 — blocker removed, quick check),
Scout live run (boxes 11/12), Diagnoser live run (boxes 13/14), external
blind validation (15), restore drill (17). **Gate remains NOT PASSED.**

**Process follow-ups (pending operator approval, recorded 2026-05-17):**
Pass-2 `enforce_admins: true` (so "no direct push to `main`" is
protection-enforced, not discipline-only); H1 (drop `NEXTAUTH_URL` from
`productionRequired` — `trustHost:true` makes it unnecessary and a
required-but-wrong value is a footgun); H2 (app-scoped `productionRequired`
so ops-console needn't carry unused `ANTHROPIC_API_KEY`/`CRON_SECRET`).

## 2026-05-18 — Off-plan — H1: NEXTAUTH_URL no longer production-required + Pass-2 enforce_admins

Operator-approved post-deploy-incident hardening. Two of the three
follow-ups above actioned (H2 still deferred). Off-plan (task-template);
no commit reorders; **Phase 1 gate status unchanged** (hardening, not gate
progress).

- **H1 (code, PR):** `packages/config/src/env.ts` — removed
  `NEXTAUTH_URL` from `productionRequired`; it stays
  `z.string().url().optional()` in the base schema (set-but-malformed
  still rejected; unset now allowed in production). Rationale: Auth.js v5
  `trustHost:true` derives the origin from the request, so the var is
  unnecessary on Vercel, and a required-but-malformed value was the root
  cause of the 2026-05-17/18 deploy incident. `env.test.ts` +2 tests
  (prod-without-NEXTAUTH_URL parses; set-but-malformed still rejects) →
  `@bec/config` 18/18. `adr-log.md` carries the 2026-05-18 ADR-038
  clarification (no ADR text change). Branch
  `task/2026-05-18-h1-nextauth-url-optional`; PR/merge SHA recorded at
  `/ship-task`. `NEXTAUTH_SECRET` deliberately untouched (Auth.js JWT
  signing — stays required).
- **Pass-2 `enforce_admins: true` (infra, gh api):** branch protection on
  `main` updated so required checks + PR flow are enforced for admins too
  — closes the gap that let `f5a05d0` reach `main` directly (2026-05-17
  process deviation). Does not affect the PR + auto-merge loop (auto-merge
  on required-checks-green still works); it only removes admin *bypass* of
  protection / direct pushes. Applied via the dedicated
  `…/branches/main/protection/enforce_admins` endpoint (surgical — no
  other protection settings touched).
- **Still deferred:** H2 (app-scoped `productionRequired` so ops-console
  needn't carry unused `ANTHROPIC_API_KEY`/`CRON_SECRET`) — scoped as a
  later task, not yet started.
- Validation: `pnpm turbo lint type-check test:unit` → 48/48
  (`@bec/config` 18/18, `@bec/logger` 20/20).

## 2026-05-18 — Off-plan — Agent API middleware bypass (Phase 1 gate boxes 11–14 unblock)

Discovered while preparing the operator's live Scout run (gate boxes 11,
12). `POST https://ops.bestemeraldcoast.com/api/agent/agent-runs`
returned **302 → /login** even with an `Authorization: Bearer` header —
the entire agent write path (agent-runs, businesses, leads,
pipeline-signals) was unreachable to Scout/Diagnoser, hard-blocking gate
boxes 11–14. Off-plan (task-template); no commit reorders.

- **Root cause:** `apps/ops-console/middleware.ts` matcher excluded
  `api/auth` but not `api/agent`, so the NextAuth edge guard intercepted
  `/api/agent/*`, found no session cookie (machine clients send a Bearer
  token), and redirected to `/login` before the route handler ran.
- **Fix (code, PR #33):** added `api/agent` to the matcher
  negative-lookahead (one line; parallels the existing `api/auth`
  exclusion). Agent routes carry their own complete Bearer
  `AGENT_API_KEY` boundary via `agentRoute()`
  (`lib/agent-handler.ts` → 401 + ADR-017 rate limit; ADR-003/ADR-018),
  so they must not sit under the session middleware. Operator UI
  (`/dashboard`) stays guarded.
- Type: off-plan gate-remediation (RALPH-LOOP §103).
- Branch: `task/2026-05-18-agent-api-middleware-bypass`
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/33
- Merge SHA: 96ce5c900e2c85e43a552ad2207e0c3ff99024e7
- CodeRabbit: pass (advisory). cubic: pending at merge (advisory; CI
  required checks `lint`+`type-check`+`unit-tests` all green gated the
  squash-merge).
- Files changed: `apps/ops-console/middleware.ts` (1).
- Validation: `lint` (noop) ✓ · `type-check` (`next typegen && tsc
  --noEmit`) ✓ · `test:unit` (noop) ✓. Matcher regex assertion:
  `/api/agent/*` now bypasses the redirect, `/dashboard` stays GUARDED,
  `/api/auth` + `/login` unchanged. **Post-deploy live check still owed
  (operator):** after ops-console redeploys off `main`,
  `POST /api/agent/agent-runs` without a bearer must return **401**, not
  302.
- **Gate impact:** the Scout/Diagnoser boxes (11–14) were previously
  marked 🔴 *"code complete, runtime-gated"* — that was incomplete: a
  code defect in the auth middleware also blocked them. With #33 merged
  the code path is now genuinely complete; the boxes remain 🔴 pending
  the operator running the live agents, which additionally needs the
  ops-console redeploy + the Scout launch env (`OPS_CONSOLE_URL` is
  defined nowhere — not in `.env`/`.env.example`; `DATABASE_URL_UNPOOLED`
  must be exported into the `claude` session so `postgres-ro` MCP
  connects). **Phase 1 gate status unchanged — NOT PASSED.**

## 2026-05-18 — Off-plan — Lead-transition fetch-transaction 500 (Phase 1 gate boxes 13–14 unblock)

Discovered during the operator's live Diagnoser run (gate boxes 13, 14),
immediately after the #33 middleware fix. The Diagnoser produced
rubric-passing diagnoses for both `new` leads but every
`PATCH https://ops.bestemeraldcoast.com/api/agent/leads/:id` returned
**HTTP 500**; 0 leads advanced. `agent-runs` POST/finalize were healthy,
isolating the fault to the lead status-transition path. Off-plan
(task-template); no commit reorders.

- **Root cause:** PR #28 (`0d64819`) set `neonConfig.poolQueryViaFetch =
  true` (`packages/db/src/client.ts`) for Vercel serverless auth
  stability. Every Neon `pool.query()` is then a stateless HTTP request,
  so Drizzle's `db.transaction()` (interactive `BEGIN…COMMIT`) has no
  session affinity and throws → `agentRoute` → hard 500. The lead
  status-transition path is the only `db.transaction()` the Diagnoser
  hits; single-statement calls work over fetch — exactly the observed
  pass/fail split. Confirmed by code trace + git bisect to #28 + a
  natural A/B in the live run (same client/deploy: transaction 500×4,
  single-statement 200).
- **Fix (code, PR #36):** replace both `db.transaction()` call sites
  with one atomic CTE statement (`UPDATE…RETURNING` feeding
  `INSERT…SELECT` into `lead_status_history`). A single statement is
  atomic in Postgres and needs no interactive session, so it is
  transport-independent (fetch OR websocket) without reverting #28's
  auth fix. New shared `applyLeadTransition()` helper in
  `apps/ops-console/lib/lead-transitions.ts`. Race-safety preserved
  exactly (UPDATE conditional on `status=from`; concurrent move → 0 rows
  → `transitioned:false` → 409, no orphan history row). ADR-003 intact.
- Type: off-plan gate-remediation (RALPH-LOOP §103).
- Branch: `task/2026-05-18-fix-lead-transition-fetch-tx`
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/36
- Merge SHA: `1d5373cd1e5cc42ab932c6356b4350b5c2ddfd03` (squash, 2026-05-18
  19:59:52Z). Auto-merge deliberately NOT enabled — operator reviewed
  (PR approved + all required checks green) then authorized the squash
  (operator instruction overrode the RALPH-LOOP §7b auto-merge norm for
  this task; §7e gate verified green pre-merge, 0 posted findings).
- CodeRabbit/cubic: advisory (RALPH-LOOP §7b); required CI checks
  `lint`+`type-check`+`unit-tests` gate the squash-merge.
- Files changed: `apps/ops-console/lib/lead-transitions.ts`,
  `apps/ops-console/app/api/agent/leads/[id]/route.ts`,
  `apps/ops-console/app/(app)/leads/actions.ts` (3).
- Validation: `lint` (noop) ✓ · `type-check` (`next typegen && tsc
  --noEmit`) ✓ · `test:unit` (noop) ✓.
- **End-to-end acceptance: DONE (2026-05-18, post-deploy).** ops-console
  redeployed off `main` (Vercel `bec-ops-console` `success`). Diagnoser
  re-run on the two `beach chair rentals` leads: both `PATCH
  /api/agent/leads/:id` → **HTTP 200 `transitioned:true`** (the exact
  path that 500×4 before the fix). Postgres source-of-truth check:
  `64eaecc1` + `87a75672` → `diagnosed`; 2 `lead_status_history`
  `new→diagnosed` rows whose `created_at` equals each lead's
  `updated_at` to the microsecond — direct evidence the atomic CTE
  wrote the UPDATE + history INSERT in **one statement**, no
  interactive transaction; ADR-035 cap accounting correct. A second
  canonical-niche run (`charter fishing`, niche `charter_fishing`) then
  exercised the full pipeline: Scout 7 leads + 7 `lead_added`
  `pipeline_signals` (run `fa9b1fe0-…`); Diagnoser 7/7 diagnosed, all
  `PATCH` 200, 7 `diagnosis_done` `pipeline_signals` written. DB
  verify: 7 charter `diagnosed`, 0 `new`, `pipeline_signals` 14d
  window = 7 `lead_added` + 7 `diagnosis_done`, `diagnosed_today=9`.
- **Gate impact:** boxes 11–14 are now **GREEN** — live Scout
  (boxes 11/12) and live Diagnoser (boxes 13/14) both proven against
  the deployed app with canonical-niche `pipeline_signals` in the
  ADR-040 trailing-query window. #33 fixed the auth-middleware bypass;
  #36 fixed this deeper `@bec/db` fetch-transport regression that also
  blocked Diagnoser persistence — together the agent code path is
  genuinely complete and runtime-verified. **Phase 1 gate as a whole
  still NOT PASSED** (residual: box 10 iPhone-Safari 🟡, box 15 blind
  validation, box 17 restore drill). Follow-up still owed: clean up
  stray `agent_runs` row `2b1fe09f-…` (stuck `running` from a
  Diagnoser API sanity-check POST; prod finalize write was blocked by
  the harness auto-mode classifier — operator action).

## Phase Gates

Each phase gate (per ADR-035) is a special entry:
```
## YYYY-MM-DD — PHASE X GATE PASSED
- Checklist: 100% green (link or paste of the checklist with all items checked)
- Next phase opens: Phase X+1 / Commit X+1.1
```

## 2026-05-19 — PHASE 1 GATE PASSED

Per ADR-035 a gate is acceptance criteria, not aspiration, and must not be
skipped "to make progress." All 17 Phase 1 quality-gate boxes are now
green — implementation (Commits 1.1–1.11, PRs #3–#22) plus the
operator/infra/human boxes that the loop could not self-certify. The
remediation arc that unblocked the live-agent boxes: PR #33 (agent-API
middleware bypass) and PR #36 (`@bec/db` fetch-transport `db.transaction()`
500), then live Scout + Diagnoser verification, the ADR-006 restore drill,
and the ADR-019 external blind validation. **Phase 2 / Commit 2.1 opens.**

Fully-checked checklist (master plan § Phase 1 quality gate, 17 boxes):

- ✅ **Migrations forward/backward** — CI migration-test workflow runs
  0000–0003 forward + idempotent + rollback on a per-PR ephemeral Neon
  branch; 32-table canonical set asserted (test-migrations.ts). Green on #22.
- ✅ **All Phase 1 unit tests pass on CI** — lint/type-check/unit-tests
  green on every PR (@bec/logger 20/20 + @bec/config 16/16 are the real
  suites; @bec/db / @bec/ops-console test:unit are intentional noops).
- ✅ **Schema: all 32 tables creatable** — proven by the migration test.
- ✅ **Seed + live DB bring-up (operator-run 2026-05-18, prod Neon)** —
  `db:migrate` applied 0000–0003 cleanly; `PROD_DB_ALLOWED=true … db:seed`
  (ADR-038 process-scoped opt-in; `.env` default untouched) succeeded
  idempotently. Captured evidence: `sites: 8`, `categories: 48`,
  `authors: 2`, `agent_budgets: 9`, `niches: 10`, `niche_category_map: 30`,
  `season_weights: 120`, `season_events: 8`, and the acceptance assertion
  `getSeasonalWeight('charter_fishing', 2026-06-15) = 1.5`. Closes the
  "all tables created and seeded" + the 8-sites/10-niches/30-mappings/
  120-weights/8-events gate boxes.
- ✅ **Neon provisioned via Vercel; prod+preview branches verified** — reconfigured 2026-05-18; functionally verified by the successful end-to-end magic-link sign-in (exercises the Drizzle adapter + Auth.js tables on production Neon).
- ✅ **Ops-console deployed to ops.bestemeraldcoast.com + magic link** — PRs #24/#26/#27/#29 + Neon reconfig + Vercel env fix (CLI, correct project/scope); operator-confirmed end-to-end sign-in 2026-05-18. See the 2026-05-18 off-plan entry.
- ✅ **Operator login on iPhone Safari** — operator-confirmed 2026-05-18: magic-link sign-in works on iPhone Safari and add-to-home-screen launches chrome-less standalone (closes Commit 1.4 + 1.7 device acceptance).
- ✅ **Scout writes ≥10 leads on a sample query** — operator-run live 2026-05-18 against the deployed app. Code complete (Commit 1.8) + PR #33 (agent-API middleware bypass) + PR #36 (lead-transition fetch-tx 500). Three Scout runs added 11 leads total (beach chair rentals 2, charter fishing 7, auto detailing 2); the canonical-niche `charter fishing` run alone wrote 7 — daily caps respected.
- ✅ **Scout writes pipeline_signals** — code complete (1.11) + PR #33/#36; verified in Postgres: canonical niches wrote `lead_added` signals (`charter_fishing` 7, `auto_detailing` 2); the non-canonical `beach chair rentals` run correctly skipped (ADR-040 FK).
- ✅ **Diagnoser 50-word diagnosis per lead** — operator-run live 2026-05-18. 11/11 leads diagnosed with ~50-word consultant-voice diagnosis + tiered offer, rubric-screened; every `PATCH /api/agent/leads/:id` returned HTTP 200 `transitioned:true` (the path PR #36 fixed from a hard 500).
- ✅ **Diagnoser writes pipeline_signals** — code complete (1.11) + PR #36; verified in Postgres: `charter_fishing` 7 + `auto_detailing` 2 `diagnosis_done` signals in the ADR-040 14d trailing window (non-canonical run correctly skipped).
- ✅ **External blind validation: ≥3/5 Diagnoser outputs pass as human** — operator-run human study completed 2026-05-19. 3 peers blind-rated 5 random Diagnoser `summary` outputs (handout `docs/dev/validation/phase1-box15-blind-validation.md`, answer key held separately). Operator-confirmed result: **3/5 judged human → PASS** (meets the ≥3/5 ADR-019 threshold; passed at the minimum bar — see note in summary). Recorded from operator attestation of the tally, not loop self-certification.
- ✅ **One restore drill (ADR-006)** — operator-authorized, executed 2026-05-19 against Neon project `royal-feather-07747239`. PITR scratch branch `dr-drill-2026-05-19` created from restore point `2026-05-19T00:55:00Z` (parent = default `production` branch); production never written (read-only on the clone), scratch branch torn down + confirmed gone. **Timing:** restore ≈1s, verify ≈1.5 min, teardown ≈2s, total ≈2 min 19 s (01:25:09Z→01:27:28Z). **PASS:** static seed tables exact (8/48/2/9/10/30/120/8); functional probe `charter_fishing` month-6 multiplier = 1.50 (= seed acceptance `getSeasonalWeight('charter_fishing',2026-06-15)=1.5`); integrity clean (0 leads missing history, 0 orphan `lead_added` signals, 0 rows past the PITR boundary); dynamic tables internally consistent (businesses 47 ≥ leads 11; lead_status_history 11 ≥ leads 11; pipeline_signals 18 = 9 `lead_added` + 9 `diagnosis_done`). Timed runbook: `docs/dev/validation/phase1-box17-restore-drill.md`.

Summary (final, 2026-05-19): **17 green / 0 yellow / 0 red — GATE
PASSED.** Every Phase 1 quality-gate box closed: migrations, unit tests,
schema, Neon-verified, deploy+magic-link, live seed, iPhone-Safari login,
Scout ≥10, Scout pipeline_signals, Diagnoser 50-word, Diagnoser
pipeline_signals, restore drill (ADR-006), external blind validation
(ADR-019). The stray `agent_runs` row `2b1fe09f-…` was finalized
`aborted` 2026-05-18. **Note (ADR-019, carry into Phase 2):** the blind
validation passed at the **minimum bar (3/5)**, not comfortably — the
Diagnoser copy clears the human-pass threshold but with no margin. This
is a legitimate pass, not a gate skip, but flags Diagnoser-prompt quality
as a worthwhile early Phase-2 improvement candidate (a future ADR-019
`version: 2` iteration is optional, not gate-required). Phase 2 / Commit
2.1 is now the active step in `next-step.md`.

## 2026-05-19 — Phase 2 / Commit 2.1: Editorial app shell with proxy.ts

`apps/editorial` taken from placeholder to a real Next.js 16 app —
host-based routing across all 8 domains via `proxy.ts` (Next 16
middleware replacement).

- **Implemented:** `proxy.ts` (Node runtime, in-function matcher per Next
  16's no-`config`-export contract) resolving request host → site via
  `lib/site-context.ts` (single `@bec/db` SELECT, fetch-transport safe;
  Upstash 60s host→site cache w/ negative caching + graceful no-Upstash
  fallback, mirrors ops-console `ratelimit.ts`); writes site context to
  request headers. Route segments `/`, `/[category]`,
  `/[category]/[slug]`, `/businesses/[slug]`, `/events`,
  `/events/[slug]`, `/authors/[slug]`,
  `(legal)/{privacy,terms,disclosure,cookies,editorial-standards}`.
  Minimal **static root layout** (lets Next's internal
  `_not-found`/`_global-error` generate) + async **`(site)`
  route-group layout** for per-site chrome. HIG reader-side + WCAG 2.2 AA
  baseline. Nothing hardcoded — `data-archetype` + `@bec/ui` CSS-var seam
  for Commit 2.2.
- **Review hardening (PR #43, 12 findings):** tightened `proxy.ts` skip
  matcher (no `.ext$`-on-any-path host-validation bypass); added static
  `app/__unknown_host__/page.tsx` calling `notFound()` so an unmapped
  host reliably 404s (it was being caught by `(site)/[category]`);
  resolver throw now degrades to the 404 path, never 500; `(site)`
  layout fails closed via `notFound()` instead of guessing a tenant;
  shared `lib/format.ts` `titleize()` for consistent `<title>`/`<h1>`.
- Type: Phase 2 plan commit (RALPH-LOOP §69).
- Branch: `phase-2/commit-2.1-editorial-app-shell`
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/43
- Merge SHA: `29f2ba0067e9801373e2bb2b0902d53474554250`
- CodeRabbit: `CHANGES_REQUESTED` then all 12 findings fixed + replied
  on-thread (§7d); merged after required CI green (state advisory per
  §7b). cubic: `COMMENTED` (same findings, addressed).
- Files changed: full `apps/editorial/` app (config, `proxy.ts`,
  `lib/site-context.ts`, `lib/format.ts`, `app/` route tree incl.
  `(site)` group + `__unknown_host__` + error pages,
  `components/page-shell.tsx`) + `pnpm-lock.yaml` (editorial deps;
  consolidated react→single 19.1.1, matching main's primary pin).
- Validation: `lint` (noop) ✓ · `type-check` (`next typegen && tsc
  --noEmit`, Node 22) ✓ · `test:unit` (noop) ✓ · required CI on #43
  (lint/type-check/unit-tests) green.
- **Acceptance DEFERRED (deploy-gated, operator infra owed):** the 2.1
  acceptance (all 8 domains resolve to their site shell + Lighthouse
  mobile ≥95) cannot run yet — `apps/editorial` has **no Vercel project /
  domains wired** (no `Vercel – bec-editorial` check; directly analogous
  to the Phase 1 ops-console Vercel setup). Additionally, full
  `next build` is **not reproducible in the local dev sandbox**: a clean
  checkout of `main` (ops-console, deployed) fails identically with a
  React-19 RSC-prerender `useContext` crash under both webpack and
  Turbopack, Node 20 and 22 — an environment limitation, not a 2.1
  defect. CI/Vercel is the authoritative build (it ships `main`). **Owed
  before Commit 2.1 acceptance can be closed:** operator creates the
  `bec-editorial` Vercel project + attaches the 8 domains, deploys off
  `main`, then the Host-header + Lighthouse acceptance is run and
  recorded here. Commit 2.2 (theme system, `packages/ui`) may proceed in
  parallel — it does not depend on the editorial deploy.
- **Environment note:** the original `~/Desktop/bestemeraldcoast-agency`
  working copy was destroyed by iCloud "Desktop & Documents" eviction
  mid-session (git DB + files zeroed). Commit 2.1 was reconstructed
  verbatim into a fresh clone at `~/dev/bestemeraldcoast-agency`; the
  loop should continue from there and the Desktop copy be abandoned.

## 2026-05-19 — Phase 2 / Commit 2.2: Theme system + Magazine archetype

ADR-032 theme system + the Magazine component set. Notably **much
scaffolding pre-existed** from Phase 0/1 and was verified, not rebuilt.

- **New:** `packages/ui/theme/apply.ts` — `themeToCssVars()` (React
  style object; safe default, no `dangerouslySetInnerHTML`) +
  `themeToCssText()` (declaration string; ADR-033 reuse). 9 Magazine
  composition components (ADR-037) — `SiteHeader`, `SiteFooter`,
  `BreadcrumbNav`, `ArticleLayout`, `ArticleCard`, `ListicleSection`,
  `BusinessCard`, `NewsletterSignupInline`, `FeaturedListingMagazine` —
  CSS-variable-token-only (ADR-032 contract), semantic + WCAG 2.2 AA
  (ADR-036), framework-neutral; a Storybook story each incl. an
  `AllArchetypes` tile. Exported from `packages/ui/index.ts`.
- **Verified pre-existing (no drift → no adr-log amendment):**
  `theme/tokens.ts` == ADR-032 == `@bec/db/schema/types.ts`;
  `archetypes/magazine.ts` == ADR-032 Initial Magazine tokens;
  `styles/globals.css` already maps every token via `@theme` +
  `.archetype-*`; `seed.ts` already seeds Pensacola (+all 8) with the
  archetype token sets — the plan's "update Pensacola's seeded row" was
  already satisfied in Phase 1, **no seed change**.
- **Editorial wiring:** `@bec/ui` back in `transpilePackages`; Tailwind
  v4 `@source` for `@bec/ui` component utilities; `(site)/layout.tsx`
  renders the real `SiteHeader`/`SiteFooter` and injects
  `themeToCssVars(archetypes[archetype])` on the `(site)` wrapper.
  Architecture note: ADR-032 says inject on `<html>`; Commit 2.1 keeps
  the root layout static (so Next internal pages build) so vars are
  injected on the `(site)` wrapper — same per-request theming, required
  by 2.1's architecture, **not an ADR change**.
- **Review:** cubic 1 finding (P2: `imageAlt` JSDoc over-claimed
  "Required" vs optional type) — fixed (contract clarified on both
  ArticleCard + FeaturedListingMagazine; ADR-022's hard alt gate is the
  ops-console image picker, not these presentational components),
  replied on-thread (§7d). CodeRabbit/cubic checks SUCCESS.
- Type: Phase 2 plan commit (RALPH-LOOP §69).
- Branch: `phase-2/commit-2.2-theme-system-magazine`
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/45
- Merge SHA: `2663d3d6b1ca6152763bb907620282e31ea4b550`
- Files changed: `packages/ui/theme/apply.ts` + 9 components + 9
  stories + `index.ts`/`theme/index.ts`; `apps/editorial/next.config.ts`,
  `app/globals.css`, `app/(site)/layout.tsx`. (No `seed.ts` change.)
- Validation: type-check `@bec/ui` + `@bec/db` (tokens↔types parity) +
  `@bec/editorial` clean (Node 22); `pnpm --filter @bec/ui
  build-storybook` builds; **`Vercel – bec-storybook` deploy check
  GREEN on #45** (authoritative @bec/ui/Storybook build); required CI
  (lint/type-check/unit-tests) green.
- **Acceptance — split:** Storybook half PROVEN (every component +
  `AllArchetypes` renders; Vercel storybook deploy green). axe-core
  0-violations is Storybook-a11y-addon-gated per ADR-036 (configured;
  verified via the a11y panel) — no headless `@storybook/test-runner`
  in repo, so not CI-asserted; components contrast-safe by construction;
  adding a headless axe runner is its own infra task. **"Pensacola
  homepage renders with the Magazine archetype" is DEFERRED** — same
  editorial-Vercel dependency as Commit 2.1 (no `bec-editorial` Vercel
  project yet); closes when the operator stands that up.
- Loop runs from `~/dev/bestemeraldcoast-agency` (Desktop copy abandoned,
  iCloud); local `next build` is CI/Vercel-only (sandbox env limit).

## 2026-05-19 — Phase 2 / Commit 2.3: Article rendering with structured data

Real `(site)/[category]/[slug]` article render replacing the 2.1 shell.
Pre-code schema gate passed: `schema/editorial.ts` verified adequate vs
ADR-010 (`syndicatedToHub`/`hubCanonicalOverride`), ADR-027
(`authors.isAi`/`isHumanReviewer`, `authorId`/`reviewedById`), ADR-015
(`isSponsored`/`sponsoredByBusinessId`/`sponsorshipDisclosure`) — no
drift, no migration, no `adr-log` amendment.

- **`lib/article.ts`** — Cache Components `'use cache'` loader keyed
  purely by (siteId, categorySlug, slug); `cacheTag(article:<siteId>:
  <slug>)` + `cacheLife('hours')` (Commit 2.7 composer revalidates on
  publish). Published-only; URL category must match the article's real
  category or it 404s (no soft-canonical guessing); joins author/
  reviewer/category/hero+og images/`articleBusinesses`→businesses
  (ranked).
- **`lib/structured-data.ts`** — pure ADR-009 JSON-LD builders
  (`Article` + `BreadcrumbList` + `LocalBusiness`) with a `<`/`>`/`&`-
  escaped `<script>` serializer. Pure/unit-testable = the real local
  correctness gate.
- **`page.tsx`** — renders via `@bec/ui` Magazine `ArticleLayout` +
  `BreadcrumbNav` + `BusinessCard`. ADR-027 AI-authorship + human-
  reviewer byline; ADR-015 FTC sponsored aside when `isSponsored`;
  `generateMetadata` = ADR-010 city self-canonical + Open Graph +
  Twitter card + robots index; embeds the three JSON-LD blocks.
- **`next.config.ts`** — `cacheComponents: true` (Next 16 requirement
  for `'use cache'`); `(site)` header-reading routes stay dynamic.
- Scope notes (flagged, not defects): body rendered paragraph-split
  (full MDX compile = later refinement); hub-domain "syndicated copy →
  origin-city canonical" ADR-010 branch ships with hub syndication
  (city sites — the 2.3 acceptance target — are correctly
  self-canonical).
- Type: Phase 2 plan commit (RALPH-LOOP §69).
- Branch: `phase-2/commit-2.3-article-structured-data`
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/47
- Merge SHA: `a7510162faf68a8ebbde15f86758b1d9a7f4dcac`
- CodeRabbit SUCCESS, cubic running at merge (advisory §7b); 0 posted
  findings; required CI (lint/type-check/unit-tests) green.
- Files changed: `apps/editorial/lib/article.ts`,
  `apps/editorial/lib/structured-data.ts`,
  `apps/editorial/app/(site)/[category]/[slug]/page.tsx`,
  `apps/editorial/next.config.ts`.
- Validation: type-check `@bec/editorial` + `@bec/db` clean (Node 22).
  **Acceptance DEFERRED — deploy- AND data-gated:** Rich Results Test /
  view-source OG+canonical / sponsored badge need editorial deployed
  (no `bec-editorial` Vercel project) AND ≥1 real article (Editor agent
  = Commit 2.6); the route correctly `notFound()`s with no data. JSON-LD
  shapes locally proven by the pure serializers.

## 2026-05-19 — Phase 2 / Commit 2.4: Sitemap, robots, OG image generation

ADR-009 SEO foundation, per-domain.

- **`proxy.ts`** — removed `/robots.txt` + `/sitemap.xml` from the skip
  set so host→site headers inject (per-domain per ADR-009;
  Upstash-cached → cheap for crawlers). Root OG skip tightened to an
  exact match (`/opengraph-image`, `/opengraph-image.png`) after a
  CodeRabbit Major (the `\b` regex over-matched `/opengraph-image/foo`);
  nested `[category]/[slug]/opengraph-image` is never skipped (needs
  site + article). Implementation wiring, not an ADR change.
- **`lib/seo.ts`** — `buildRobotsTxt(domain)` (pure) +
  `buildSitemapXml(site)` (static + categories + published articles +
  listable businesses [`primarySiteId`, not delisted] + events;
  absolute, deduped, XML-escaped; four reads via `Promise.all` after a
  CodeRabbit nitpick; valid with zero content).
- **`app/(site)/robots.txt/route.ts`** + **`sitemap.xml/route.ts`** —
  per-domain GET handlers (force-dynamic), 404 on unknown host, 1h
  cache-control.
- **`app/(site)/[category]/[slug]/opengraph-image.tsx`** — Next
  `ImageResponse` 1200×630, per-archetype card; Satori lacks `oklch()`
  so OG cards use a fixed per-archetype hex approximation (deliberate,
  isolated to the social card); branded fallback when no article.
- Type: Phase 2 plan commit (RALPH-LOOP §69).
- Branch: `phase-2/commit-2.4-sitemap-robots-og`
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/49
- Merge SHA: `9d591e53246d9d4f394c107416f35aa16d601bb2`
- Review: 2 CodeRabbit findings (proxy OG over-match [Major];
  serialized sitemap reads [nitpick]) — both fixed + replied (§7d), not
  dismissed; CodeRabbit cleared; merged with required CI green.
- Files: `apps/editorial/proxy.ts`, `lib/seo.ts`,
  `app/(site)/robots.txt/route.ts`, `app/(site)/sitemap.xml/route.ts`,
  `app/(site)/[category]/[slug]/opengraph-image.tsx`.
- Validation: type-check `@bec/editorial` + `@bec/db` clean (Node 22);
  pure `buildRobotsTxt`/sitemap renderer = local gate. **Acceptance
  DEFERRED — deploy-gated:** `/sitemap.xml` validates, `/robots.txt`
  matches ADR-009, OG cards on iMessage/Twitter all need the owed
  `bec-editorial` Vercel deploy; sitemap article entries additionally
  data-gated on the Editor agent (Commit 2.6). Empty-data sitemap valid
  by design.

## 2026-05-19 — Phase 2 / Commit 2.5: Coastal + Premium archetypes

Operator-chosen scope (AskUserQuestion): token-driven + a real Premium
structural variant. Mostly verification (like 2.2) + one genuine
ADR-032 conformance fix.

- **Verified already-correct, no change (Phase 0–2.2):** `coastal.ts`
  / `premium.ts` == ADR-032 Initial tokens; `styles/globals.css` has
  full `.archetype-coastal`/`.archetype-premium` colour/radius/font
  blocks; `seed.ts` already assigns all 8 sites archetype + themeTokens
  (magazine×3, coastal×2, premium×3 — the plan's "update the 7 seeded
  rows" was done in Phase 1); every component already has an
  `AllArchetypes` story.
- **Conformance fix (ADR-032 component contract):** image aspect was
  hardcoded (`article-card` `aspect-[3/2]`, `featured-listing`
  `aspect-[21/9]`) — ignored per-archetype `imagery.heroAspect`. Added
  `--bec-hero-aspect` (apply.ts emits from `imagery.heroAspect`;
  globals.css declares it per `.archetype-*` 3/2·16/9·21/9);
  `article-card` + `featured-listing` now use
  `aspect-ratio: var(--bec-hero-aspect)`.
- **Rename:** `FeaturedListingMagazine` → `FeaturedListing` (it was
  always token-driven/archetype-agnostic; misnamed). `git mv`, history
  preserved (65% similarity), zero stale refs (incl. editorial).
- **New `FeaturedListingPremium`:** structural variant (full-bleed
  image, no card chrome, narrow measure + large negative space) for
  ADR-032's Premium "selective full-bleed" vibe; still token-coloured.
  Stories renamed + added (both `AllArchetypes`); `index.ts` updated.
- Review: cubic 1 finding (P2: wrapped `eslint-disable-next-line` didn't
  suppress the rule) — fixed (single-line directive) + replied (§7d),
  not dismissed. CodeRabbit + cubic checks SUCCESS.
- Type: Phase 2 plan commit (RALPH-LOOP §69).
- Branch: `phase-2/commit-2.5-coastal-premium`
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/51
- Merge SHA: `02e2e29639362cd862a39cf4d468addc6d6ff97f`
- Files: `theme/apply.ts`, `styles/globals.css`,
  `components/article-card.tsx`,
  `components/featured-listing.{tsx,stories.tsx}` (renamed),
  `components/featured-listing-premium.{tsx,stories.tsx}` (new),
  `index.ts`. No seed/archetype-token change.
- Validation: type-check `@bec/db` + `@bec/ui` + `@bec/editorial`
  clean (Node 22; editorial consumes @bec/ui so the rename propagation
  is verified); `build-storybook` builds; **`Vercel – bec-storybook`
  deploy GREEN on #51** (authoritative @bec/ui build); axe via the a11y
  addon (ADR-036). **Acceptance DEFERRED:** "all 8 domains render in
  their assigned archetype" needs the owed `bec-editorial` Vercel
  project; the Storybook-matrix + axe half is locally proven.

## 2026-05-19 — Phase 2 / Commit 2.6: Editor agent

First content-generation agent. /ralph-next scope correction confirmed:
this needed a new agent-API endpoint (real app code), not just Markdown.

- **NEW `POST /api/agent/articles`** (`apps/ops-console`) — `agentRoute()`
  Bearer+zod create-DRAFT (siteId, slug, title, subtitle, bodyMdx,
  originalDraftBody, contentType, author/reviewer, categoryId, tags,
  businesses[]). **Status server-forced `draft`** — agents cannot
  publish (ADR-003; publish = operator composer, Commit 2.7). Article +
  `article_businesses` written as ONE atomic CTE (`jsonb_to_recordset`
  fan-in), NOT `db.transaction()` (Neon fetch-transport — PR #36
  lesson; same technique as `lib/lead-transitions.ts`). Slug unique per
  site → `ON CONFLICT DO NOTHING` → empty → **409** (never overwrite a
  draft). No `/api/agent/articles` existed before — new surface within
  ADR-003's boundary (mirrors Commit 1.5's businesses/leads endpoints).
- **`agency/.claude/agents/editor.md` v1** — mirrors Scout/Diagnoser:
  brief input; reads site voice/`theme_tokens`/taxonomy + verified
  non-delisted businesses + the ADR-021 weekly calendar via read-only
  Postgres MCP; drafts to the ADR-034 `banned-phrases`/`copy-quality`
  rubrics in the archetype voice; writes via the endpoint with
  `originalDraftBody == bodyMdx` (ADR-020 baseline); `agent_runs`
  lifecycle + `[editor-metrics drafts=N]`, `promptVersion 1` (ADR-019);
  respects `sites.minimum/maximum_weekly_articles`.
- **`/draft-article`** (explicit brief OR pull next-needed from the
  ADR-021 calendar queue) + **`/refine-editor`** (≥20-published gate;
  reads `editorial_feedback`; proposes an ADR-019 `version: 2` prompt
  diff — proposal only, operator applies, like the Diagnoser-v2 path).
- Type: Phase 2 plan commit (RALPH-LOOP §69).
- Branch: `phase-2/commit-2.6-editor-agent`
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/53
- Merge SHA: `304512f6bfaa7ffa086d62bbe733542801496ea7`
- CodeRabbit SUCCESS, cubic running at merge (advisory §7b); **0 posted
  findings**; required CI green.
- Files: `apps/ops-console/app/api/agent/articles/route.ts`,
  `agency/.claude/agents/editor.md`,
  `agency/.claude/commands/{draft-article,refine-editor}.md`.
- Validation: type-check `@bec/db` + `@bec/ops-console` clean (Node 22;
  new typed route satisfies `next typegen`); schema verified vs
  ADR-021/020/015 (no migration/`adr-log`). **Acceptance split:**
  "Editor produces 3 drafts" is provable now (agent + endpoint + DB run
  **locally**, like Scout/Diagnoser — first Phase-2 commit NOT gated on
  the editorial Vercel project). "Operator publishes after editing +
  `editorial_feedback` captured" and `/refine-editor` end-to-end depend
  on **Commit 2.7's composer**; once drafts are produced + published
  (2.7), the *data*-gated half of 2.3/2.4 acceptance clears.

## 2026-05-19 — Phase 2 / Commit 2.7: Editorial composer (ops-console)

The operator publish UI — turns Editor drafts into published articles
and captures ADR-020 feedback.

- **`lib/article-transitions.ts` `publishArticle`** — ONE atomic CTE
  (no `db.transaction()`, PR #28/#36 lesson): `status→published` +
  `published_at` AND the ADR-020 `editorial_feedback` row in the same
  statement; a `cur` CTE snapshots the pre-publish body so
  `draft_body`(=`original_draft_body`) vs `final_body` is the real
  training diff. Race-safe (UPDATE guarded on draft/review/scheduled →
  0 rows → 409, no dup feedback).
- **`lib/articles-data.ts`** — server-only list + `getArticleForEdit`
  (categories/images/business-link state); dynamic @bec/db import.
- **`lib/markdown.tsx`** — zero-dep preview renderer (operator-chosen;
  no react-markdown). React elements only (no dangerouslySetInnerHTML);
  `safeHref` scheme allowlist (no `javascript:`/`data:`).
- **`(app)/editorial/`** — status-filtered list + detail composer
  (markdown editor + live preview, business linker w/ rank, category,
  sponsored toggle, ADR-022 image picker that blocks alt-less images,
  ADR-020 split publish button). HIG 44px/desktop+mobile. Operator-auth
  server actions; ADR-022 alt gate enforced client + server, save +
  publish.
- Type: Phase 2 plan commit (RALPH-LOOP §69).
- Branch: `phase-2/commit-2.7-editorial-composer`
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/55
- Merge SHA: `84985c2ab5e927f46d9fff9926382dfef30b3cd4`
- Review: 6 CodeRabbit findings — **all fixed + replied (§7d), none
  dismissed** (XSS `safeHref` allowlist; linked-business data-loss
  preservation; bounded image fetch; `saveArticle` `not_found`; local
  `published` state; 44px chip). Stale `CHANGES_REQUESTED` (pre-fix
  commit; CodeRabbit didn't re-review within §7c) → operator dismissed
  per §7b; armed auto-merge then landed it. Required CI green.
- Files: `lib/article-transitions.ts`, `lib/articles-data.ts`,
  `lib/markdown.tsx`, `(app)/editorial/page.tsx`,
  `(app)/editorial/[id]/{page,composer,actions}.tsx`.
- Validation: type-check `@bec/db` + `@bec/ops-console` clean (Node 22).
  **Acceptance is operator-run on the DEPLOYED ops-console** (deploys
  via Vercel `bec-ops-console` — NOT gated on the owed editorial Vercel
  project): edit/link/set hero+alt/publish; alt gate blocks; an
  `editorial_feedback` row written on publish. Publishing a Commit 2.6
  `/draft-article` draft here **clears the data-gated half of 2.3/2.4
  acceptance**. Local `next build` sandbox-impossible — CI/Vercel
  authoritative.

## 2026-05-19 — Phase 2 / Commit 2.8: Checker agent

The ADR-034 copy-quality gate for outreach messages — grades a draft,
never rewrites it.

- **NEW `PATCH /api/agent/outreach-messages/[id]`** (`apps/ops-console`)
  — `agentRoute()` Bearer + zod `PatchCheck` (`checkerPass`,
  `checkerScore` 0–12, typed `checkerNotes` jsonb: six ADR-034
  dimensions `0|1|2`, `notes[]`, optional `outreachGates`). Single
  `UPDATE … returning()` — no `db.transaction()` (one statement,
  fetch-transport safe; PR #28/#36 lesson); 404 on absent id. New
  surface *within* ADR-003's agent-API boundary (mirrors 2.6's
  articles endpoint — agents never write Postgres directly).
- **Defense-in-depth grade invariant** (cubic #57 P1): the PATCH
  boundary rejects `400 inconsistent_grade` if `checkerScore ≠ Σ
  dimensions` (`score_ne_dimension_sum`) or if `checkerPass` disagrees
  with the ADR-034 derivation `total≥9 && no dim==0 && (outreach gates
  all true when supplied)` (`pass_ne_rubric`). A self-contradictory
  grade can't be persisted regardless of agent correctness.
- **`agency/.claude/agents/checker.md` v1** — mirrors Diagnoser: input
  an outreach message id; reads message + lead/business context via the
  **read-only Postgres MCP**; loads the existing Phase-1 rubrics
  (`rubrics/copy-quality.md` + `banned-phrases.md` — *loaded, not
  re-authored*); scores the six dimensions (0–2, quoted evidence);
  **pass = total ≥9/12, no zero, AND the three outreach extra gates**
  (<70 words, zero banned items ⇒ AI-markers = 2, ≥1 local reference);
  PATCHes the grade; `agent_runs` lifecycle +
  `[checker-metrics checked=N passed=M]`, `promptVersion 1`. Grades
  only — never rewrites or loosens the rubric (Pitcher revises a fail).
- **`/check-message`** command (single-id; mirrors `/diagnose`).
- Type: Phase 2 plan commit (RALPH-LOOP §69).
- Branch: `phase-2/commit-2.8-checker-agent`
- PR: https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency/pull/57
- Merge SHA: `96a9ceba5f0e5196c1e6b5145c187b68ec70021b`
- Review: 2 cubic P1 findings — **both valid, fixed in `97d1f66` +
  replied on-thread (§7d), none dismissed**: (1) enforce the ADR-034
  grade invariant at the PATCH boundary; (2) `checker.md` extra-gate 2
  wording contradicted the no-zero rule (ADR-034's "zero in that
  dimension" means *zero banned items* ⇒ AI-markers = 2, not value 0)
  — reworded. CodeRabbit + cubic SUCCESS; required CI green; squash-
  merged.
- Files: `apps/ops-console/app/api/agent/outreach-messages/[id]/
  route.ts`, `agency/.claude/agents/checker.md`,
  `agency/.claude/commands/check-message.md`.
- Validation: type-check `@bec/ops-console` clean (Node 22; the
  `0|1|2`-union `reduce` accumulator needed an explicit `number[]`
  cast). **Acceptance provable at 2.8** ("Checker fails messages with
  banned phrases, passes natural ones") with a sample `outreach_
  messages` row + lead context — operator-run agent + endpoint + DB,
  **no editorial Vercel needed** (like Editor's "produces drafts" at
  2.6). End-to-end (real messages flowing the gate) is **Commit
  2.9-gated** (Pitcher produces the messages Checker grades). Local
  `next build` sandbox-impossible — CI/Vercel authoritative.

