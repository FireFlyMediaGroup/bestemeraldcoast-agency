# Next Step

**Single handoff file.** The Ralph loop reads this first. Update it last (via `/ship-task`).

---

## Operator Pre-Flight

**Repo:** https://github.com/FireFlyMediaGroup/bestemeraldcoast-agency

- [x] Create the GitHub repo (`FireFlyMediaGroup/bestemeraldcoast-agency`, public, default branch `main`).
- [x] Visibility: **public** (operator decision — kept public while CodeRabbit OSS free tier is active; flip to private once dev work concludes).
- [x] Auto-merge enabled (`allow_auto_merge: true`).
- [x] Auto-delete head branches enabled (`delete_branch_on_merge: true`).
- [x] CodeRabbit GitHub App installed.
- [x] `.coderabbit.yaml` at repo root (landed in Commit 0.1).
- [x] `gh auth status` shows authenticated user `FireFlyMediaGroup` with ADMIN permission on the repo.
- [x] Initialize git and add the GitHub remote (done in Commit 0.1).
- [x] CodeRabbit has reviewed at least one PR (PR #1, Commit 0.1.5).
- [x] **Pass 1 branch protection** applied (verified via `gh api .../branches/main/protection`: required PR before merging, 0 approvals, no force push, no deletions, no status checks).
- [ ] **Pass 2 branch protection** — apply **after Commit 0.6** lands CI. Edit the rule to add required status checks: the CI job name(s) + `CodeRabbit`. Check "Require branches to be up to date before merging".

## Current Step

- **Phase:** 0 — Workspace & Foundations
- **Commit:** 0.1.7 — Public repo hygiene (off-plan; inserted between 0.1.5 and 0.2)
- **Plan reference:** `docs/dev/MASTER-bec-project-plan.md` § Phase 0 → Commit 0.1.7
- **ADRs in scope:** none (loop-infrastructure / hygiene commit)
- **Status:** in-flight (branch cut, PR not yet opened)

## Commit Prompt (excerpt)

> Harden the repo for the public-visibility window while CodeRabbit's OSS free tier is in use. Rewrite `.gitignore` to cover all `.env*` (except `.env.example`), certificates/private keys, cloud credential caches, SSH key filenames, local DB files + SQL dumps, IaC state files, and extra OS/editor scratch. Annotate `next-step.md` § Commit 0.2 Acceptance with deferred-to-Commit-X markers so Commit 0.3 can begin with only Pass-1 + the SES sandbox-exit request kicked off.

## Acceptance

- `.gitignore` covers env, certs/keys, cloud caches, SSH, DB dumps, IaC state, OS/editor scratch.
- `next-step.md` § Commit 0.2 Acceptance has every line tagged with `now`, `kick off now`, or `deferred to Commit X` / `Phase X`.
- PR opens against `main`, CodeRabbit `APPROVED`, squash-merged.

## Validation

- `validation-checklist.md` § Always (every commit).
- `git status` post-edit shows no unintentionally-tracked artifact (e.g., `.env` or `.aws/` shouldn't appear in untracked-but-not-ignored lists).
- A throwaway `touch .env && git status` shows `.env` ignored.

## Next Commit After This

- **Commit 0.2** — Cloud accounts & domains (operator-only). With deferral markers in place (see preview below), the only true blocker for Commit 0.3 is **Pass-1 branch protection** (already applied) + **kick off the SES sandbox-exit request** (long pole, 24–48h+ AWS turnaround).

### Commit 0.2 Acceptance (preview — what 0.2 will look like after 0.1.7 merges)

Each item is tagged by when it actually blocks something. Items marked `now` or `kick off now` are the only ones that gate progress to Commit 0.3.

- [ ] **Vercel Pro account** active — *deferred to Commit 0.6* (needed for Vercel Remote Cache + the editorial-app preview deploys).
- [ ] **Cloudflare account** active; all 8 domains transferred or pointed (CNAME-flattened apex per ADR-008) — *deferred to start of Phase 1* (needed when the editorial app first deploys to its public domains).
- [ ] **Neon** project created via Vercel marketplace integration (ADR-002) — *deferred to Commit 0.6* (needed for ephemeral test branches in CI) and *Phase 1* (needed for production schema).
- [ ] **Resend** account verified; sending domain `mail.bestemeraldcoast.com` added (DKIM + SPF + DMARC per ADR-013) — *deferred to Phase 2* (outreach starts there).
- [ ] **AWS / SES** sandbox-exit request submitted (production access) — **🟡 kick off now** (24–48h+ AWS turnaround; cost is zero to have it pending while you do other work).
- [ ] **Anthropic API key** with budget cap set (ADR-018: $29/day / $570/month ceiling) — *deferred to start of Phase 1* (first Scout run is in Phase 1).
- [ ] **PostHog** project (US region; ADR-011) — *deferred to Phase 2* (first event firings are with the editorial app).
- [ ] **Sentry** project — one per Next.js app (3 total) (ADR-012) — *deferred to Commit 0.4* (Logger + Sentry wiring lands there).
- [ ] **Axiom** workspace (ADR-012) — *deferred to Commit 0.4*.
- [ ] **1Password vault `BEC-Production`** populated with every credential above; each item has vendor link + rotation date per ADR-007 — *deferred to start of Phase 1* (operator should have it populated incrementally as each account is created, but it doesn't block 0.3).
- [ ] **Backblaze B2** bucket; lifecycle rules per ADR-006 — *deferred to Phase 4* (asset generation).
- [ ] **Upstash Redis** free tier (ADR-017) — *deferred to Phase 2* (rate limiting on public surfaces).
- [ ] **Cloudflare Turnstile** site key (ADR-017) — *deferred to Phase 2* (bot defense on signup forms).

**Go-no-go for Commit 0.3:** ✅ Pass-1 branch protection applied, 🟡 SES sandbox-exit request submitted. Everything else can wait.

## Handoff Notes

- Master ADR and master plan are the source of truth. If anything in this file conflicts with them, trust the masters and re-derive the next step.
- Loop discipline now locked in: every change goes through a branch + PR + CodeRabbit `APPROVED` + auto-merge. Post-Pass-1, `/ship-task` bookkeeping folds into the next commit's PR per `RALPH-LOOP.md` § Git Discipline step 8.
- The deferral markers above are **operator reminders**, not loop gates. The master plan's Phase 0 quality gate (ADR-035) is what ultimately requires all of them.
- Phase 0 ends with the ADR-035 quality gate at `MASTER-bec-project-plan.md` § "Phase 0 quality gate (ADR-035)". Do not begin Phase 1 / Commit 1.1 until that gate is 100% green.
