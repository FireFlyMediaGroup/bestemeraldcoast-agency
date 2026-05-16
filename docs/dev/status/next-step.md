# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## 🔴 Security action (still open)

- **Rotate the Neon `neondb_owner` password.** A shell `.env` sourcing during the Commit 1.4 DB verification echoed the connection string into command output. Rotate in Neon → update `.env` (`DATABASE_URL` + `DATABASE_URL_UNPOOLED`) → update the `BEC-Production` 1Password item. Dev branch, low real-world risk, but rotate on principle.

## Operator Pre-Flight

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency
**Runbooks:** [`secrets-setup.md`](../../runbooks/secrets-setup.md) · [`storybook-deploy.md`](../../runbooks/storybook-deploy.md) · [`ops-console-deploy.md`](../../runbooks/ops-console-deploy.md)

- [x] Phase 0 ADR-035 gate passed; 1Password + Vercel Pro + Storybook + Neon/Turbo GH secrets done.
- [x] Commit 1.1/1.2 live-verified (db:migrate + db:seed ×2 against Neon dev branch).
- [x] **Pass-2 branch protection LIVE** — required checks `lint`/`type-check`/`unit-tests`, strict, 0 human approvals, `enforce_admins: false`. PRs #16 + #17 merged naturally under it.
- [x] **CodeRabbit advisory policy proven** — PR #17 merged cleanly with CodeRabbit rate-limited and no review posted; **zero operator decision required** (vs the manual gate-relaxations on #14/#15/#16). Policy working as intended.
- [ ] **Rotate Neon password** (security action above).
- [ ] **Deploy `bec-ops-console` to Vercel + verify Resend domain** — per `ops-console-deploy.md`. Unblocks the operator/device-gated acceptance for Commits 1.4 (iPhone login / magic-link e2e), 1.5 (agent API curl: 401 / 409 / 429), 1.6 (Leads view in mobile Safari), and 1.7 (Add-to-home-screen).
- [ ] **Provision Upstash Redis + set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`** in Vercel (and 1Password). Production anti-abuse on the agent API + magic-link route is OFF until set (dev/CI fail-open by design).
- [ ] **Add a 180×180 `apps/ops-console/app/apple-icon.png`** (Commit 1.7 follow-up). The PWA manifest + Android/Chrome icons ship as SVG; iOS Apple-touch-icon requires a raster PNG that can't be generated in-loop. Without it, the iOS home-screen glyph falls back to a page screenshot — Add-to-home-screen still works, the icon is just unbranded. Drop the PNG and it's auto-served by Next's `app/apple-icon.png` convention (no code change).
- [ ] (Optional, deferred) Promote `CodeRabbit` back to a Pass-2 required check **only if** its reliability/credit ceiling is fixed — one `gh api` call. Default posture is advisory; not blocking.

## Current Step

- **Phase:** 1 — Database, Ops Console, Lead Pipeline.
- **Commit:** **1.7 — Mobile `/m` route — basic shell** (this branch: `phase-1/commit-1.7-mobile-shell`).
- **Plan ref:** `MASTER-bec-project-plan.md` § Phase 1 → Commit 1.7.
- **ADRs:** ADR-036 + Apple HIG (44pt taps, safe-area `env()`, modal sheets for compose, dark default, dynamic type, `viewport-fit=cover`, `apple-mobile-web-app-capable`). No ADR text changes expected.
- **Status:** branch cut from `7bab3e1`; bookkeeping (this rewrite + the Commit 1.6 task-log entry) lands first, then the mobile shell.

## What Commit 1.7 must ship

Per master plan § Commit 1.7:

> Create `(app)/m/page.tsx` and the mobile route group. Bottom navigation (5 icons: Home, Leads, Replies, Articles, Metrics). Each tab a placeholder screen. Apply every Apple HIG principle: 44pt taps, safe-area insets via `env()`, modal sheets for compose, dark default, dynamic type honoring iOS settings, `viewport-fit=cover`, `apple-mobile-web-app-capable`. Add `manifest.json` for add-to-home-screen.

**Acceptance**: Add-to-home-screen works on iPhone. App-like behavior — no Safari chrome when launched from icon. All five tabs reachable.

Implementation notes:
- The mobile shell lives under the existing `(app)` route group, so the `auth.ts` allow-list + the `(app)/layout.tsx` server guard already protect it — no new auth surface.
- Manifest via Next's metadata route (`app/manifest.ts` → `/manifest.webmanifest`, auto-linked by Next); `apple-mobile-web-app-capable` via `metadata.appleWebApp` in the root layout (`viewport-fit=cover` + theme color already set there since Commit 1.4).
- Bottom nav is a client component (active tab via `usePathname`); every tap target ≥ 44pt; nav padded with `env(safe-area-inset-bottom)` (the global body inset is already in `globals.css`).
- "Modal sheets for compose": include a reusable bottom-sheet primitive and wire a placeholder Compose action on the Replies tab to satisfy the HIG requirement.
- Acceptance is operator/device-gated (real iPhone Add-to-home-screen); the locally-provable parts are structure, all five routes resolving, manifest served, and type-check. `next build` stays Vercel-authoritative (OOM-bound locally).

## Next Commit After This

- **Phase 1 / Commit 1.8 — Agent runtime: Scout.**

## Handoff Notes

- Master ADR + master plan are source of truth. Loop-doc/bookkeeping changes are recorded in adr-log/task-log and renumber nothing.
- CodeRabbit-advisory is the standing policy — do not re-litigate the gate per-PR; follow `RALPH-LOOP.md` 7b–7e.
- `next build` remains Vercel-authoritative (OOM-bound locally); CI runs `lint`/`type-check`/`unit-tests` only; `type-check` is the load-bearing local gate.
- Operator's parked Phase-0 Storybook/Vercel WIP is still in the working tree across branches — keep it unstaged.
- Commits 1.4/1.5/1.6/1.7 device-gated acceptance all collapse onto the single `bec-ops-console` Vercel deploy in the pre-flight.
