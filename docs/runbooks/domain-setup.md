# Editorial network — domain setup runbook

**Scope**: One-time operator setup to attach the 8 editorial network domains
to the `bec-editorial` Vercel project and surface each in Google Search
Console. Companion to [`ops-console-deploy.md`](./ops-console-deploy.md).

**Outcome**:
- Each of the 8 domains resolves to the `bec-editorial` Vercel project.
- Each domain owns a Search Console property (DNS-verified TXT) so the
  per-domain sitemap (Commit 2.4) and rich results show up in GSC.
- Per-domain `_dmarc` / DKIM stays untouched (mail is sent from
  `mail.bestemeraldcoast.com` only — see ADR-013, Phase 3).

**Prerequisites**:
- `bec-editorial` Vercel project exists (deferred — see
  `docs/dev/status/next-step.md` § "Editorial deploy acceptance — DEFERRED").
- The `BEC-Production` 1Password item holds DNS-provider creds (Cloudflare /
  Namecheap / Squarespace, depending on where each registrar lives).
- Google account `wearefireflymedia@gmail.com` has Search Console access.

> The Search Console step in §3 is **operator follow-up**, not commit-blocking.
> Commit 2.11 ships the rate-limit + Turnstile + email-validation
> infrastructure and registers the runbook; the TXT records themselves are
> applied by the operator on a separate cadence.

---

## 1. The 8 domains

| Site | Domain | Archetype | Phase | Notes |
|---|---|---|---|---|
| Pensacola | `bestpensacola.com` | magazine | live | Flagship — verify first |
| Fort Walton Beach | `bestfortwaltonbeach.com` | magazine | live | |
| Emerald Coast | `bestemeraldcoast.com` | magazine | live | Also the SES sending root (ADR-013) — do NOT remove its existing DMARC / SPF / DKIM records when adding the TXT below |
| Pensacola Beach | `bestpensacolabeach.com` | coastal | live | |
| Destin | `bestdestinfl.com` | coastal | live | |
| South Walton | `bestsouthwalton.com` | coastal | live | |
| CR-30A | `bestcr30a.com` | premium | live | |
| 30A | `best30a.life` | premium | live | `.life` TLD — confirm registrar supports the same record types as `.com` |

---

## 2. Attach each domain to the `bec-editorial` Vercel project

For every row in §1:

1. Vercel dashboard → `bec-editorial` → **Settings → Domains → Add Domain** →
   enter the bare apex (`bestpensacola.com`) **and** the `www.` form
   (`www.bestpensacola.com`) as a separate entry — both must be attached so
   the proxy's host resolver matches either.
2. Add the A / CNAME record Vercel surfaces at the domain's registrar /
   Cloudflare zone. Wait for status → **Valid Configuration** (usually
   < 10 min).
3. The `bestemeraldcoast.com` apex already has live records pointed
   elsewhere if Phase 3 SES setup ran first — coordinate the change so the
   `MX` / `_dmarc` / DKIM rows are preserved (only the apex `A` /
   `CNAME` moves to Vercel).
4. Smoke test: `curl -sI https://<domain>/` returns `200` and the
   `x-bec-site-slug` request-internal header is set by `proxy.ts`
   (Vercel strips it on response, so verify via a route that echoes its
   own site context — `/sitemap.xml` is the cheapest).

**Verification — proxy resolution**: hit an unmapped host (`curl -sI -H
'Host: notmapped.example' https://<some-bec-editorial-deployment>.vercel.app/`)
and confirm the response is `404`, not a guessed site. This is the
ADR-001 contract.

---

## 3. Search Console verification TXT records (operator follow-up)

For each of the 8 domains, add a `google-site-verification` TXT row to
the apex zone. This is **operator-only** work — no code change required —
and it is the deferred-acceptance item for Commit 2.11's "Search Console
verification" line in `MASTER-bec-project-plan.md` § Phase 2 / Commit 2.11.

### Procedure (repeat per domain)

1. Open [search.google.com/search-console](https://search.google.com/search-console).
2. **Add property → Domain** (not URL prefix — the Domain property covers
   `https://` + `http://` + every subdomain + `www.` in one shot, which is
   what we want for per-archetype subdomains down the road).
3. Enter the bare apex (e.g. `bestpensacola.com`).
4. Search Console returns a TXT record of the form
   `google-site-verification=<random base64>`.
5. Add the TXT record at the apex of the zone in whatever DNS provider
   manages that domain. Cloudflare path:
   - Cloudflare dashboard → Zone → **DNS → Records → Add Record**.
   - Type **TXT**, Name **@** (or the domain root), Content
     `google-site-verification=<value>`, Proxy status **DNS only**.
6. Wait ~5 min for propagation, then **Verify** in Search Console.
7. Once verified, **Sitemaps → Add a new sitemap → `sitemap.xml`** (each
   domain serves its own sitemap from Commit 2.4's `app/(site)/sitemap.xml`
   route — already live).

### Tracking table (operator fills in as each domain verifies)

| Domain | TXT added | GSC verified | Sitemap submitted |
|---|---|---|---|
| `bestpensacola.com` | ☐ | ☐ | ☐ |
| `bestfortwaltonbeach.com` | ☐ | ☐ | ☐ |
| `bestemeraldcoast.com` | ☐ | ☐ | ☐ |
| `bestpensacolabeach.com` | ☐ | ☐ | ☐ |
| `bestdestinfl.com` | ☐ | ☐ | ☐ |
| `bestsouthwalton.com` | ☐ | ☐ | ☐ |
| `bestcr30a.com` | ☐ | ☐ | ☐ |
| `best30a.life` | ☐ | ☐ | ☐ |

### Notes

- Each `google-site-verification` TXT is **unique per domain**. Do not
  copy one value across domains — Search Console will reject the
  duplicates.
- Existing TXT records (SPF, DMARC, DKIM for `bestemeraldcoast.com`) are
  unaffected; a zone can hold many TXT records at the same name.
- The Domain-property choice means **no `https://www.`-only
  verification** — pick Domain at step 2 every time.
- If a registrar refuses TXT at the apex (rare, mostly old `.tk` /
  `.ml`), fall back to the **HTML file** verification path Search Console
  offers as a secondary. None of the 8 domains is on a registrar that has
  that issue.

---

## 4. Rate-limit + Turnstile prerequisites (already deployed via ADR-017)

These don't live at the DNS layer, but are listed here so the runbook is
the single place an operator checks before declaring the editorial
network "live":

- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` set in the
  `bec-editorial` Vercel project (Production + Preview). Without these
  the ADR-017 `publicPages` (1000/IP/min) limiter fails open — acceptable
  for an empty network, NOT for a live one.
- `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` set in the
  Vercel project, sourced from the `BEC-Production` 1Password item. The
  signup form + contact form (lands Commit 3.3) requires both; without
  them every form pass through as "human", defeating the purpose. Confirm
  before launching the newsletter-public app.

---

## Status — Commit 2.11

This runbook lands with Commit 2.11. The §3 TXT records are tracked as
deferred operator work; the §4 env vars are also operator-managed and
already present in `packages/config/src/env.ts`. Re-visit §3 once
`bec-editorial` exists in Vercel (currently deferred, see `next-step.md`).
