# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## Operator Pre-Flight

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency

- [x] Create the GitHub repo (exists — `FireFlyMediaGroup/bestemeraldcoast-agency`, **public** by intention, default branch `main`).
- [x] Visibility: **public** (operator decision; revisit before sensitive material lands).
- [x] Auto-merge enabled (`allow_auto_merge: true`).
- [x] Auto-delete head branches enabled (`delete_branch_on_merge: true`).
- [x] CodeRabbit GitHub App installed.
- [x] `.coderabbit.yaml` at repo root (landed in Commit 0.1).
- [x] `gh auth status` shows authenticated user `FireFlyMediaGroup` with ADMIN permission on the repo.
- [x] Initialize git and add the GitHub remote (done in Commit 0.1).
- [x] CodeRabbit has reviewed at least one PR (PR #1, Commit 0.1.5).
- [ ] **Pass 1 branch protection** — **now actionable.** Apply via GitHub UI: Settings → Branches → "Add branch ruleset" or "Add classic protection rule" on `main`. Rule: require PR before merging, 0 approvals, no force push, no deletions. **No required status checks yet** (CI lands in Commit 0.6). Equivalent gh API call: `gh api -X PUT repos/FireFlyMediaGroup/bestemeraldcoast-agency/branches/main/protection -H "Accept: application/vnd.github+json" -f required_pull_request_reviews[required_approving_review_count]=0 -F enforce_admins=false -F required_status_checks= -F restrictions=`. **Confirm and check this box before Commit 0.3 begins.**
- [ ] **Pass 2 branch protection** — apply **after Commit 0.6** lands CI. Edit the rule to add required status checks: the CI job name(s) + `CodeRabbit`. Check "Require branches to be up to date before merging".

## Current Step

- **Phase:** 0 — Workspace & Foundations
- **Commit:** 0.2 — Cloud accounts & domains
- **Plan reference:** `docs/dev/MASTER-bec-project-plan.md` § Phase 0 → Commit 0.2
- **ADRs in scope:** ADR-001 (Vercel), ADR-002 (Neon), ADR-005 (Vercel Blob + B2), ADR-007 (1Password), ADR-008 (Cloudflare + 8 domains), ADR-011 (PostHog), ADR-012 (Sentry + Axiom), ADR-013 (Resend + SES sending), ADR-017 (Upstash + Turnstile), ADR-018 (Anthropic budget cap)
- **Status:** queued — operator-only commit; Claude Code does not execute, but will write the `Manual` task-log entry once the operator confirms every box below is green
- **Mode:** operator-only (no branch, no PR, no CodeRabbit)

## Commit Prompt (excerpt)

> Manual operator work (not Claude Code). Provision every account and credential needed for Phase 1+. Capture each credential in the 1Password vault `BEC-Production` per ADR-007. Verify access from the operator's Mac.

## Acceptance — Operator Checklist

Tick each as you complete it. No box is optional.

- [ ] **Vercel Pro account** active. The org owning the deployments is created; billing is on.
- [ ] **Cloudflare account** active. All 8 domains transferred or pointed (CNAME-flattened apex per ADR-008): `bestemeraldcoast.com`, `bestpensacola.com`, `bestpensacolabeach.com`, `bestfortwaltonbeach.com`, `bestdestinfl.com`, `bestsouthwalton.com`, `bestcr30a.com`, `best30a.life`. DNS host set to Cloudflare for each.
- [ ] **Neon** project created via Vercel marketplace integration (ADR-002). `production` branch exists; `preview` will auto-branch per PR.
- [ ] **Resend** account verified; sending domain `mail.bestemeraldcoast.com` added (DKIM + SPF + DMARC records placed in Cloudflare per ADR-013).
- [ ] **AWS** account active; SES sandbox-exit request submitted (production access; can take 24–48h to approve — start early).
- [ ] **Anthropic API key** generated **with a budget cap** set (ADR-018; daily $29 / monthly $570 ceiling).
- [ ] **PostHog** project created (US region; ADR-011).
- [ ] **Sentry** project created — one project per Next.js app (3 total: editorial, ops-console, newsletter-public; ADR-012).
- [ ] **Axiom** workspace created (ADR-012).
- [ ] **1Password vault `BEC-Production`** populated with every credential above (Vercel, Cloudflare, Neon, Resend, AWS/SES, Anthropic, PostHog, Sentry, Axiom, B2, Upstash, Turnstile, GitHub PAT if needed). Each item has vendor link + rotation date per ADR-007.
- [ ] **Backblaze B2** bucket created (one bucket for now; lifecycle rules per ADR-006: 90-day daily retention, then weekly for 1 year on backup objects).
- [ ] **Upstash Redis** free tier provisioned (ADR-017).
- [ ] **Cloudflare Turnstile** site key generated (ADR-017).

## Validation

- See `docs/dev/validation-checklist.md` § Always (every commit) — most items N/A for operator-only commits.
- Acceptance is the operator checklist above; no Claude-Code-executable acceptance test.
- Spot-checks the operator can run from the Mac shell:
  - `vercel whoami` → returns the operator's Vercel handle.
  - `gh auth status` → still green (unchanged from 0.1).
  - `op signin` → 1Password CLI signs in; `op vault list` shows `BEC-Production`.
  - `aws sts get-caller-identity` → returns the operator's AWS account.

## Next Commit After This

- **Commit 0.3** — Environment validation. Claude Code creates `packages/config/env.ts` (Zod schema), `.env.example` at repo root, and the ADR-038 safety rails (`PROD_DB_ALLOWED`, `EMAIL_REAL_SEND_ENABLED`). This is the first **full** Ralph-loop iteration: standard branch + PR + CodeRabbit + auto-merge.

## Handoff Notes

- Master ADR and master plan are the source of truth. If anything in this file conflicts with them, trust the masters and re-derive the next step.
- Once every Acceptance box above is ticked, tell Claude Code "Commit 0.2 done" and Claude will write the `Manual` task-log entry per the format in `task-log.md`, then re-advance this file to Commit 0.3.
- **Apply Pass-1 branch protection before Commit 0.3 begins.** From Commit 0.3 onward, `/ship-task` bookkeeping writes are folded into the next commit's PR (per RALPH-LOOP.md § Git Discipline) rather than pushed direct to `main`.
- Phase 0 ends with the ADR-035 quality gate at `MASTER-bec-project-plan.md` § "Phase 0 quality gate (ADR-035)". Do not begin Phase 1 / Commit 1.1 until that gate is 100% green.
