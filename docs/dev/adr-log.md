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

## 2026-05-16 — ADR-017 — Scoped exemption: ops-console auth catch-all route (Commit 1.4)
- **Change type:** Clarification (scoped, time-boxed exemption — no ADR text change)
- **From → To:** Accepted (unchanged) → Accepted, with a documented Commit-1.4 exemption for `apps/ops-console/app/api/auth/[...nextauth]/route.ts`
- **Rationale:** The `apps/**/api/**` coding guideline requires ADR-017 rate-limiting + Zod input validation + ADR-012 logging on every handler. Commit 1.4 satisfies the ADR-012 logging part (handler-boundary error capture via @bec/logger). The ADR-017 rate-limiter it mandates is Upstash-backed and **does not exist until Commit 1.5** ("Internal agent API … Rate-limit per ADR-017"), which builds the shared limiter to be applied uniformly across the agent API and this auth route — implementing a second, divergent limiter in 1.4 before that infra exists would be premature and is explicitly out of 1.4's master-plan scope. Per-route Zod validation is inapplicable to NextAuth's framework-owned catch-all (a single schema cannot span signin/callback/csrf/session/providers/signout without breaking Auth.js); the real authorization boundary for this route is the single-email allow-list in `auth.ts`'s `signIn` callback. This is the CLAUDE.md-sanctioned escalation (adr-log entry, not silent override) for a CodeRabbit finding that conflicts with the phased plan.
- **Triggered by:** Phase 1 / Commit 1.4 — CodeRabbit review of PR #15 (auth route hardening finding)
- **Project-plan impact:** Commit 1.5 must apply the Upstash ADR-017 limiter to `apps/ops-console/app/api/auth/[...nextauth]/route.ts` alongside the agent API (already in scope per 1.5's "Rate-limit per ADR-017"); the exemption lapses when 1.5 lands.
- **Loop-doc impact:** none
