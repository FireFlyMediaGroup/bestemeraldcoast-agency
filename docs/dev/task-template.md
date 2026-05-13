# Task Card Template

Use this template when a unit of work doesn't map cleanly to an existing Phase / Commit in the master plan (e.g., a remediation commit, a documentation update, a one-off operator task). For normal commits, the master plan **is** the task card — do not duplicate it.

---

## Task ID
`BEC-<YYYY-MM-DD>-<short-slug>`

Example: `BEC-2026-05-15-fix-scout-rate-limit`

## Title
One sentence. Imperative form. Names the outcome.

## Type
- [ ] Phase / Commit (already in master plan — use the master plan instead of this template)
- [ ] Remediation (a phase gate failure or post-incident fix)
- [ ] Docs update (ADR amendment, plan edit, loop-doc edit)
- [ ] Operator-only (manual work tracked but not implemented by Claude Code)
- [ ] Unscheduled (must be promoted into the master plan before it is allowed to ship)

## Objective
What is true after this task that wasn't true before? One paragraph.

## Source / Trigger
- Phase / Commit that this is associated with (or "none")
- ADR(s) that motivate or constrain it
- Incident / log / PR comment that surfaced it (if applicable)

## Dependencies
- Other tasks that must complete first
- Files / systems that must be in a particular state

## Files in Scope
- Explicit list. The Executor agent does not touch files outside this list without amending the task.

## Acceptance Criteria
- One-line bullets. Each must be checkable.
- Mirror the style of the master plan's `**Acceptance**:` lines.

## Validation
- Reference the relevant items in `docs/dev/validation-checklist.md`.
- List any task-specific checks.

## Done Criteria
- All acceptance bullets checked.
- All validation passed.
- `task-log.md` entry written.
- `next-step.md` updated with the next commit.
- Any ADR or plan changes recorded in `adr-log.md`.

## Notes / Risks
Optional. Anything the next agent in the loop needs to know.
