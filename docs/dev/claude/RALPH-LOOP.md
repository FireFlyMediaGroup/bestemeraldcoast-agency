# Ralph Loop

The Ralph loop is the repeating execution cycle for bestemeraldcoast-agency. It moves Claude Code from one approved Phase / Commit to the next while keeping the master ADR and project plan as the constant reference.

## Loop State
The loop's state lives in two files inside `docs/dev/status/`:
- `next-step.md` — single handoff file; always describes the **next** commit to execute
- `task-log.md` — append-only log of completed commits with timestamps and acceptance evidence

**Read `next-step.md` first. Update it last.**

## Loop Order
1. **Read state.** `docs/dev/status/next-step.md` tells you the current Phase + Commit.
2. **Read constraints.** Skim `MASTER-bec-architecture-decisions.md` for the ADRs cited by this commit.
3. **Read intent.** Read the commit's prompt blockquote and `**Acceptance**:` line in `MASTER-bec-project-plan.md`.
4. **Plan.** Run `/adr-plan` → execution checklist.
5. **Execute.** Implement the smallest change that satisfies the acceptance criterion.
6. **Validate.** Run the commit's acceptance check + relevant items from `docs/dev/validation-checklist.md`.
7. **Ship.** Run `/ship-task` → append to `task-log.md`, write next handoff to `next-step.md`.
8. **Advance.** Run `/ralph-next` → confirm the next step is loaded and loop back to step 1.

## Loop Rule
Do not advance past step 6 without a passing acceptance check. A failed validation is not a "shipping problem" — it is the loop telling you the commit is not done.

## Phase-Gate Rule
The last action in any phase is the quality-gate run (per ADR-035). When the phase's checklist is 100% green, log the gate pass in `task-log.md` before the next phase's first commit becomes the next step. A failed gate item opens a remediation commit inside the current phase — it does not slip into the next phase.

## Next-File Rule
When a commit completes, update files in this order:
1. **ADR doc** — only if the commit changed a decision (rare; requires `adr-log.md` amendment first).
2. **Project plan** — only if commit ordering, scope, or acceptance criteria changed.
3. **CLAUDE.md** — only if the loop's operating rules changed.
4. **Commands or agents** — only if the loop behavior changed.
5. **Status files** — `next-step.md` and `task-log.md` always update.
6. **Implementation files** — already touched in step 5 of the loop; no extra writes here.

## Failure Modes
- **Stale `next-step.md`.** If it disagrees with `task-log.md`, trust `task-log.md` and re-derive the next commit from the master plan.
- **Acceptance unclear.** Pause the loop. Open an ADR amendment or a plan-edit task; do not improvise.
- **Phase gate fails.** Do not advance to the next phase. Open a remediation commit inside the current phase and re-run the gate.
- **Commit conflicts with an ADR.** Stop. Propose the amendment in `docs/dev/adr-log.md`. Resume only after the amendment is written and the project plan is reconciled.

## Agent Roles in the Loop
- **Planner** (`agents/planner.md`) — turns a Phase + Commit into a step-by-step execution checklist (loop step 4).
- **Executor** (`agents/executor.md`) — implements the checklist (loop step 5).
- **Validator** (`agents/validator.md`) — runs the acceptance check + validation checklist (loop step 6).
- **Reviewer** (`agents/reviewer.md`) — confirms ADR + plan alignment before `/ship-task` is allowed (gate before loop step 7).

---

## Git Discipline

Each Ralph commit ↔ one branch ↔ one PR ↔ one squash-merge to `main`. PRs are the vehicle for CI, history, and a recoverable diff — **not** a human-review gate. The Reviewer agent (loop step 6 / pre-ship) is the review gate. Auto-merge handles everything after CI passes.

### Bootstrap (Commit 0.1 only)
Until Commit 0.1 ships, there is no git repo. Commit 0.1 itself runs `git init`. The first time through the loop, steps 7–9 below execute *during* Commit 0.1's implementation rather than wrapping it.

