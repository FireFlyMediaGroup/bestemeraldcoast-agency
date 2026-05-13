# ADR Amendment Log

Append-only log of amendments to `MASTER-bec-architecture-decisions.md`. Every change to that file — new ADR, status change, supersession, deprecation — gets an entry here **before** the change is made.

## Process
1. Identify the intended change.
2. Write a new entry in the **Entries** section below.
3. Apply the change to `MASTER-bec-architecture-decisions.md`.
4. If the change affects sequencing, update `MASTER-bec-project-plan.md`.
5. If the change affects the loop's operating rules, update `claude/CLAUDE.md` and/or `claude/RALPH-LOOP.md`.

## Entry Format
```
## YYYY-MM-DD — ADR-NNN — <Title>
- **Change type:** New | Status change | Supersession | Deprecation | Clarification
- **From → To:** <e.g., Accepted → Superseded by ADR-042>
- **Rationale:** <one short paragraph>
- **Triggered by:** Phase X / Commit X.Y, or operator decision, or post-incident review
- **Project-plan impact:** <list affected phases/commits, or "none">
- **Loop-doc impact:** <list affected files, or "none">
```

## Entries

## 2026-05-12 — Initial — Log file created
- **Change type:** Bookkeeping
- **From → To:** N/A → Active
- **Rationale:** Initialize the ADR amendment log alongside the Ralph loop scaffolding so any future ADR change has a recorded process.
- **Triggered by:** Ralph loop scaffold setup
- **Project-plan impact:** none
- **Loop-doc impact:** referenced from `claude/CLAUDE.md` § Non-Negotiables and `claude/RALPH-LOOP.md` § Failure Modes
