# Storybook deployment runbook

**Scope**: One-time operator setup to satisfy Phase 0 / Commit 0.5's acceptance line "Deployed Storybook is reachable with password."

**Prerequisite**: Vercel Pro account active (Hobby plan cannot password-protect a custom domain).

**Outcome**: `bec-storybook` Vercel project deployed from the monorepo with `ui.bestemeraldcoast.com` attached and password-protected.

---

## 1. Create the Vercel project

1. Vercel dashboard → **Add New… → Project** → import the `FireFlyMediaGroup/bestemeraldcoast-agency` repo.
2. Project name: `bec-storybook`.
3. **Framework Preset**: *Other*.
4. **Root Directory**: `packages/ui` (use the *Edit* button — Vercel defaults to repo root).
5. Leave Build/Install/Output commands empty — they come from `packages/ui/vercel.json` (which already runs Turbo from the repo root).
6. **Environment Variables**: none for Storybook itself.
7. Click **Deploy**. First build takes 3–5 min while Storybook 8 + Vite + Tailwind v4 install.

## 2. Attach the custom domain

1. Project → **Settings → Domains** → **Add Domain** → `ui.bestemeraldcoast.com`.
2. Vercel will tell you which CNAME / A records to add at the registrar managing `bestemeraldcoast.com`. Add them; wait for DNS propagation (typically <10 min on Cloudflare / Namecheap).
3. Domain status flips to *Valid Configuration* once DNS resolves.

## 3. Enable password protection

1. Project → **Settings → Deployment Protection**.
2. Section **Password Protection** → toggle **On** for *Production deployments* (and *Preview* if you want both gated).
3. Set a password. Store it in 1Password under the `BEC-Production` vault (item: `Storybook deploy password`, fields: `password` + `url=https://ui.bestemeraldcoast.com`).
4. Save.

## 4. Verify acceptance

1. From a fresh browser session (incognito or signed-out), open `https://ui.bestemeraldcoast.com`.
2. Vercel's password prompt appears → enter the stored password.
3. Storybook UI loads. Confirm:
   - The Button story renders.
   - The toolbar **Archetype** dropdown swaps among `magazine` / `coastal` / `premium`.
   - The **a11y** addon panel shows zero serious/critical violations on the Button.
4. Record the production URL + password reference in `docs/dev/status/task-log.md` as evidence on Commit 0.5's entry.

## 5. Rollback / disable

- **Take it offline**: Project → **Settings → General → Pause Project**. The domain returns 503 until unpaused; password remains configured.
- **Remove password protection**: same path as step 3, toggle **Off**. Use only if you intentionally want the design system public (this is a temporary state — turn it back on or the gate the master plan called for is gone).
- **Delete the project**: Project → **Settings → General → Delete Project**. DNS records survive on the registrar side; remove them separately if reusing the domain.

## Cross-references

- ADR-001 — Vercel for all hosting.
- ADR-032 — three archetypes + `SiteTheme` token contract (rendered in the toolbar dropdown).
- ADR-036 — WCAG 2.2 AA, verified in Storybook with `@storybook/addon-a11y`.
- ADR-037 — `packages/ui` shadcn-based structure.
- `packages/ui/vercel.json` — repo-side build/install commands consumed by this project.
- `docs/runbooks/secrets-setup.md` — for the 1Password vault that stores the deploy password.
