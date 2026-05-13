# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## Operator Pre-Flight

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency

**Credential procurement runbook:** [`docs/runbooks/secrets-setup.md`](../../runbooks/secrets-setup.md) — full 1Password vault setup, item template, per-phase credential checklist, and three options for getting values into local `.env` (manual copy / `op inject` / `op run`).

- [x] Create the GitHub repo, public visibility, default branch `main`.
- [x] Auto-merge + auto-delete head branches enabled.
- [x] CodeRabbit GitHub App installed; `.coderabbit.yaml` at repo root.
- [x] `gh auth status` shows ADMIN.
- [x] Initialize git + GitHub remote (Commit 0.1).
- [x] CodeRabbit has reviewed at least one PR.
- [x] **Pass 1 branch protection** applied.
- [x] **1Password vault `BEC-Production`** populated with Sentry × 3 DSNs + auth token + Axiom token + dataset (for Commit 0.4).
- [ ] **Vercel Pro account active** — required so Commit 0.5 can create the `bec-storybook` project, attach the `ui.bestemeraldcoast.com` custom domain, and turn on password protection (Vercel Hobby disallows commercial use + custom-domain password protection). Deferred from Commit 0.2 per the public-repo-hygiene PR; do this before opening 0.5's PR.
- [ ] **Pass 2 branch protection** — apply **after Commit 0.6** lands CI. Required status checks: CI job(s) + `CodeRabbit`. Check "Require branches to be up to date before merging".

## Current Step

- **Phase:** 0 — Workspace & Foundations
- **Commit:** 0.5 — Storybook scaffolding
- **Plan reference:** `docs/dev/MASTER-bec-project-plan.md` § Phase 0 → Commit 0.5
- **ADRs in scope:** ADR-032 (three archetypes + `SiteTheme` token contract), ADR-036 (a11y baseline — Storybook is where contrast is verified per-archetype with `@storybook/addon-a11y`), ADR-037 (`packages/ui` shadcn-based structure — Storybook lives alongside `components/primitives/`).
- **Status:** queued (branch `phase-0/commit-0.5-storybook-scaffolding` cut from `861983f`; no implementation work yet — only the post-merge bookkeeping for Commit 0.4 is on this branch so far).

## Commit Prompt (excerpt)

> Set up Storybook in `packages/ui` with the `@storybook/addon-a11y` addon, theme switcher (three archetypes per ADR-032), Tailwind v4 integration. Add a placeholder Button story rendered in all three archetypes. Configure deployment to a `bec-storybook` Vercel project at `ui.bestemeraldcoast.com` with password protection.

## Acceptance

Per `MASTER-bec-project-plan.md` § Commit 0.5:

- **Storybook runs locally** — `pnpm --filter @bec/ui storybook` boots, opens the Storybook UI in the browser, the Button story renders, the theme-switcher toolbar swaps among `magazine` / `coastal` / `premium` archetypes, and the a11y addon shows zero serious/critical violations on the Button at default props.
- **Deployed Storybook is reachable with password** — `bec-storybook` Vercel project deployed; `ui.bestemeraldcoast.com` resolves; password gate prompts; correct password renders the Button story matching local.

Inferred lower bars (carry the discipline from prior commits, not new requirements per the master plan):

- `pnpm turbo build lint type-check test:unit` stays green across the workspace.
- Theme-switcher implementation honors the `SiteTheme` token contract from ADR-032 — three archetypes, no hand-rolled colors.
- The a11y addon reports the Button at WCAG 2.2 AA (≥ 4.5:1 body, ≥ 3:1 interactive) on each archetype per ADR-036.

## Files Likely to Touch

- `packages/ui/.storybook/{main.ts,preview.ts,manager.ts}` — Storybook 8 config + Vite builder + a11y/theme decorators.
- `packages/ui/src/components/primitives/button.tsx` + `button.stories.tsx` (or equivalent layout under ADR-037's `components/primitives/`).
- `packages/ui/src/theme/{tokens.ts,archetypes/{magazine,coastal,premium}.ts,index.ts}` — `SiteTheme` type + three archetype token sets per ADR-032.
- `packages/ui/src/styles/{globals.css,tailwind.css}` — Tailwind v4 entry, CSS variables wired to theme tokens.
- `packages/ui/{tailwind.config.ts,postcss.config.cjs,package.json}` — real scripts replacing the current `(noop)` placeholders; `storybook` / `build-storybook` scripts added.
- Vercel deploy config — `apps/storybook-deploy/` or `packages/ui/vercel.json` (decide during implementation; project plan doesn't pin a layout). Password protection is configured in the Vercel dashboard, not in repo.
- `pnpm-lock.yaml` regeneration.
- Bookkeeping rolling forward (this branch): `docs/dev/status/task-log.md` (Commit 0.4 entry, already landed in this branch), `docs/dev/status/next-step.md` (this file).

## Validation

- `validation-checklist.md` § Always + § Foundations.
- `pnpm turbo build lint type-check test:unit` returns the new total green (Storybook adds build outputs but not Vitest cases unless interaction tests are added — none required by the master plan's Acceptance).
- Manual acceptance: `pnpm --filter @bec/ui storybook` runs locally; the deployed `ui.bestemeraldcoast.com` resolves and prompts for the password.

## Next Commit After This

- **Commit 0.6 — CI baseline.** `.github/workflows/ci.yml` running `pnpm install` + `turbo lint` + `turbo type-check` + `turbo test:unit` against a Neon ephemeral branch on every PR; pnpm + Turbo caching + Vercel Remote Cache integration. Acceptance: a throwaway PR runs CI in under 5 minutes.
- **Phase 0 quality gate (ADR-035) opens after Commit 0.6 merges:** the seven items in `MASTER-bec-project-plan.md` § "Phase 0 quality gate (ADR-035)" — repo structure, install/build, cloud accounts + 1Password, env validation loudness, Sentry error capture per app, Storybook deploys + renders, CI green on a no-op PR.

## Handoff Notes

- Master ADR and master plan are the source of truth. If anything in this file conflicts with them, trust the masters and re-derive the next step.
- This branch (`phase-0/commit-0.5-storybook-scaffolding`) was cut immediately after PR #5 merged so the post-merge bookkeeping for Commit 0.4 (task-log entry + this rewrite) can land in 0.5's PR per RALPH-LOOP § 7b post-Pass-1 write policy. Do **not** push this branch or open the PR until the Storybook implementation work is in.
- The master plan says "Tailwind v4 integration" — Tailwind 4 ships with a new CSS-first config + `@tailwindcss/vite` plugin. Pin to the latest 4.x at implementation time; ADR-032's `SiteTheme` tokens map cleanly onto Tailwind 4's `@theme` directive.
- Password protection on `ui.bestemeraldcoast.com` is Vercel Pro's "Password Protection" feature (Project → Settings → Deployment Protection → Password). Hobby plan cannot do this — that's why the Vercel Pro operator step gates the PR.
- `@sentry/nextjs` per-app init (the second half of Commit 0.4's master-plan prompt) remains deferred to **Commit 1.4** — the 3 apps are still empty placeholders.
- Phase 0 ends with the ADR-035 quality gate at `MASTER-bec-project-plan.md` § "Phase 0 quality gate (ADR-035)". Do not begin Phase 1 / Commit 1.1 until that gate is 100% green.
