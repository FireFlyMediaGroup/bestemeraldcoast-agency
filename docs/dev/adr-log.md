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

## 2026-05-16 — ADR-017 — Scoped exemption CLOSED: ops-console auth route now rate-limited (Commit 1.5)

- **Change type:** Clarification (the 2026-05-16 Commit-1.4 exemption is now lapsed/closed)
- **From → To:** Accepted, with Commit-1.4 exemption → Accepted, exemption discharged
- **Rationale:** Commit 1.5 builds the shared Upstash limiter (`apps/ops-console/lib/ratelimit.ts`, `@upstash/ratelimit` sliding window) and applies it across the agent API (60/key/min per ADR-017) AND the auth route's POST surface (magic-link: 5/15 min per ADR-017). The auth route is keyed by client IP rather than email — NextAuth's framework-owned catch-all owns the request body, so per-email keying would require consuming the stream NextAuth needs; IP is the faithful, framework-safe enforcement point for that surface. The earlier exemption's condition ("the exemption lapses when 1.5 lands") is satisfied. The limiter no-ops when Upstash env is absent (dev/CI), mirroring the @bec/logger Sentry/Axiom transport pattern; production must set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (operator pre-flight).
- **Triggered by:** Phase 1 / Commit 1.5 — Internal agent API
- **Project-plan impact:** none (1.5's "Rate-limit per ADR-017" requirement met for both the agent API and the retro-covered auth route)
- **Loop-doc impact:** none

## 2026-05-16 — ADR-035 — Loop-doc policy: CodeRabbit is advisory, not a merge gate

- **Change type:** Clarification (loop operating-rule change; no ADR text change — ADR-035 phase quality gates are unaffected)
- **From → To:** "Hard gate: CodeRabbit review state == APPROVED is a merge precondition" → "CodeRabbit is an advisory reviewer; its review *state* never blocks merge. The merge gate is: Pass-2 required CI checks (`lint`/`type-check`/`unit-tests`) green **and** cubic clean **and** every *posted* CodeRabbit/cubic finding triaged (fixed or replied-with-rationale)."
- **Rationale:** Operator decision. Across PRs #8/#9/#11/#15/#16 CodeRabbit repeatedly stalled (~12-min), hit credit/rate-limit ceilings, never re-reviewed pushed fixes, and re-flagged already-fixed code via stale incremental-diff anchoring. Treating its `APPROVED` state as a hard gate stalled the loop while providing no reliable quality signal, forcing repeated per-PR operator gate-relaxations (recorded on the Commit 1.4/1.5 task-log entries). Making it formally advisory removes the recurring decision while *retaining* the review value: every posted finding must still be fixed or answered, and cubic + the required CI checks remain hard gates. CodeRabbit can be promoted back to a required check via one `gh api` call if its reliability/credit problem is resolved. The discipline "never silently dismiss a posted finding; escalate genuine out-of-scope disputes via an adr-log amendment" is unchanged.
- **Triggered by:** Operator decision (post-PR-#16 merge) — "use code rabbit if available but it should not be a blocker"
- **Project-plan impact:** none (phase quality gates per ADR-035 unchanged; no commit reorders)
- **Loop-doc impact:** `claude/CLAUDE.md` § Non-Negotiables (lines 29–30 reworded); `claude/RALPH-LOOP.md` steps 7b/7c/7d/7e reworded (CodeRabbit poll is now best-effort with a 10-min proceed-anyway timeout; the pre-merge re-fetch checks CI/cubic/mergeable, not CodeRabbit review state)

## 2026-05-17 — ADR-016 — CI `type-check` now generates Next route types (typed-route gap closed)

- **Change type:** Clarification (CI verification surface widened; no ADR text change — ADR-016's "type-check passes" gate is unchanged in intent, made effective for Next App Router route handlers)
- **From → To:** ops-console `type-check` = `tsc --noEmit` (route-handler/route-path signature mismatches invisible — Next's `.next/types` typed-route constraints don't exist under a bare `tsc`, so they only fail in `next build`) → `type-check` = `next typegen && tsc --noEmit`, and the turbo `type-check` task `dependsOn` changed `["^type-check"]` → `["^build"]` so workspace deps' `dist/` exists for `next typegen`/`tsc` resolution.
- **Rationale:** A real defect (`apps/ops-console/lib/agent-handler.ts` hardcoded `RouteCtx = { params: Promise<{ id: string }> }` for *every* agent route) passed all CI gates (`lint`/`type-check`/`unit-tests` green) yet broke `next build` on Vercel for every non-dynamic route ("Property 'id' is missing in type '{}'"). CI structurally could not catch it because Next's per-route typed-handler constraints live in generated `.next/types/**`, absent under bare `tsc`. `next typegen` (Next 16.2.6: "generate route types without a full build") regenerates those types so the existing `type-check` job now fails on any route-handler signature that doesn't match its route's actual params. The `^build` dependency is required because `next typegen`/`tsc` must resolve `@bec/db`/`@bec/config`/`@bec/logger` via their runtime (`dist`) export condition — same reason the Vercel build command builds deps first.
- **Triggered by:** Operator decision — "use the loop and the proper CI pipeline" (off-plan task `task/2026-05-17-ops-console-route-types-ci-typegen`, gate-box-9 deploy-unblock remediation). Surfaced by the `bec-ops-console` Vercel deploy failing where CI was green.
- **Project-plan impact:** none (no commit reorders; Phase 1 gate status unchanged — this is gate-box-9 defect remediation, not gate progress).
- **Loop-doc impact:** none (no loop-operating-rule change; `validation-checklist.md` § Tests "`pnpm turbo test:unit` / type-check passes" is now genuinely Next-route-aware via the script change, no checklist edit needed).

## 2026-05-18 — ADR-038 — NEXTAUTH_URL dropped from production-required env (H1)

- **Change type:** Clarification (production-required env set narrowed by one var; no ADR-038 text change — env-validation discipline unchanged in intent)
- **From → To:** `productionRequired` in `packages/config/src/env.ts` included `NEXTAUTH_URL: z.string().url()` (forced + url-validated whenever env=production) → `NEXTAUTH_URL` removed from `productionRequired`; it remains `z.string().url().optional()` in the base schema (when set it must still be a valid URL; production no longer forces it).
- **Rationale:** Auth.js v5 with `trustHost: true` (`apps/ops-console/auth.config.ts`) derives the request origin from headers, so `NEXTAUTH_URL` is unnecessary on Vercel. Worse, a *required-but-malformed* value is an active footgun: an empty/garbage `NEXTAUTH_URL` made `@bec/config` reject the whole prod env AND made next-auth `new URL()` throw at the Edge — the root cause of the multi-day 2026-05-17/18 ops-console deploy incident. Making it optional removes a whole failure class and an unneeded operator step; the recommended posture is to leave it unset. `NEXTAUTH_SECRET` (Auth.js JWT signing) stays production-required — H1 does not touch it.
- **Triggered by:** Operator decision (post-deploy-incident hardening) — approved alongside the `enforce_admins: true` change, 2026-05-18. Off-plan task `task/2026-05-18-h1-nextauth-url-optional`.
- **Project-plan impact:** none (no commit reorders; Phase 1 gate status unchanged).
- **Loop-doc impact:** none. `env.test.ts` gains coverage (prod env without NEXTAUTH_URL parses; a set-but-malformed NEXTAUTH_URL still rejects via the base `url()`).
