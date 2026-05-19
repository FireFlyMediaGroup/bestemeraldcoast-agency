# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## ✅ Loop status: Phase 2 in progress — Commits 2.1–2.8 merged, 2.9 next

Phase 1 gate PASSED 2026-05-19 (17/17). Phase 2 merged to `main`:
**2.1** Editorial shell (#43 `29f2ba0`), **2.2** Theme + Magazine (#45
`2663d3d`), **2.3** Article + structured data (#47 `a751016`), **2.4**
Sitemap/robots/OG (#49 `9d591e5`), **2.5** Coastal + Premium (#51
`02e2e29`), **2.6** Editor agent (#53 `304512f`), **2.7** Editorial
composer (#55 `84985c2`), **2.8** Checker agent (#57 `96a9ceb`) — see
their `task-log.md` entries. Loop advances to **Commit 2.9**.

End-to-end editorial path is code-complete (Editor `/draft-article` →
composer review/edit → publish + ADR-020 feedback). The outreach
quality gate is now in place: Checker grades drafts against ADR-034
(≥9/12, no zero, three outreach extra gates) and PATCHes the verdict;
the PATCH boundary itself rejects self-contradictory grades. Pitcher
(2.9) is the producer/sender that closes the outreach loop.

⚠️ **Working copy moved:** the loop now runs from
`~/dev/bestemeraldcoast-agency`. The original `~/Desktop/...` copy was
destroyed by iCloud "Desktop & Documents" eviction (git DB + files
zeroed) and is abandoned. Keep this repo OUT of iCloud-synced paths.

## Current Step

- **Phase 2 / Commit 2.9 — Pitcher agent + Resend integration.** Read
  `MASTER-bec-project-plan.md` § Phase 2 / Commit 2.9 + ADR-015 (FTC
  sponsored disclosure) / ADR-032 (3 archetype voices), then run the
  loop normally (`/adr-plan` → execute → validate → `/ship-task`).
  Scope: `packages/email/templates/outreach.tsx` (React Email — three
  variants matching the three archetypes' voice); `agency/.claude/
  agents/pitcher.md` v1 — input a **Checker-passed** outreach message;
  pick channel from `contactChannels` priority; render template; send
  via Resend; write `outreachMessages.sentAt` + `sentMessageId`; attach
  a tracking code; `agent_runs` lifecycle; **daily cap 30**. Slash
  commands `/pitch [outreach_id]` + `/pitch-batch`.
  - **Acceptance:** Pitcher sends to a test inbox; tracking code embeds
    in links; daily cap enforced.
  - **Verify in /adr-plan, don't assume:** does a `packages/email`
    workspace exist yet (React Email + Resend SDK deps)? Are
    `outreach_messages.sent_at` / `sent_message_id` / tracking-code
    columns in the `@bec/db` schema (the `checker_*` columns were
    already present at 2.8)? Is `RESEND_API_KEY` an existing env var
    (`.env.example`)? A new package or new schema columns that change a
    decision → STOP → adr-log before coding. Pitcher **writes via the
    agent API** (new/existing `PATCH /api/agent/outreach-messages/[id]`
    for `sentAt`/`sentMessageId`) and reads via the read-only Postgres
    MCP (ADR-003), mirroring Scout/Diagnoser/Editor/Checker. The send
    side-effect (Resend) is the one external action — keep it behind the
    daily cap and the Checker-passed precondition.
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
