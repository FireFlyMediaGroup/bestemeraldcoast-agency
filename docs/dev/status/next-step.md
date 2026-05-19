# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## ✅ Loop status: Phase 2 in progress — Commit 2.1 merged, 2.2 next

Phase 1 gate PASSED 2026-05-19 (17/17; see `## 2026-05-19 — PHASE 1 GATE
PASSED` in `task-log.md`). **Phase 2 / Commit 2.1 (Editorial app shell
with `proxy.ts`) merged** to `main` `29f2ba0` (PR #43) — see its
`task-log.md` entry. Loop advances to **Commit 2.2**.

⚠️ **Working copy moved:** the loop now runs from
`~/dev/bestemeraldcoast-agency`. The original `~/Desktop/...` copy was
destroyed by iCloud "Desktop & Documents" eviction (git DB + files
zeroed) and is abandoned. Keep this repo OUT of iCloud-synced paths.

## Current Step

- **Phase 2 / Commit 2.2 — Theme system + Magazine archetype.** Read
  `MASTER-bec-project-plan.md` § Phase 2 / Commit 2.2 for the commit
  prompt + `**Acceptance**:` line and the ADRs it cites (esp. ADR-032
  theme token contract), then run the loop normally (`/adr-plan` →
  execute → validate → `/ship-task`). 2.2 is `packages/ui` work
  (`theme/tokens.ts`, `apply.ts`, `archetypes/magazine.ts`, Magazine
  components + Storybook, seed Pensacola with Magazine tokens) — it does
  NOT depend on the editorial deploy, so it proceeds in parallel with the
  Commit 2.1 acceptance infra below.
- **Plan ref:** `MASTER-bec-project-plan.md` § Phase 2.
- **Build env note:** local sandbox cannot `next build` any app here
  (clean `main`/ops-console fails identically — React-19 RSC prerender
  `useContext`, both bundlers, Node 20 & 22). Local gate = `next typegen
  && tsc --noEmit` (use Node 22 via `nvm use 22`). CI/Vercel is the
  authoritative build.
- **Do NOT:** treat Phase 1 as reopenable; the gate is closed. Continue
  under the standard loop + git discipline (RALPH-LOOP §69).

## ⛳ Commit 2.1 acceptance — DEFERRED (operator infra owed)

Commit 2.1 code is merged but its acceptance (all 8 domains resolve to
their site shell + Lighthouse mobile ≥95) is **not yet run** — there is
no Vercel project for `apps/editorial` (no `Vercel – bec-editorial`
check), exactly like the Phase 1 ops-console Vercel setup. **Owed:**
operator creates the `bec-editorial` Vercel project, attaches the 8
domains (`bestpensacola.com`, `bestfortwaltonbeach.com`,
`bestemeraldcoast.com`, `bestpensacolabeach.com`, `bestdestinfl.com`,
`bestsouthwalton.com`, `bestcr30a.com`, `best30a.life`), deploys off
`main`, then the Host-header routing + Lighthouse acceptance is run and
recorded in the Commit 2.1 `task-log.md` entry. This does not block
Commit 2.2.

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