Operator pre-flight (one-time, before Commit 0.1 starts):
- Create the GitHub repo `bestemeraldcoast-agency` (private).
- Repo Settings → General → enable **"Allow auto-merge"** and **"Automatically delete head branches"**.
- Install the **CodeRabbit GitHub App** on the repo (https://github.com/marketplace/coderabbitai). The `.coderabbit.yaml` at the repo root configures behavior.
- Repo Settings → Branches → add a protection rule for `main`:
  - Require status checks (the CI workflow added in Commit 0.6).
  - Require the **CodeRabbit** status check (appears in the dropdown after CodeRabbit posts its first review on a PR; add it once it appears).
  - Do **not** require approving reviews from humans (the Reviewer agent + CodeRabbit are the review gate).
  - Allow administrators to bypass during early Phase 0 if CI / CodeRabbit don't exist yet.
- Confirm `gh auth status` shows an authenticated user with repo write access.

### Per-Commit Git Flow

After bootstrap, every Ralph iteration runs git like this:

| Loop step | Git action |
|---|---|
| 1 — Read state | `git fetch origin && git checkout main && git pull --ff-only` |
| 2-3 — Read constraints + intent | (no git activity) |
| 4 — Plan (`/adr-plan`) | (no git activity) |
| 5 — Execute | `git checkout -b phase-<N>/commit-<N>.<M>-<slug>` then implement; commit incrementally on the branch |
| 6 — Validate | run acceptance + validation checklist locally before pushing |
| 7 — Push + open PR | `git push -u origin HEAD` then `gh pr create --title "Phase <N> / Commit <N>.<M>: <title>" --body "$(cat docs/dev/status/next-step.md)" --base main` |
| 7b — Merge gating (Pass-2 live, CodeRabbit advisory — amended 2026-05-16, adr-log) | Pass-2 branch protection enforces required checks `lint` + `type-check` + `unit-tests` (strict; 0 human approvals; `enforce_admins: false`). **`CodeRabbit` is deliberately NOT a required check.** Enable auto-merge immediately (`gh pr merge <PR> --auto --squash --delete-branch`); the required CI checks gate naturally. CodeRabbit + cubic run in parallel as **advisory** reviewers — their state never blocks merge |
| 7c — CodeRabbit review (advisory, best-effort) | Poll `gh pr view <PR> --json reviews --jq '.reviews \| map(select(.author.login == "coderabbitai")) \| last'` for a review object **at the current HEAD SHA**, up to a **10-min timeout**. CodeRabbit on this repo is unreliable (stalls, rate-limits, never-posts). Past the timeout, or on a rate-limit notice, **proceed without it** — do not loop waiting. One `@coderabbitai review` nudge is allowed; do not spin on repeated nudges |
| 7d — Triage AI-reviewer findings | Read findings via `gh api repos/FireFlyMediaGroup/bestemeraldcoast-agency/pulls/<N>/comments`. For each **posted** finding: **fix** (push to branch) or **reply with rationale** (`gh pr comment`). Never silently dismiss a posted finding. **CodeRabbit incremental-anchoring caveat:** it frequently re-flags already-fixed code at stale pre-fix line numbers across rounds — verify each finding against *current* code before acting; a verified-resolved re-flag is answered with a consolidated reply, not a re-fix. cubic findings are treated the same way. Neither reviewer's *state* gates merge (7b) — only that posted findings are addressed |
| 7e — Pre-merge re-fetch | **immediately before `gh pr merge`** re-fetch `gh pr view <PR> --json state,mergeable,statusCheckRollup` and confirm: `MERGEABLE`, required CI checks (`lint`/`type-check`/`unit-tests`) `SUCCESS`, cubic check not FAILURE, and every posted CodeRabbit/cubic finding triaged (7d). CodeRabbit review *state* is explicitly **not** checked here. If a reviewer insists on something genuinely out-of-scope, escalate via a `docs/dev/adr-log.md` amendment rather than silently overriding |
| 7f — Wait for merge | poll `gh pr view <PR> --json state,mergedAt,mergeCommit` until `state == "MERGED"`; capture `mergeCommit.oid` |
| 8 — Ship (`/ship-task`) | append entry to `task-log.md` with PR URL + merge SHA + CodeRabbit final state + comment-resolution count; rewrite `next-step.md` for the next commit. **Write path:** *pre-Pass-1 branch protection* — commit these two file edits directly on `main` and push (the bookkeeping is meta-loop machinery, not feature work). *Post-Pass-1 branch protection* — fold both writes into the next commit's PR alongside the prior commit's task-log entry (status files become part of the next branch's diff). The operator-only-commits exception (line 100) is unaffected: operators still update `task-log.md` and `next-step.md` directly |
| 9 — Advance (`/ralph-next`) | `git checkout main && git pull --ff-only` to land the squash-merge locally; loop back to step 1 |

### Branch Naming
- Format: `phase-<N>/commit-<N>.<M>-<short-kebab-slug>`
- Examples: `phase-0/commit-0.1-monorepo-skeleton`, `phase-1/commit-1.4-ops-console-auth`
- One branch per Ralph commit. No long-lived feature branches.

### Commit Message Format
- Subject: `Phase <N> / Commit <N>.<M>: <title>`
- Body: brief summary + the line `Closes phase-<N>/commit-<N>.<M>` for traceability.
- Multiple in-progress commits on a branch are fine; the squash-merge collapses them into one main-branch commit. Use the Ralph commit's title for the squash-merge subject (GitHub will offer this if the branch's first commit follows the format).

### Operator-Only Commits (e.g., 0.2)
Commits the master plan flags as manual operator work do **not** create a branch or PR. The operator updates `task-log.md` directly with a "Manual" entry (no SHA, no PR URL) and `next-step.md` advances normally.

### Off-Plan Task-Template Tasks
Work that doesn't map to a numbered Phase/Commit — runbooks, ad-hoc docs, remediation, operator workflows — uses the `docs/dev/task-template.md` framing. Branch naming convention: `task/<YYYY-MM-DD>-<short-kebab-slug>`. PR follows the standard flow (steps 7–9). `task-log.md` entry uses a date-stamped header `## YYYY-MM-DD — Task — <Title>` instead of the Phase/Commit format, and includes the same fields (Branch / PR / Merge SHA / CodeRabbit / Files changed / Notes) plus a `Type:` line identifying it as off-plan. Off-plan tasks do **not** appear in `MASTER-bec-project-plan.md` — the plan stays the architectural source of truth; the task log is the operational record.

### Phase Gate Commits
After the last commit of a phase merges, the loop opens a dedicated `phase-<N>/gate` branch that:
- Adds nothing implementation-wise.
- Updates `task-log.md` with the `PHASE <N> GATE PASSED` entry.
- Includes the filled-in ADR-035 checklist in the PR body as evidence.
- Squash-merges as `Phase <N> Gate: passed`.

### Failure Modes (git-specific)
- **CI fails on the PR.** Auto-merge stays parked. Fix on the same branch, push, CI re-runs, auto-merge proceeds. Do not open a new PR.
- **Local main has unmerged work.** Stop. The loop assumes `main` is clean before step 5. Investigate; do not stash + rebase blindly.
- **PR opened against the wrong base.** Close the PR (do not merge), check out a fresh branch from `main`, re-do steps 5–7. Do not rebase the broken branch onto `main` to "fix" it.
- **Auto-merge silently disabled.** If `gh pr view` shows `autoMergeRequest: null` after step 7b, the repo setting "Allow auto-merge" is off. Pause the loop, re-enable, re-run step 7b. Do not manually merge as a workaround — the discipline is that auto-merge is the only path to `main`.
- **CodeRabbit never reviews.** If step 7c times out (10 min, no review object): check the App is installed (`gh api repos/FireFlyMediaGroup/bestemeraldcoast-agency/installation` should show CodeRabbit) and `.coderabbit.yaml` is valid YAML. **Drafts work fine** — but with `auto_review.drafts: false` in `.coderabbit.yaml`, drafts only review when manually triggered (`gh pr comment <PR> --body "@coderabbitai review"`), and they need a re-trigger after each push. Do not bypass.
- **CodeRabbit's review is `CHANGES_REQUESTED` and the comment is wrong.** Reply via `gh pr comment` explaining the rationale. Then comment `@coderabbitai resolve` on the specific thread or `@coderabbitai review` to re-trigger. If CodeRabbit still requests changes after a clear rationale, the disagreement is real — do not override. Open an ADR amendment to capture the decision permanently, then revisit.
- **CodeRabbit comments multiplied across many push iterations.** That is the system working. Do not squash-rewrite the branch to "clean up" the comment thread before merge — squash-merge handles history collapsing automatically.
