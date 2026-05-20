# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## ✅ Loop status: Phase 2 in progress — Commits 2.1–2.9 merged, 2.10 next

Phase 1 gate PASSED 2026-05-19 (17/17). Phase 2 merged to `main`:
**2.1** Editorial shell (#43 `29f2ba0`), **2.2** Theme + Magazine (#45
`2663d3d`), **2.3** Article + structured data (#47 `a751016`), **2.4**
Sitemap/robots/OG (#49 `9d591e5`), **2.5** Coastal + Premium (#51
`02e2e29`), **2.6** Editor agent (#53 `304512f`), **2.7** Editorial
composer (#55 `84985c2`), **2.8** Checker agent (#57 `96a9ceb`),
**2.9** Pitcher agent + Resend (#59 `8cc0bc4`) — see their
`task-log.md` entries. Loop advances to **Commit 2.10**.

End-to-end outreach pipeline is now code-complete: Scout discovers →
Diagnoser diagnoses → (drafting + Checker grades against ADR-034) →
Pitcher sends via Resend with a CAN-SPAM-compliant template and a
race-safe daily cap (`pg_advisory_xact_lock`-serialized claim).
ADR-013 amended in `adr-log.md`: v1 sends From the already-verified
`noreply@ops.bestemeraldcoast.com` domain; dedicated `mail.` warm-up
deferred to ADR-013's existing Phase-6 reputation trigger.

⚠️ **Working copy moved:** the loop now runs from
`~/dev/bestemeraldcoast-agency`. The original `~/Desktop/...` copy was
destroyed by iCloud "Desktop & Documents" eviction (git DB + files
zeroed) and is abandoned. Keep this repo OUT of iCloud-synced paths.

## Current Step

- **Phase 2 / Commit 2.10 — Legal pages package + cookie consent.**
  Read `MASTER-bec-project-plan.md` § Phase 2 / Commit 2.10 +
  **ADR-014** (5 legal pages — Privacy / Terms / Advertiser Disclosure
  / Cookie Policy / Editorial Standards), then run the loop normally
  (`/adr-plan` → execute → validate → `/ship-task`). Scope: the five
  legal MDX pages in `packages/content/legal/` (rendered in editorial
  under `(legal)/`); a cookie-consent banner using
  `vanilla-cookieconsent` or PostHog's built-in (minimal banner for
  non-EU, full CMP for EU); the **AI-disclosure label** ("Drafted with
  AI assistance, edited by [Author]") on the article byline footer.
  - **Acceptance:** all 5 legal pages render on every domain; cookie
    consent works; AI disclosure visible.
  - **Verify in /adr-plan, don't assume:** does `packages/content`
    exist? If not, this commit creates it as a workspace package. The
    AI-disclosure label needs an `articles` column to flag AI
    authorship — ADR-027 (AI-authorship byline) — check whether the
    `articles` schema already has `is_ai_authored` / `editor_name`
    or whether this commit needs a tiny migration. Cookie-consent
    library choice (`vanilla-cookieconsent` vs PostHog) is a code
    pick, not an ADR change; surface as an `AskUserQuestion` if both
    look viable. Heads-up: ADR-014 specifies "Termly/Iubenda template,
    lawyer-reviewed once" for the content itself — for v1 ship
    operator-authored MDX placeholders that meet the structural
    requirements and flag the lawyer-review step as a deferred
    operator action (mirrors the "owed editorial Vercel" pattern).
  - **Operator follow-up tied to 2.9 (not blocking 2.10):** before the
    first real `/pitch` send, set `OUTREACH_REPLY_TO` to a monitored
    inbox + `OUTREACH_POSTAL_ADDRESS` to the real mailing address (the
    server refuses to send via `412 opt_out_misconfigured` until at
    least one of `OUTREACH_REPLY_TO` / `OUTREACH_UNSUBSCRIBE_EMAIL` /
    `OPERATOR_EMAIL` is set; CAN-SPAM also requires a real postal
    address). Documented in `.env.example` and the 2.9 task-log entry.
- **Plan ref:** `MASTER-bec-project-plan.md` § Phase 2.
- **Build env note:** local sandbox cannot `next build` any app here
  (clean `main`/ops-console fails identically — React-19 RSC prerender
  `useContext`, both bundlers, Node 20 & 22). Local gate = `next typegen
  && tsc --noEmit` (use Node 22 via `nvm use 22`). CI/Vercel is the
  authoritative build.
- **Do NOT:** treat Phase 1 as reopenable; the gate is closed. Continue
  under the standard loop + git discipline (RALPH-LOOP §69).

## ⛳ Editorial deploy acceptance — DEFERRED (operator infra owed; blocks 2.1 + 2.2 + 2.3 live checks)

Commits 2.1–2.3 code merges, but their **deploy-time** acceptance can't
run: there is no Vercel project for `apps/editorial` (no
`Vercel – bec-editorial` check), exactly like the Phase 1 ops-console
Vercel setup. Deferred acceptance, owed once the project exists:
- **Commit 2.1:** all 8 domains resolve to their site shell; unknown
  host → 404; Lighthouse mobile ≥95.
- **Commit 2.2:** Pensacola's homepage renders with the Magazine
  archetype (the Storybook half is already proven).
- **Commit 2.3+:** rich-results / OG / canonical checks.

**Owed (operator):** create the `bec-editorial` Vercel project, attach
the 8 domains (`bestpensacola.com`, `bestfortwaltonbeach.com`,
`bestemeraldcoast.com`, `bestpensacolabeach.com`, `bestdestinfl.com`,
`bestsouthwalton.com`, `bestcr30a.com`, `best30a.life`), deploy off
`main`, then run + record these in the respective `task-log.md`
entries. Does not block continued Phase 2 code commits.

## Open carry-over items (not gate blockers)

- 🔴 **Security: rotate the Neon `neondb_owner` password.** A shell `.env`
  sourcing during Commit 1.4 DB verification echoed the connection
  string. Rotate in Neon → update `.env` (`DATABASE_URL` +
  `DATABASE_URL_UNPOOLED`) → update the `BEC-Production` 1Password item.
  Neon was *reconfigured* 2026-05-18 during the deploy fix — operator to
  confirm whether that already rotated the credential (closes this) or if
  the rotation is still outstanding. Carry into early Phase 2.
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
  instant a blocking review clears).
- Stray `agent_runs` row `2b1fe09f-…` was finalized `aborted` 2026-05-18.
- Operator's parked Phase-0 Storybook/Vercel WIP stays unstaged across
  branches (do not stage/commit it with loop work).
