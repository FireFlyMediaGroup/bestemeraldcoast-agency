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

<!-- The first real entry will be written by /ship-task after Commit 0.1 lands. -->

## Phase Gates

Each phase gate (per ADR-035) is a special entry:
```
## YYYY-MM-DD — PHASE X GATE PASSED
- Checklist: 100% green (link or paste of the checklist with all items checked)
- Next phase opens: Phase X+1 / Commit X+1.1
```

<!-- The first phase gate entry will land after all Phase 0 commits are shipped and the Phase 0 ADR-035 checklist is fully green. -->
