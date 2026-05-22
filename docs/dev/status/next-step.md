# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## ✅ Loop status: Phase 2 code-complete — Commits 2.1–2.11 + pre-gate fixes 2.11.1–2.11.3 merged; Phase 2 gate (ADR-035) in progress

Phase 1 gate PASSED 2026-05-19 (17/17). Phase 2 merged to `main`:
**2.1** Editorial shell (#43 `29f2ba0`), **2.2** Theme + Magazine (#45
`2663d3d`), **2.3** Article + structured data (#47 `a751016`), **2.4**
Sitemap/robots/OG (#49 `9d591e5`), **2.5** Coastal + Premium (#51
`02e2e29`), **2.6** Editor agent (#53 `304512f`), **2.7** Editorial
composer (#55 `84985c2`), **2.8** Checker agent (#57 `96a9ceb`),
**2.9** Pitcher agent + Resend (#59 `8cc0bc4`), **2.10** Legal pages
+ cookie consent (#61 `2a7b004`), **2.11** Rate limiting + Turnstile
(#63 `426d09d`), **2.11.1** @bec/config quote-stripping pre-gate fix
(#65 `5795249`), **2.11.3** RateLimit-* headers on every response
(#67 `744b58c`), **2.11.2** Playwright E2E surface (#68 `bbf731b`)
— see their `task-log.md` entries. Loop advances to the **Phase 2
quality gate (ADR-035)**, currently mid-execution.

### Phase 2 gate run-state (2026-05-22, post-2.11.2/3)

Operator's progress on Phase A-C of the 2.11 unblock list:
- ✅ ops-console Vercel Build Command realigned (`vercel.json` files
  added under operator's WIP).
- ✅ Upstash Redis + Cloudflare Turnstile creds provisioned + set on
  Vercel projects.
- ✅ `bec-editorial` Vercel project created + 6/8 domains attached
  + serving HTTP 200 (live via proxy.ts host resolve).
- ⏳ 2/8 domains (`bestcr30a.com`, `best30a.life`) still on parking
  IPs.

Boxes attempted:
- **Box 1 — Checker rubric**: ⚠️ NOT EXERCISABLE. Zero
  `outreach_messages` rows; zero `articles`. Pipeline upstream-
  blocked — Editor + composer have produced nothing to score yet.
- **Box 5 — Editorial 8 domains via proxy.ts**: 🟡 **partial.** 6/8
  domains live + serving (proxy.ts host-resolve + archetype routing
  + unknown-host 404 contract all verified via Playwright). The
  remaining 2 are operator DNS work. **Plus** a newly-surfaced
  blocker: current `main` editorial app **cannot build on Vercel**
  due to a pre-existing 2.10 route-ambiguity bug — see the dedicated
  section below. The 6 live domains are serving from a stale pre-
  2.10 successful deploy.
- **Box 8 — Unit + Playwright tests**: ✅ **GREEN (when invoked).**
  Unit-test surface clean since 2.11.1 (15/15 packages, exit 0).
  Playwright surface clean post-2.11.2 (`pnpm --filter @bec/editorial
  test:e2e` → 12 passed / 0 failed / 8 graceful skips on live
  deploys). CI integration of the E2E job is queued but not blocking
  — gate satisfied by on-demand invocation per ADR-035 ("acceptance,
  not aspiration").
- Boxes 2, 3, 4, 6, 7, 9 — all operator-infra-blocked.

End-to-end outreach pipeline + ADR-014 compliance surface + ADR-017
anti-abuse infrastructure are now code-complete: Scout → Diagnoser →
drafting + Checker → Pitcher (Resend, CAN-SPAM-compliant, race-safe
daily cap); every editorial domain ships the 5 ADR-014 legal pages +
cookie consent + AI-disclosure byline; `@bec/rate-limit` exposes all
six ADR-017 surface limiters + Turnstile + silent-reject email
validation, with `apps/editorial/proxy.ts` running the
`publicPages` (1000/IP/min) DDoS guard before host resolution.

⚠️ **Working copy moved:** the loop now runs from
`~/dev/bestemeraldcoast-agency`. The original `~/Desktop/...` copy was
destroyed by iCloud "Desktop & Documents" eviction (git DB + files
zeroed) and is abandoned. Keep this repo OUT of iCloud-synced paths.

## Current Step

- **Phase 2 quality gate (ADR-035) — in progress.** Three pre-gate
  commits already moved boxes: 2.11.1 cleared the unit-test clause of
  Box 8, 2.11.3 made the publicPages limiter single-curl-observable,
  2.11.2 landed the minimum Playwright surface (Box 8 fully green).
- **🚨 NEXT LOOP-ACTIONABLE BLOCKER: the editorial deploy is broken
  on `main`** due to a pre-existing 2.10 route ambiguity (`/[page]`
  in `(legal)/` collides with `/[category]` in `(site)/`). See the
  dedicated section below. Operator's stashed local WIP is the
  intended fix; needs to be committed as Commit 2.11.4. Until then,
  Box 5 stays 🟡 and Boxes 6 / 7 / 9 remain blocked downstream.
- **Concurrent operator work** unblocks Boxes 2-7 + 9 (see follow-ups
  below). All remaining 9-box gate work per
  `MASTER-bec-project-plan.md` § Phase 2 quality gate.

## 🚨 NEW BLOCKER (2026-05-22): editorial Vercel deploy fails on `main` (ambiguous app routes)

`bec-editorial` Vercel deploys of `bbf731b` (and every commit since
2.10 merged on 2026-05-20) fail at:

```
Error: Ambiguous app routes detected:
Ambiguous route pattern "/[*]" matches multiple routes:
  - /[page]     (apps/editorial/app/(legal)/[page]/page.tsx, Commit 2.10)
  - /[category] (apps/editorial/app/(site)/[category]/page.tsx, Commit 2.4)
```

Cause: Commit 2.1 shipped placeholder static legal pages at
`(site)/(legal)/{privacy,terms,disclosure,cookies,editorial-
standards}/page.tsx`, intending 2.10 to "swap the body for MDX
without changing the routes" (per the Commit 2.1 `legal-
placeholder.tsx` header comment). Commit 2.10 instead added a NEW
dynamic route at `(legal)/[page]/page.tsx` under a different route
group, leaving the 2.1 stubs in place. Both groups resolve to
`/privacy`, `/terms`, etc. at the same URL level — Next 16.2.6's
ambiguous-route detector (correctly) refuses to build.

This is **not** introduced by 2.11.x — `git log` confirms the conflict
has been latent since 2.10. It was masked because no `bec-editorial`
Vercel project existed yet; the project was created today during the
2.11 unblock, and the first build attempt surfaced it. The currently-
live 6/8 domains are serving from a stale pre-2.10 successful deploy.

**Fix (operator-aligned, queued)**: the operator's stashed local WIP
(`stash@{0}: On phase-2/commit-2.11.3-ratelimit-headers: operator-
wip-vercel-json-legal-restructure`) deletes `(legal)/[page]/{page,
layout}.tsx` and re-implements the static legal pages to source from
`@bec/content/legal/` directly via a new
`apps/editorial/components/legal-document.tsx`. That WIP is the
intended fix; the operator chose to either pop it and commit, or have
Claude ship a minimal equivalent.

**Until this lands**:
- `bec-editorial` deploys fail at "Creating an optimized production
  build" with the ambiguous-routes error.
- Box 5 ("Editorial app deployed at all 8 domains via proxy.ts")
  cannot be cleared on current `main`.
- Boxes 6 / 7 / 9 (downstream of Box 5) stay blocked.
- The 6 live domains continue to serve the stale pre-2.10 successful
  deploy, which means the live Phase 2.10 acceptance checks (legal
  pages render, cookie consent works, AI byline visible) cannot run
  against current code — Vercel is serving an older artifact.

Suggested next commit: `phase-2/commit-2.11.4-legal-route-restructure`.
  Boxes are acceptance criteria, not aspirations (ADR-035):
  - [ ] Checker runs all outputs through ADR-034 rubric.
  - [ ] Pitcher dispatches 10 real cold messages via Resend.
  - [ ] **External validation**: ≥1 reply within 7 days from those
        10 sends.
  - [ ] No reply contains "is this AI?".
  - [ ] Editorial app deployed at all 8 domains via `proxy.ts`.
  - [ ] At least 1 city site has 3 published articles, fully rendered
        with structured data.
  - [ ] Sitemap, robots, OG, JSON-LD all validate via Google Rich
        Results Test.
  - [ ] All Phase 2 unit + Playwright tests pass.
  - [ ] Lighthouse mobile score ≥ 95 on all four pillars for a
        representative article page.
  - [ ] axe-core finds 0 violations on home, article, business
        profile, signup pages.
  - **Blockers to surface up-front:** the four boxes that require the
    deployed `bec-editorial` Vercel project (domains attached,
    articles published with `reviewedById`, Lighthouse mobile ≥95,
    axe-core clean) are STILL blocked on operator infra — see
    §"Editorial deploy acceptance — DEFERRED" below. The Pitcher
    10-send + reply-rate boxes require `OUTREACH_REPLY_TO` and
    `OUTREACH_POSTAL_ADDRESS` set on the ops-console Vercel project
    (2.9 follow-up still open).
- **Plan ref:** `MASTER-bec-project-plan.md` § Phase 2 quality gate.
- **Build env note:** local sandbox cannot `next build` any app here
  (clean `main`/ops-console fails identically — React-19 RSC prerender
  `useContext`, both bundlers, Node 20 & 22). Local gate = `next typegen
  && tsc --noEmit` (use Node 22 via `nvm use 22`). CI/Vercel is the
  authoritative build.
- **Do NOT:** treat any prior phase as reopenable; gates are closed.
  Continue under the standard loop + git discipline (RALPH-LOOP §69).

## 🚨 Operator follow-up tied to 2.11 — Vercel `bec-ops-console` Build Command drift

The 2.11 PR (#63) merged with `Vercel – bec-ops-console` **red**. Cause:
the Vercel project's Build Command had drifted from the documented
`--filter=@bec/ops-console` (auto-pickup via turbo `^build`) to an
explicit `--filter=@bec/db --filter=@bec/config --filter=@bec/logger`
list. Adding `@bec/rate-limit` to ops-console's dep set silently broke
the explicit list (webpack: `Module not found: Can't resolve
'@bec/rate-limit'`).

**Fix** (operator, single click): Vercel → `bec-ops-console` → Settings
→ Build & Deployment → Build Command → replace with
`cd ../.. && pnpm turbo run build --filter=@bec/ops-console`. The
runbook (`docs/runbooks/ops-console-deploy.md` § Step 5) now carries a
warning so future workspace deps don't re-trigger this.

**Impact while unfixed:** every ops-console deploy off `main` fails the
same way. Required CI (lint/type-check/unit-tests) and the Phase-2 gate
boxes that don't need ops-console are unaffected. PR auto-merge is
unaffected (Vercel is advisory per RALPH-LOOP §7b–§7e).

## ⛳ Editorial deploy acceptance — DEFERRED (operator infra owed; blocks 2.1 + 2.2 + 2.3 + 2.10 + 2.11 live checks)

Commits 2.1–2.11 code merges, but their **deploy-time** acceptance
can't run: there is no Vercel project for `apps/editorial` (no
`Vercel – bec-editorial` check), exactly like the Phase 1 ops-console
Vercel setup. Deferred acceptance, owed once the project exists:
- **Commit 2.1:** all 8 domains resolve to their site shell; unknown
  host → 404; Lighthouse mobile ≥95.
- **Commit 2.2:** Pensacola's homepage renders with the Magazine
  archetype (the Storybook half is already proven).
- **Commit 2.3+:** rich-results / OG / canonical checks.
- **Commit 2.10:** all 5 legal pages render on every domain at
  `/{privacy,terms,advertiser-disclosure,cookie-policy,
  editorial-standards}` with the resolved archetype's chrome; cookie
  banner renders + the manage-preferences modal opens + accept/reject
  persists across reload; AI-disclosure byline visible on a published
  AI-authored article (data-gated — operator publishes a draft with
  `reviewedById` set).
- **Commit 2.11:** with Upstash creds set on the `bec-editorial`
  project, 1001 requests/IP/min returns 429 on the 1001st (the
  publicPages DDoS guard); the editorial `proxy.ts` continues to 404
  unknown hosts when the limiter is allowing. The newsletter-signup +
  contact-form / Turnstile / disposable-email acceptance boxes defer
  to Commit 3.3 (no `/api/subscribe` endpoint exists yet).

**Owed (operator):** create the `bec-editorial` Vercel project, attach
the 8 domains (`bestpensacola.com`, `bestfortwaltonbeach.com`,
`bestemeraldcoast.com`, `bestpensacolabeach.com`, `bestdestinfl.com`,
`bestsouthwalton.com`, `bestcr30a.com`, `best30a.life`), set
`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` +
`TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (production +
preview), deploy off `main`, then run + record these in the respective
`task-log.md` entries. New runbook covering this end-to-end:
`docs/runbooks/domain-setup.md`. Does not block continued code commits,
but the Phase-2 gate's "editorial app deployed at all 8 domains via
`proxy.ts`" + "at least 1 city site has 3 published articles, fully
rendered with structured data" + "Lighthouse mobile ≥95" + "axe-core
0 violations" boxes ARE blocked on this until the project exists.

## 🚨 Operator follow-up tied to 2.9 — outreach env still incomplete (blocks Pitcher gate boxes)

Before the first real `/pitch` send, set `OUTREACH_REPLY_TO` to a
monitored inbox + `OUTREACH_POSTAL_ADDRESS` to the real mailing
address. The server refuses to send via `412 opt_out_misconfigured`
until at least one of `OUTREACH_REPLY_TO` / `OUTREACH_UNSUBSCRIBE_EMAIL`
/ `OPERATOR_EMAIL` is set; CAN-SPAM also requires a real postal
address. **This directly blocks the Phase-2 gate's "Pitcher dispatches
10 real cold messages" + "≥1 reply within 7 days" boxes.**

## Open carry-over items (not gate blockers)

- 🔴 **Security: rotate the Neon `neondb_owner` password.** A shell `.env`
  sourcing during Commit 1.4 DB verification echoed the connection
  string. Rotate in Neon → update `.env` (`DATABASE_URL` +
  `DATABASE_URL_UNPOOLED`) → update the `BEC-Production` 1Password item.
  Neon was *reconfigured* 2026-05-18 during the deploy fix — operator to
  confirm whether that already rotated the credential (closes this) or if
  the rotation is still outstanding. Carry into Phase 2 gate prep.
- **Lawyer review of ADR-014 legal copy (Commit 2.10):** the 5
  legal pages ship with operator-authored placeholder content that
  meets ADR-014's structural requirements; a one-time lawyer
  review of the final copy (~$500–1000 per ADR-014's consequences
  section) is the next-step before any meaningful traffic.
- **ADR-019 quality watch:** box 15 passed at the **minimum bar (3/5)**.
  Legitimate pass, not a gate skip, but Diagnoser-prompt quality has no
  margin — a `version: 2` iteration (ADR-019 + adr-log note) is a
  worthwhile early-Phase-2 candidate, optional and not gate-required.
- **Pre-existing local test failure:** `pnpm --filter @bec/logger
  test:unit` fails on this developer machine with
  `EnvValidationError: B2_ENDPOINT: Invalid url` (env=development
  despite test-setup setting NODE_ENV=test). Reproduces on clean
  `main` — pre-existing, NOT introduced by any recent commit. CI runs
  with its own env and is clean. Worth investigating before the next
  packages-wide test sweep, but not gate-blocking.

## Handoff Notes

- Master ADR + master plan are source of truth. CodeRabbit-advisory
  standing; `RALPH-LOOP.md` §7b–7e (CodeRabbit/cubic state never blocks
  merge; required CI checks gate). Commit 2.11 saw the smooth path:
  zero posted CodeRabbit findings at merge, cubic + CodeRabbit pending
  but advisory, required CI green, auto-merged at `426d09d` instantly.
  Vercel `bec-ops-console` red but advisory — see operator follow-up
  above.
- Stray `agent_runs` row `2b1fe09f-…` was finalized `aborted` 2026-05-18.
- Operator's parked Phase-0 Storybook/Vercel WIP stays unstaged across
  branches (do not stage/commit it with loop work) — only relevant on
  the abandoned `~/Desktop/` clone; the active `~/dev/` clone is
  clean.
