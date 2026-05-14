# Storybook deployment runbook

**Scope**: One-time operator setup to satisfy Phase 0 / Commit 0.5's acceptance line "Deployed Storybook is reachable with password."

**Prerequisite**: Vercel Pro account active (Hobby plan does not allow custom domains for commercial use).

**Outcome**: `bec-storybook` Vercel project deployed from the monorepo with `ui.bestemeraldcoast.com` attached and gated behind a shared HTTP Basic Auth password.

> **Why Basic Auth, not Vercel's "Password Protection" toggle?**
> Vercel's native Password Protection is restricted to the Enterprise plan or the Advanced Deployment Protection add-on (~$150/mo on Pro), which the BEC plan does not include. The Pro dashboard's Deployment Protection panel only offers *Vercel Authentication* (SSO via Vercel team membership) on the free tier. To match the master plan's "password protection" intent — a single shared password the operator can hand to contractors and designers without inviting them to the Vercel team — we ship an HTTP Basic Auth Edge Middleware at `packages/ui/middleware.ts`. Same user experience (browser prompts for password), $0 cost. See the project-plan amendment in `docs/dev/MASTER-bec-project-plan.md` § Commit 0.5 for the audit trail.

---

## 1. Create the Vercel project

1. Vercel dashboard → **Add New… → Project** → import the `FireFlyMediaGroup/bestemeraldcoast-agency` repo.
2. Project name: `bec-storybook`.
3. **Framework Preset**: *Other*.
4. **Root Directory**: `packages/ui` (use the *Edit* button — Vercel defaults to repo root). This is required so Vercel finds `packages/ui/middleware.ts` and `packages/ui/vercel.json`.
5. Leave Build/Install/Output commands empty — they come from `packages/ui/vercel.json` (which already runs Turbo from the repo root).
6. **Environment Variables**: see step 3 below — set them before the first deploy or the production build will return 503 "Storybook auth not configured" by design.
7. Click **Deploy**. First build takes 3–5 min while Storybook 8 + Vite + Tailwind v4 install.

## 2. Attach the custom domain

1. Project → **Settings → Domains** → **Add Domain** → `ui.bestemeraldcoast.com`.
2. Vercel will tell you which CNAME / A records to add at the registrar managing `bestemeraldcoast.com`. Add them; wait for DNS propagation (typically <10 min on Cloudflare / Namecheap).
3. Domain status flips to *Valid Configuration* once DNS resolves.

## 3. Password protection (Basic Auth Edge Middleware)

The middleware at `packages/ui/middleware.ts` reads two env vars at the edge and gates every non-static request. Set both before the first deploy:

1. Project → **Settings → Environment Variables** → add two variables, both available to **Production** and **Preview**:
   - `STORYBOOK_BASIC_AUTH_USER` — e.g. `bec` or `viewer`. Just needs to be non-empty and stable.
   - `STORYBOOK_BASIC_AUTH_PASSWORD` — a strong shared password. Generate with `openssl rand -base64 24`.
2. Store both values in 1Password under the `BEC-Production` vault. Item: `Storybook deploy password`. Fields:
   - `username` = the value of `STORYBOOK_BASIC_AUTH_USER`.
   - `password` = the value of `STORYBOOK_BASIC_AUTH_PASSWORD`.
   - `url` = `https://ui.bestemeraldcoast.com`.
   - Notes: cross-reference back to this runbook + `docs/runbooks/secrets-setup.md`.
3. Trigger a redeploy (Vercel → Deployments → latest → … → Redeploy) so the new env vars take effect.

**Why fail-closed:** if either env var is missing the middleware returns 503 instead of bypassing. This prevents a deploy that lost its env config from accidentally exposing the design system.

### Rotation

To rotate the password (e.g. after a contractor leaves):

1. Generate a fresh value (`openssl rand -base64 24`).
2. Update 1Password (`BEC-Production` → `Storybook deploy password` → `password`).
3. Update Vercel: Project → **Settings → Environment Variables** → edit `STORYBOOK_BASIC_AUTH_PASSWORD` → paste new value → save.
4. Trigger a redeploy. Old sessions / cached browser auth dialogs continue to work for the duration of the previously-issued response; the next page load will demand the new password.

## 4. Verify acceptance

1. From a fresh browser session (incognito or signed-out), open `https://ui.bestemeraldcoast.com`.
2. Browser's HTTP Basic Auth dialog appears. Enter the username + password from 1Password.
3. Storybook UI loads. Confirm:
   - The Button story renders.
   - The toolbar **Archetype** dropdown swaps among `magazine` / `coastal` / `premium`.
   - The **a11y** addon panel shows zero serious/critical violations on the Button.
4. Confirm the gate works: try an incorrect password — browser should re-prompt; try cancelling — browser should show 401.
5. Record the production URL + 1Password item reference on the Commit 0.5 task-log entry (or, for the Phase 0 gate PR, on the `Box 6` evidence line).

## 5. Rollback / disable

- **Take it offline**: Project → **Settings → General → Pause Project**. The domain returns 503 until unpaused; env vars remain configured.
- **Remove the password gate**: Project → **Settings → Environment Variables** → delete both `STORYBOOK_BASIC_AUTH_*` vars → redeploy. The middleware will then 503 on every request (fail closed). To make the site fully public, remove the middleware file (`packages/ui/middleware.ts`) on a follow-up branch — this is a code change and should go through PR.
- **Delete the project**: Project → **Settings → General → Delete Project**. DNS records survive on the registrar side; remove them separately if reusing the domain.

## Cross-references

- ADR-001 — Vercel for all hosting.
- ADR-032 — three archetypes + `SiteTheme` token contract (rendered in the toolbar dropdown).
- ADR-036 — WCAG 2.2 AA, verified in Storybook with `@storybook/addon-a11y`.
- ADR-037 — `packages/ui` shadcn-based structure.
- `packages/ui/vercel.json` — repo-side build/install commands consumed by this project.
- `packages/ui/middleware.ts` — the Basic Auth gate itself.
- `docs/dev/MASTER-bec-project-plan.md` § Commit 0.5 — amendment recording the Basic Auth substitution.
- `docs/runbooks/secrets-setup.md` — for the 1Password vault that stores the deploy password.
