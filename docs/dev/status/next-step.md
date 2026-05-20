# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## ✅ Loop status: Phase 2 in progress — Commits 2.1–2.10 merged, 2.11 next

Phase 1 gate PASSED 2026-05-19 (17/17). Phase 2 merged to `main`:
**2.1** Editorial shell (#43 `29f2ba0`), **2.2** Theme + Magazine (#45
`2663d3d`), **2.3** Article + structured data (#47 `a751016`), **2.4**
Sitemap/robots/OG (#49 `9d591e5`), **2.5** Coastal + Premium (#51
`02e2e29`), **2.6** Editor agent (#53 `304512f`), **2.7** Editorial
composer (#55 `84985c2`), **2.8** Checker agent (#57 `96a9ceb`),
**2.9** Pitcher agent + Resend (#59 `8cc0bc4`), **2.10** Legal pages
+ cookie consent (#61 `2a7b004`) — see their `task-log.md` entries.
Loop advances to **Commit 2.11** (the final Phase-2 commit; gate
follows).

End-to-end outreach pipeline + ADR-014 compliance surface are now
code-complete: Scout → Diagnoser → drafting + Checker → Pitcher
(Resend, CAN-SPAM-compliant, race-safe daily cap), and every
editorial domain ships the 5 ADR-014 legal pages + cookie consent
+ AI-disclosure byline (the byline already render-correct since 2.3).

⚠️ **Working copy moved:** the loop now runs from
`~/dev/bestemeraldcoast-agency`. The original `~/Desktop/...` copy was
destroyed by iCloud "Desktop & Documents" eviction (git DB + files
zeroed) and is abandoned. Keep this repo OUT of iCloud-synced paths.

## Current Step

- **Phase 2 / Commit 2.11 — Rate limiting + Turnstile.** Read
  `MASTER-bec-project-plan.md` § Phase 2 / Commit 2.11 + **ADR-017**
  (rate limiting + anti-abuse), then run the loop normally
  (`/adr-plan` → execute → validate → `/ship-task`). Scope: Upstash
  Redis rate limits in `apps/editorial` and `apps/newsletter-public`
  per ADR-017's surface→limit table (newsletter signup 3/hr,
  contact form 5/24h, magic-link login 5/15min, outreach redirects
  100/min, agent API 60/min, public pages 1000/min); Cloudflare
  Turnstile on every newsletter-signup form + the contact form;
  server-side email validation (syntax + MX + disposable-email-domain
  blocklist) silent-reject style per ADR-017; Search Console
  verification TXT records for all 8 domains (tracked in
  `docs/runbooks/domain-setup.md`).
  - **Acceptance:** a burst of 10 signups from one IP returns 429;
    Turnstile renders on signup + contact forms; disposable emails
    are silently rejected (200 OK render, no DB write).
  - **Verify in /adr-plan, don't assume:** does `apps/newsletter-public`
    exist yet, or is it scaffolded by this commit? (Per the master
    plan it lands in Commit 3.2, so 2.11 wires the *editorial*
    rate-limits + a forward-compatible shared rate-limit util in
    `packages/config` or new `packages/rate-limit`, then 3.2 picks
    it up.) Confirm Upstash Redis is provisioned for editorial's
    Vercel env; `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
    may already be in `env.ts` from the 2.1 proxy.ts cache. Turnstile
    keys (`TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`) need adding
    to `env.ts` + `.env.example` + Vercel envs. The Search Console
    DNS step is operator work — surface as a runbook update + a
    deferred-acceptance note (same pattern as the editorial-Vercel
    deferral), don't block the commit on it.
  - **Operator follow-up tied to 2.9 (still open, doesn't block
    2.11):** before the first real `/pitch` send, set
    `OUTREACH_REPLY_TO` to a monitored inbox + `OUTREACH_POSTAL_ADDRESS`
    to the real mailing address (the server refuses to send via `412
    opt_out_misconfigured` until at least one of `OUTREACH_REPLY_TO`
    / `OUTREACH_UNSUBSCRIBE_EMAIL` / `OPERATOR_EMAIL` is set; CAN-SPAM
    also requires a real postal address).
- **Phase 2 quality gate (next after 2.11):** per ADR-035, the gate
  is acceptance criteria, not aspiration — 9 boxes including the
  external-validation requirement (≥1 reply within 7 days from 10
  real Pitcher sends), Lighthouse mobile ≥95 on a representative
  article page, axe-core 0 violations, and the editorial-Vercel
  deploy boxes deferred since 2.1. The gate runs after 2.11 merges.
- **Plan ref:** `MASTER-bec-project-plan.md` § Phase 2.
- **Build env note:** local sandbox cannot `next build` any app here
  (clean `main`/ops-console fails identically — React-19 RSC prerender
  `useContext`, both bundlers, Node 20 & 22). Local gate = `next typegen
  && tsc --noEmit` (use Node 22 via `nvm use 22`). CI/Vercel is the
  authoritative build.
- **Do NOT:** treat Phase 1 as reopenable; the gate is closed. Continue
  under the standard loop + git discipline (RALPH-LOOP §69).

## ⛳ Editorial deploy acceptance — DEFERRED (operator infra owed; blocks 2.1 + 2.2 + 2.3 + 2.10 live checks)

Commits 2.1–2.10 code merges, but their **deploy-time** acceptance
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

**Owed (operator):** create the `bec-editorial` Vercel project, attach
the 8 domains (`bestpensacola.com`, `bestfortwaltonbeach.com`,
`bestemeraldcoast.com`, `bestpensacolabeach.com`, `bestdestinfl.com`,
`bestsouthwalton.com`, `bestcr30a.com`, `best30a.life`), deploy off
`main`, then run + record these in the respective `task-log.md`
entries. Does not block continued Phase 2 code commits, but the
Phase-2 quality gate's "editorial app deployed at all 8 domains via
`proxy.ts`" + "at least 1 city site has 3 published articles, fully
rendered with structured data" + "Lighthouse mobile ≥95" + "axe-core
0 violations" boxes ARE blocked on this until the project exists.

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

## Handoff Notes

- Master ADR + master plan are source of truth. CodeRabbit-advisory
  standing; `RALPH-LOOP.md` §7b–7e (CodeRabbit/cubic state never blocks
  merge; required CI checks gate). During the Phase-1 close-out a stale
  CodeRabbit `CHANGES_REQUESTED` blocked auto-merge on #39 — resolved by
  fixing all findings then dismissing the obsolete verdict per §7b;
  sequence finding-fixes *before* dismissal/merge (auto-merge fires the
  instant a blocking review clears). Commit 2.10 saw the smooth path:
  zero posted findings, both AI reviewers skipped/neutral, required CI
  green, auto-merged at `2a7b004` immediately.
- Stray `agent_runs` row `2b1fe09f-…` was finalized `aborted` 2026-05-18.
- Operator's parked Phase-0 Storybook/Vercel WIP stays unstaged across
  branches (do not stage/commit it with loop work) — only relevant on
  the abandoned `~/Desktop/` clone; the active `~/dev/` clone is
  clean.
