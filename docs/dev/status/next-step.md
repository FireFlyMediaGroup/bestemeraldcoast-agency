# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## ✅ Loop status: Phase 2 in progress — Commits 2.1–2.6 merged, 2.7 next

Phase 1 gate PASSED 2026-05-19 (17/17). Phase 2 merged to `main`:
**2.1** Editorial shell (#43 `29f2ba0`), **2.2** Theme + Magazine (#45
`2663d3d`), **2.3** Article + structured data (#47 `a751016`), **2.4**
Sitemap/robots/OG (#49 `9d591e5`), **2.5** Coastal + Premium (#51
`02e2e29`), **2.6** Editor agent (#53 `304512f`) — see their
`task-log.md` entries. Loop advances to **Commit 2.7**.

⚠️ **Working copy moved:** the loop now runs from
`~/dev/bestemeraldcoast-agency`. The original `~/Desktop/...` copy was
destroyed by iCloud "Desktop & Documents" eviction (git DB + files
zeroed) and is abandoned. Keep this repo OUT of iCloud-synced paths.

## Current Step

- **Phase 2 / Commit 2.7 — Editorial composer (ops-console).** Read
  `MASTER-bec-project-plan.md` § Phase 2 / Commit 2.7 + the ADRs it
  cites (ADR-022 required alt-text, ADR-020 feedback on publish, ADR-029
  HIG mobile), then run the loop normally (`/adr-plan` → execute →
  validate → `/ship-task`). Build `apps/ops-console/(app)/editorial/`:
  list view (drafts/scheduled/published), detail view with markdown
  editor + live preview + business linker (search → `article_businesses`)
  + image picker with a **hard required-alt-text gate** (ADR-022) +
  category dropdown + sponsored toggle + a **split publish button**
  (`Publish` / `Publish + Note feedback` → writes an `editorial_feedback`
  row, ADR-020). HIG desktop + mobile.
  - **Why this is the highest-leverage next commit:** it's the
    operator UI that **completes Commit 2.6's deferred acceptance**
    (publish + feedback capture) and, fed by `/draft-article` drafts,
    produces the first *published* articles → **clears the data-gated
    half of 2.3/2.4 acceptance**. It's `apps/ops-console` (which already
    deploys), so it does **not** need the owed editorial Vercel project.
  - Note (ADR-003): publish is an operator action in this UI; it
    transitions `articles.status` and writes `editorial_feedback` —
    this is operator/ops-console code, not an agent path. Reuse the
    PR #36 atomic-CTE pattern (no `db.transaction()`) for the
    publish+feedback write if it spans tables.
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
