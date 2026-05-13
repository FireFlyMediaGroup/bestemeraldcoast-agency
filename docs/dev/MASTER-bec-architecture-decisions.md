# Best Emerald Coast — Architecture Decision Records (MASTER)

> **MASTER source-of-truth document.** Supersedes all prior ADR documents and addendums. Every significant decision in the BEC build is captured here as a numbered ADR.
>
> **Companion**: `MASTER-bec-project-plan.md` — the implementation guide that builds against these decisions.
>
> **How to use this document**: When Claude Code (or you) hits a decision point and asks "wait, why are we doing it this way?" — the answer is here. ADRs are also a forcing function: any change to the system that overturns a prior decision should result in a new ADR (Superseded status on the old one, link forward to the new).
>
> **Format**: Each ADR has a status, the context that prompted it, the decision, the consequences (good and bad), and where applicable, an Apple HIG / UI-UX note explaining how the decision aligns with platform-quality interaction principles.
>
> **Status legend**: `Accepted` (locked, build against it) · `Proposed` (drafted, awaiting validation) · `Superseded` (replaced by a later ADR) · `Deprecated` (no longer applies)
>
> **Document map**:
> - This document = the *what* and *why* (decisions, rationale, consequences)
> - `MASTER-bec-project-plan.md` = the *how* (schema, code, phases, commits)
> Each phase in the project plan references the ADRs it implements.

---

## Table of Contents

| # | Title | Status |
|---|---|---|
| ADR-001 | Hosting platform: Vercel for all Next.js apps | Accepted |
| ADR-002 | Postgres provider: Neon (via Vercel marketplace) | Accepted |
| ADR-003 | Postgres is the single source of truth; filesystem is for prompt artifacts only | Accepted |
| ADR-004 | Agent runtime: Claude Code on local Mac, not Vercel functions | Accepted |
| ADR-005 | Object storage: Vercel Blob for hot assets, Backblaze B2 for archives | Accepted |
| ADR-006 | Backups, disaster recovery, and restore-drill cadence | Accepted |
| ADR-007 | Secrets management: Vercel env vars + 1Password as system of record | Accepted |
| ADR-008 | Domain, DNS, and SSL setup for 8 domains | Accepted |
| ADR-009 | SEO foundations: sitemap, structured data, OG, robots, Search Console | Accepted |
| ADR-010 | Hub-vs-city canonical URL policy | Accepted |
| ADR-011 | Analytics & product telemetry: PostHog | Accepted |
| ADR-012 | Error tracking & runtime observability: Sentry + Axiom | Accepted |
| ADR-013 | Newsletter sending domain strategy | Accepted |
| ADR-014 | Compliance & legal pages package | Accepted |
| ADR-015 | Sponsored content disclosure (FTC) | Accepted |
| ADR-016 | Testing strategy: Vitest + Playwright + schema migration tests | Accepted |
| ADR-017 | Rate limiting and anti-abuse on public surfaces | Accepted |
| ADR-018 | Agent cost monitoring and budget enforcement | Accepted |
| ADR-019 | Prompt versioning and A/B testing | Accepted |
| ADR-020 | Editor feedback loop & training data | Accepted |
| ADR-021 | Editorial taxonomy: categories, content types, calendar | Accepted |
| ADR-022 | Image strategy: sourcing, rights, optimization | Accepted |
| ADR-023 | Business data enrichment pipeline & ownership model | Accepted |
| ADR-024 | Reply ingestion: per-channel architecture | Accepted |
| ADR-025 | Featured Listing product schema and rendering | Accepted |
| ADR-026 | Client onboarding & project delivery workflow | Accepted |
| ADR-027 | Author identity and bylines | Accepted |
| ADR-028 | Events as a separate content type | Accepted |
| ADR-029 | Mobile `/m` route specifications (Apple HIG) | Accepted |
| ADR-030 | Operational parameter reconciliation | Accepted |
| ADR-031 | Risk flag and do-not-contact list | Accepted |
| ADR-032 | Design archetypes and theme token contract | Accepted |
| ADR-033 | Newsletter visual design (React Email + per-site theming) | Accepted |
| ADR-034 | Copy quality rubric & "AI-smell" elimination | Accepted |
| ADR-035 | Definition of "done" for every phase quality gate | Accepted |
| ADR-036 | Accessibility baseline (WCAG 2.2 AA) for all surfaces | Accepted |
| ADR-037 | Component library structure (shadcn + theming) | Accepted |
| ADR-038 | Per-environment configuration (local, preview, production) | Accepted |
| ADR-039 | Monorepo task graph & build pipeline (Turborepo) | Accepted |
| ADR-040 | Editorial-pipeline coupling and niche rotation algorithm | Accepted |
| ADR-041 | Customer relationship & service operations layer | Accepted |

---

## ADR-001 — Hosting platform: Vercel for all Next.js apps

**Status**: Accepted

**Context**: The original project plan specified Coolify on a self-hosted VPS. The operator's preference is now Vercel for the three Next.js apps (`editorial`, `ops-console`, `newsletter-public`).

**Decision**: All three Next.js apps deploy to Vercel. The `editorial` app is mapped to all eight production domains via Vercel's domain management. Preview deployments use Vercel-generated URLs and are protected by Vercel's preview-deployment auth (no Google indexing).

**Consequences**:
- *Positive*: Best-in-class Next.js 16 support, automatic preview deployments per PR, edge caching, native Neon Postgres integration, generous CDN, no server maintenance.
- *Positive*: `proxy.ts` host-based routing across all 8 domains works natively.
- *Negative*: Vercel functions have execution-time limits (defaults: 10s on Hobby, 15s on Pro standard, up to 800s on Pro with Fluid compute). Long-running agent work cannot run inside Vercel functions — this is what triggers ADR-004.
- *Negative*: No persistent filesystem. All asset writes go to Vercel Blob or B2 (ADR-005). Agent scratch space lives on the local Mac.
- *Negative*: Pro plan ($20/month + usage) required from day one — Hobby plan disallows commercial use and supports only 1 cron/day.

**HIG/UX note**: Vercel's preview deployments support BEC's editorial workflow well — every article PR (or every prompt change) gets its own URL the operator can review on iPhone before promoting to production. This matches Apple's HIG principle that destructive or production-affecting actions should have a preview/confirmation step.

---

## ADR-002 — Postgres provider: Neon (via Vercel marketplace)

**Status**: Accepted (supersedes the project plan's "self-hosted Postgres on Coolify")

**Context**: With Vercel hosting, the path of least resistance is Neon — Vercel's native Postgres partner. Vercel shut down its own Postgres product in 2025 and now provisions Neon under the hood through the marketplace integration. Drizzle works natively with Neon's serverless driver.

**Decision**: Use Neon, provisioned through the Vercel marketplace integration. Single Neon project, three branches: `production`, `preview` (auto-branched per Vercel preview deployment), `development` (local dev). Drizzle ORM with `@neondatabase/serverless` driver.

**Consequences**:
- *Positive*: Auto-suspend on idle (compute scales to zero), instant branching for preview deployments, point-in-time recovery built-in.
- *Positive*: Schema portability preserved — Drizzle schemas are vanilla SQL; if Neon is ever replaced, only the driver swap is required.
- *Positive*: Vercel handles billing through one invoice.
- *Negative*: Cold starts when database wakes from suspend — adds ~500ms to first request after idle. Acceptable for ops-console (single user); editorial sites are mostly cached so impact is minimal.
- *Negative*: Free tier compute and storage caps; expect to be on a paid Neon tier within 60 days as the database grows.

**Migration plan**: If the operator ever wants to leave Neon (cost, vendor concern), the move to self-hosted Postgres or Supabase is a `pg_dump`/`pg_restore` plus a driver swap in `packages/db/client.ts`. No application code changes needed.

---

## ADR-003 — Postgres is the single source of truth; filesystem is for prompt artifacts only

**Status**: Accepted (resolves contradiction between the project plan and the original blueprint)

**Context**: The project plan says "state lives in Postgres, not the filesystem." The original blueprint and the BEC orchestrator file describe filesystem-based state (`state/queue/`, `leads/{slug}/diagnosis.json`). These conflict. The conflict must be resolved before agents are written.

**Decision**: Postgres is the only source of truth for business state. The filesystem under `agency/state/` is reserved exclusively for:

1. **Prompt artifacts** — versioned agent prompts (`agency/.claude/agents/scout.md`, etc.) and slash commands.
2. **Per-run logs** — Claude Code's own per-session logs and stdout/stderr from agent runs (gitignored).
3. **Scratch buffers** — temporary working files an agent uses during a single invocation, deleted at end of run.

All structured data — leads, diagnoses, outreach drafts, lead status, business records, articles, subscribers — reads and writes go through the database, accessed by agents via:
- The **ops-console internal API** (`/api/agent/*` endpoints, secured with `AGENT_API_KEY`), OR
- The **Postgres MCP server** (read-only queries) for fast lookups.

**Mutations always go through the API**, never raw Postgres MCP, so the API layer can enforce locks, transitions, and audit logging.

**Consequences**:
- *Positive*: Joins between businesses, leads, articles, and subscribers (the editorial-flywheel point) are now possible.
- *Positive*: A single dashboard query gives full state — no scanning JSON files.
- *Positive*: Lock semantics enforced in SQL (`leads.locked_by`, `locked_at`) instead of filesystem race conditions.
- *Negative*: Agents need a working network connection to the API. Local-only "offline" runs are not supported.
- *Negative*: API layer must be designed before agents are productive — adds a small upfront cost.

**Update required**: The `BEC_Agency_Orchestrator` file's "File Ownership" section is hereby superseded by ADR-003. The orchestrator file should be rewritten to describe API endpoints (`POST /api/agent/leads`, `PATCH /api/agent/leads/:id/status`, etc.) instead of filesystem paths. This rewrite happens in Phase 1.

---

## ADR-004 — Agent runtime: Claude Code on local Mac, not Vercel functions

**Status**: Accepted

**Context**: Vercel functions have a hard execution-time ceiling that doesn't fit multi-minute agent runs. Scout walking 150 businesses, Builder generating mockups, and Filmer rendering videos all routinely exceed 60 seconds. Even Pro Fluid compute (800s max) is not enough for batch operations.

**Decision**: All agents run via **Claude Code on the operator's local Mac** (and a slim subset on iPhone for the Mobile agent). Agents are invoked three ways:

1. **Manual invocation** — operator runs `claude /scout pensacola charters` from a terminal.
2. **Scheduled invocation** — `cron` (via macOS LaunchAgent) or a small `agency/scripts/run-daily.sh` runner that the operator triggers each morning, invoking the orchestrator with the day's plan.
3. **Webhook-triggered invocation** — Vercel webhooks fire when a positive reply arrives (Resend/SES inbound), which writes to the database; a watcher on the Mac (or Vercel Workflow with `wakeMac` SSH bounce) picks it up. For v1, **the operator manually triggers** Mobile from `/m` route — we don't try to make the Mac listen passively yet.

The ops-console and the public sites run on Vercel. Agents and database both live on managed infra. The Mac is only the agent **runtime**, not a server.

**Consequences**:
- *Positive*: No artificial timeout limits. A Builder run can take 3 minutes to render and that's fine.
- *Positive*: Local filesystem available for scratch space (gigabytes of mockup screenshots, etc.).
- *Positive*: Anthropic billing is one API key, not split between Vercel and Claude.
- *Positive*: Aligns with the original blueprint's working architecture (which is proven).
- *Negative*: If the Mac is asleep, scheduled jobs don't run. Use `caffeinate` or LaunchAgent + `pmset` settings to keep it awake during operating hours (8am–8pm CT).
- *Negative*: No automatic agent runs while traveling. Mobile agent on iPhone covers the most time-sensitive case (replies + bookings).

**Future**: Phase 6+ may move scheduled batches to a small always-on machine (Mac mini, Hetzner box, etc.) but **not** to Vercel functions. Vercel is for HTTP request/response only.

---

## ADR-005 — Object storage: Vercel Blob for hot assets, Backblaze B2 for archives

**Status**: Accepted

**Context**: Editorial articles need hero images. Newsletter issues need embedded images. Mockups (HTML/screenshots from Lovable) and videos (MP4 from Higgsfield) need persistent storage. Vercel has Blob storage (hot, edge-cached, expensive at scale). Backblaze B2 is S3-compatible, cheap, but not edge-cached.

**Decision**:

- **Vercel Blob** for: hero images on published articles, newsletter inline images, featured-listing photos, OG/social card images. These need fast, edge-served delivery and are accessed thousands of times.
- **Backblaze B2** for: mockup HTML archives, generated video files, original-resolution photo uploads, backups (ADR-006). Accessed rarely after generation; cheap to keep.
- **Public URLs**: Vercel Blob has its own CDN URL. B2 assets are fronted by a Cloudflare worker (free tier) that adds caching headers when needed.

Image processing (resize, format conversion, blurhash) happens via Next.js's built-in `<Image>` component on Vercel for editorial assets, and a small server route (`apps/ops-console/api/upload`) for moderation-gated uploads.

**Consequences**:
- *Positive*: Hot path is fast (edge cache), cold path is cheap (B2 is ~$0.005/GB/month).
- *Positive*: Blob is integrated with Vercel auth, simplifying the secure upload flow from ops-console.
- *Negative*: Two storage systems means two SDK clients. Encapsulate behind `packages/storage/` so calling code doesn't care.
- *Cost*: Estimate ~$10-30/month combined at year-1 volume. Goes up linearly with content production.

**HIG/UX note**: Apple HIG requires fast image rendering and explicit dimensions to prevent layout shift. Vercel's image optimization gives us width/height attributes and modern formats (AVIF, WebP) automatically.

---

## ADR-006 — Backups, disaster recovery, and restore-drill cadence

**Status**: Accepted

**Context**: Self-hosted concerns evaporate with Neon, which has continuous backups and point-in-time recovery built in. But the operator owns the data; if Neon's account access is lost, recovery requires off-Neon backups.

**Decision**:

| Asset | Backup mechanism | Frequency | Retention | Restore-drill |
|---|---|---|---|---|
| Postgres (Neon) | Native Neon point-in-time recovery | Continuous | 7 days (free) / 30 days (paid) | Quarterly |
| Postgres off-Neon | `pg_dump` to B2 via Vercel cron (daily 3am ET) | Daily | 90 days, then weekly for 1 year | Quarterly |
| Vercel Blob | Mirrored to B2 nightly via cron | Daily | 1 year | Bi-annual |
| B2 itself | B2 versioning + lifecycle rules | Continuous | Versions kept 30 days | N/A |
| Source code | GitHub (origin) | On push | Forever | N/A |
| Agent prompts (`agency/.claude/agents/`) | Git-tracked in main repo | On commit | Forever | N/A |
| `.env`/secrets | 1Password vault | Manual | Forever | Annual |

**Restore-drill protocol** (calendar event repeats every 90 days):
1. Spin up a fresh Neon branch.
2. Restore yesterday's `pg_dump` from B2.
3. Verify row counts on top 5 tables match production within 24h delta.
4. Document the runtime in `docs/restore-drill-log.md`.
5. Tear down the branch.

A failed drill blocks the next phase of new feature work until resolved.

**Consequences**:
- *Positive*: Two independent backup paths (Neon native + B2 dump). Loss of either alone is recoverable.
- *Positive*: Quarterly drills surface broken backups before they're needed in anger.
- *Cost*: B2 storage for backups: ~$2-5/month.

---

## ADR-007 — Secrets management: Vercel env vars + 1Password as system of record

**Status**: Accepted

**Context**: API keys for Google Maps, Anthropic, Resend, SES, Calendly, Lovable, Higgsfield, Neon, Sentry, PostHog, Cloudflare, plus database URLs, NextAuth secret, Cron secret, agent API key. Across local dev, Vercel preview, Vercel production, and Mac-runtime contexts. Without a single source of truth, rotations get missed and stale keys leak in `.env` files.

**Decision**:

- **System of record**: 1Password vault `BEC-Production` (operator-only access). Every secret has a 1Password item with vendor link, rotation date, and which environments it's used in.
- **Vercel env vars**: All app secrets live in Vercel project settings, scoped per environment (development / preview / production). The Vercel CLI (`vercel env pull`) populates local `.env.local` files for development.
- **Local Mac (agent runtime)**: A `agency/.env` file pulled from 1Password CLI on demand. Not committed. The `.env.example` in the repo documents every variable's name and purpose.
- **MCP server config**: `agency/.mcp.json` references variables via `${VAR_NAME}` placeholder syntax (Claude Code resolves these from the runtime environment).
- **Rotation policy**: Every secret has a rotation reminder in 1Password. Default: every 90 days. Webhook signing secrets: every 30 days. Document each rotation in `docs/secret-rotations.md`.

**Consequences**:
- *Positive*: One place to find any credential. One place to rotate.
- *Positive*: Vercel CLI's `env pull` flow keeps local dev in sync without manual copy-paste.
- *Negative*: 1Password subscription required (~$8/month for individual). Worth it.
- *Negative*: Onboarding a future contractor requires sharing the vault item carefully — but that's a future-state concern.

**HIG/UX note**: Apple HIG emphasizes that authentication should never feel like a fight. The Vercel env-pull flow means the operator types their 1Password master password once, then development "just works" without secrets-in-Slack chaos.

---

## ADR-008 — Domain, DNS, and SSL setup for 8 domains

**Status**: Accepted

**Context**: Eight production domains plus subdomains (`mail.bestemeraldcoast.com`, `ops.bestemeraldcoast.com`, etc.). Each needs DNS records, SSL certs, email authentication (DKIM, SPF, DMARC), and `www` handling.

**Decision**:

**Domain registrar**: Cloudflare Registrar for all 8 (cheap, no upsells, free privacy). If domains are currently elsewhere, plan transfers in Phase 1 week 1.

**DNS host**: Cloudflare DNS (free, fast, full API support).

**Domain → Vercel mapping**:

| Domain | Apex `A` record | `www` | Vercel project |
|---|---|---|---|
| bestemeraldcoast.com | Vercel CNAME flattening | redirect to apex | `bec-editorial` |
| bestpensacola.com | Vercel CNAME flattening | redirect to apex | `bec-editorial` |
| bestpensacolabeach.com | Vercel CNAME flattening | redirect to apex | `bec-editorial` |
| bestfortwaltonbeach.com | Vercel CNAME flattening | redirect to apex | `bec-editorial` |
| bestdestinfl.com | Vercel CNAME flattening | redirect to apex | `bec-editorial` |
| bestsouthwalton.com | Vercel CNAME flattening | redirect to apex | `bec-editorial` |
| bestcr30a.com | Vercel CNAME flattening | redirect to apex | `bec-editorial` |
| best30a.life | Vercel CNAME flattening | redirect to apex | `bec-editorial` |

**Subdomain mapping**:

| Subdomain | Project |
|---|---|
| `ops.bestemeraldcoast.com` | `bec-ops-console` |
| `mail.bestemeraldcoast.com` | `bec-newsletter-public` |
| `subscribe.bestemeraldcoast.com` | `bec-newsletter-public` (alias) |

**Email authentication** (per domain, all done via Cloudflare DNS):
- **SPF**: `v=spf1 include:amazonses.com include:_spf.resend.com ~all`
- **DKIM**: per-domain selector keys from Resend AND SES (multiple keys allowed).
- **DMARC**: Start at `p=none rua=mailto:dmarc@bestemeraldcoast.com` for the first 30 days, then advance to `p=quarantine` once all sources are passing.
- **MTA-STS** and **TLS-RPT**: Phase 6, after baseline is stable.

**SSL**: Vercel auto-issues Let's Encrypt certs. Wildcard certs not needed.

**Domain setup runbook** lives at `docs/runbooks/domain-setup.md` with step-by-step Cloudflare and Vercel screens.

**Consequences**:
- *Positive*: Single registrar + single DNS host = single dashboard for any domain change.
- *Positive*: Cloudflare's CNAME flattening handles apex-domain CNAME limitations.
- *Negative*: 8 sets of DKIM keys to manage. Mitigated by clear per-domain runbooks.
- *Cost*: ~$10/year per domain renewal.

---

## ADR-009 — SEO foundations: sitemap, structured data, OG, robots, Search Console

**Status**: Accepted

**Context**: The whole publisher-first flywheel depends on the editorial sites ranking. Without structured data, sitemaps, and proper canonical handling from day one, we waste 6 months of organic-growth potential.

**Decision**: Every editorial site (and the hub) ships with the following SEO foundation in Phase 2:

**Sitemap**: Auto-generated at `/sitemap.xml` from the `articles`, `businesses`, `events`, and static-page tables. Updates on content publish via Next.js's `generateSitemaps()` API. One sitemap per domain.

**Structured data (JSON-LD)** embedded on every page:
- **Article pages**: `Article` + `BreadcrumbList` + (when business profile) `LocalBusiness`.
- **Business profile pages**: `LocalBusiness` with `address`, `geo`, `aggregateRating`, `priceRange`, `openingHoursSpecification`.
- **Listicle pages** ("10 Best X"): `ItemList` with each business as a `LocalBusiness` element.
- **Event pages**: `Event` with `location`, `offers`, `performer` where applicable.
- **Organization** (per-site root): `NewsMediaOrganization` for the editorial sites, `Organization` for the agency-side surfaces.

**Open Graph & Twitter cards**: Every page has `og:title`, `og:description`, `og:image` (1200×630), `og:url`, `og:type`. Twitter cards mirror with `summary_large_image`.

**Robots.txt** (per domain):
- Disallow: `/api/`, `/m/` (mobile control plane), `/admin/`, `/preview/`.
- Allow: everything else.
- Sitemap reference at the bottom.
- The ops-console domain (`ops.bestemeraldcoast.com`) has `Disallow: /` and noindex headers globally.

**Canonical URLs**: See ADR-010 for the hub-vs-city policy specifically. All other pages have `<link rel="canonical">` matching the page's own URL by default.

**Google Search Console**: One property per domain (8 total). Verified via DNS TXT records (already on Cloudflare). Ownership confirmed in 1Password. Reports reviewed weekly during operating hours.

**Bing Webmaster Tools**: Mirror of Search Console setup. Same verification path.

**Consequences**:
- *Positive*: Articles are eligible for rich results (recipe-style or listicle) and Knowledge Graph.
- *Positive*: Local business markup increases the chance of Google Maps integration for featured listings.
- *Positive*: Fresh sitemaps mean new articles get crawled within hours, not days.
- *Negative*: 8 Search Console properties means 8 weekly reviews. Build a small "Search Console aggregator" page in ops-console that pulls indexed-page counts via the API (Phase 6).

**HIG/UX note**: Apple HIG's "clarity" principle has a web-SEO analog: clear, descriptive page titles and meta descriptions are what users see in search results. Treat SERP entries as a UI surface — every title/description gets the same care as a navigation label.


---

## ADR-010 — Hub-vs-city canonical URL policy

**Status**: Accepted

**Context**: When an article publishes to `bestpensacola.com` and is also syndicated to the hub at `bestemeraldcoast.com/pensacola/the-article`, both URLs serve the same content. Without canonical URLs, Google sees duplicate content and may de-index both, or pick the wrong one.

**Decision**: **The city site is always canonical.** The hub is a syndication surface that points back.

- City site article URL: `https://bestpensacola.com/charters/best-charter-fishing-pensacola-2026` — has `<link rel="canonical" href="self">`.
- Hub syndicated URL: `https://bestemeraldcoast.com/pensacola/charters/best-charter-fishing-pensacola-2026` — has `<link rel="canonical" href="https://bestpensacola.com/charters/best-charter-fishing-pensacola-2026">`.
- The hub explicitly noindexes any syndicated article that hasn't been editorially adapted (i.e., when `articles.syndicatedToHub=true` and `articles.hubAdaptedBody IS NULL`, hub renders with `<meta name="robots" content="noindex">`).
- For "best of the corridor" hub-original articles (the regional roundups), the hub's URL **is** canonical — these are not syndicated from any city.

**Schema additions** (added to `articles` table):
- `hubAdaptedBody: text` (nullable) — separate body for the hub when editorially differentiated.
- `hubCanonicalOverride: boolean` (default false) — for hub-originals.

**Consequences**:
- *Positive*: Each article has exactly one canonical URL in Google's index.
- *Positive*: City sites accumulate authority (which is what we want, since they're the targeted SEO surface).
- *Positive*: Hub still catches search traffic for regional queries via its hub-original content.
- *Negative*: Adds two fields to the article schema and a small condition in the rendering logic.

---

## ADR-011 — Analytics & product telemetry: PostHog

**Status**: Accepted

**Context**: Need to know which articles drive newsletter signups, which signup form copies convert, which outreach landing pages work, where users drop off in the subscriber confirmation flow, and which categories perform per site.

**Decision**: **PostHog Cloud** (US region) for product analytics, session replay, feature flags, and A/B testing across all three apps. **Plausible** (as a cheap secondary) for raw site traffic dashboards the operator can glance at on iPhone.

PostHog setup:
- One PostHog project, separate event prefixes per app: `editorial.*`, `ops.*`, `newsletter.*`.
- Auto-capture turned ON for the editorial app (page views, clicks, form submits) — privacy-respecting.
- Auto-capture turned OFF for ops-console (we're the only user; replay isn't needed).
- Funnels defined in PostHog UI for: signup-to-confirmed, article-to-signup, outreach-click-to-reply.

**Event taxonomy** (initial):

| Event | Properties | Surface |
|---|---|---|
| `signup.started` | `source_url`, `site_slug`, `form_variant` | newsletter-public, editorial |
| `signup.confirmed` | `subscriber_id`, `time_to_confirm_seconds` | newsletter-public |
| `article.viewed` | `article_id`, `site_slug`, `category`, `scroll_depth_pct` | editorial |
| `article.business_clicked` | `article_id`, `business_id` | editorial |
| `outreach.link_clicked` | `lead_id`, `tracking_code` | edge proxy |
| `featured_listing.shown` | `business_id`, `placement` | editorial |

Event taxonomy lives in `packages/analytics/events.ts` as a single source of truth (TypeScript constants).

**Consequences**:
- *Positive*: Product-led decisions (which signup form converts, which categories drive return visits) backed by data.
- *Positive*: PostHog's session replay catches confusing UX moments without manual user interviews.
- *Cost*: Free tier covers initial volume. Estimate $50-150/month at year-1 scale.

**HIG/UX note**: HIG calls for *clarity through evidence*. Analytics is the evidence layer. Without it, "the homepage feels cluttered" is opinion; with it, "users are bouncing at scroll depth 20% on mobile homepage" is data.

---

## ADR-012 — Error tracking & runtime observability: Sentry + Axiom

**Status**: Accepted

**Context**: Need to know when things break — exception in a route handler, a failed SES send, a Drizzle query throwing, a webhook returning 500. Standard out logs alone don't cut it, especially on Vercel where logs persist only 1 day on Pro.

**Decision**:

- **Sentry** for application-level errors, performance traces, and release tracking. Integrated into all three Next.js apps via `@sentry/nextjs`. Source maps uploaded on Vercel deploy.
- **Axiom** (or Vercel's native log drains) for structured runtime logs. Every API route and agent run emits structured JSON logs (timestamp, level, traceId, agentName/route, payload summary). Searchable for >7 days.
- **Pino** as the logger throughout `packages/logger`, with a Sentry transport for `level >= warn` and an Axiom transport for everything.
- **Alerting**: Sentry → Slack channel `#bec-alerts` for any new error. Axiom → Slack for budget burns and rate-limit triggers. Slack can be replaced with Telegram or SMS if Slack isn't installed.

**On-call discipline**: There's no on-call rotation (single operator). Instead, the operator reviews alerts twice daily — once during morning ops, once before bed. Critical alerts (DB down, all sends failing) page via SMS via a Twilio webhook from Sentry.

**Consequences**:
- *Positive*: When an outreach send fails for a specific lead, the trace ID lets us find the exact reason and recover.
- *Positive*: Performance regressions get caught before they're user-visible.
- *Cost*: Sentry $26/month base, Axiom free tier sufficient for v1.

---

## ADR-013 — Newsletter sending domain strategy

**Status**: Accepted (resolves the project plan's open decision)

**Context**: Single sending domain (`mail.bestemeraldcoast.com`) or per-site (`mail.bestpensacola.com`)? Per-site gives better local "from" matching but means 8 sets of DKIM warm-up.

**Decision**: **Single sending domain for v1**: `mail.bestemeraldcoast.com`. The "From" name is dynamic per newsletter — `Pensacola Weekly <hello@mail.bestemeraldcoast.com>`, `30A Weekly <hello@mail.bestemeraldcoast.com>`, etc.

Reply-to addresses are per-site Forwarding addresses to one operator inbox: `replies@mail.bestemeraldcoast.com`.

When sender reputation is established (3-6 months, >70% open rate, <0.1% complaint rate sustained), Phase 6+ may revisit per-site sending domains to test if local-domain alignment improves deliverability for high-engagement segments.

**Consequences**:
- *Positive*: One DKIM warmup. One DMARC alignment. One reputation to manage.
- *Positive*: Faster ramp to sending volume.
- *Negative*: Replies all funnel to one inbox (mitigated by inbox parsing on the operator's side).

**HIG/UX note**: Apple Mail and other clients show the "From" name prominently and the domain only on tap. A clean "From" name is more UX-impactful than the domain matching the brand site exactly.

---

## ADR-014 — Compliance & legal pages package

**Status**: Accepted

**Context**: 8 public sites + a newsletter operating commercially in the US, with potential EU/UK readers. Legal pages aren't optional and aren't homework that can wait.

**Decision**: A standardized **legal pages package** ships with every site in Phase 2. Five pages:

1. **Privacy Policy** — covers analytics, cookies, newsletter signup, data retention, third-party processors (Vercel, PostHog, Resend, SES, Neon), CCPA rights, GDPR rights, contact for data requests. Generated from a Termly or Iubenda template, lawyer-reviewed once.
2. **Terms of Service** — site usage, content ownership, liability limitation, jurisdiction (Florida).
3. **Advertiser Disclosure** — mandatory FTC compliance: "We may receive compensation from companies featured on this site. Some links are affiliate links. Sponsored content is labeled as such." Linked in the footer.
4. **Cookie Policy / Cookie Consent** — minimal: only essential cookies + analytics. Non-EU visitors see a small banner; EU visitors get full CMP behavior. Use a lightweight library like `vanilla-cookieconsent` or PostHog's built-in consent.
5. **Contact / Editorial Standards** — physical mailing address (CAN-SPAM requirement), corrections policy, fact-check standards, AI disclosure ("Our editorial uses AI assistance under human review").

**AI disclosure** is non-negotiable: a small label on AI-assisted articles ("Drafted with AI assistance, edited by [Author]") + a link to the editorial standards page.

**Implementation**: Pages live in `apps/editorial/app/(legal)/` as MDX files in a shared package so all 8 sites get the same content. Per-site overrides allowed for the editorial standards page only.

**Consequences**:
- *Positive*: Day-one CAN-SPAM, FTC, and basic GDPR coverage.
- *Positive*: Builds reader trust by being explicit about AI use.
- *Cost*: One-time lawyer review (~$500-1000 for a generic template review).

---

## ADR-015 — Sponsored content disclosure (FTC)

**Status**: Accepted

**Context**: The revenue model includes "Sponsored editorial article" at $500-2000. The FTC requires clear and conspicuous disclosure that content is sponsored. Failure can mean fines and crushed credibility.

**Decision**: Schema additions to the `articles` table:

```typescript
isSponsored: boolean('is_sponsored').default(false).notNull(),
sponsoredByBusinessId: uuid('sponsored_by_business_id').references(() => businesses.id),
sponsorshipDisclosure: text('sponsorship_disclosure'),  // override for unique cases
```

Rendering rules:
- **Above the title** on sponsored articles: a yellow tag reading "PAID PARTNER CONTENT" (uppercase, sans-serif, 11px, with 1.2× contrast against background).
- **First sentence of the article body** auto-prepends: *"This story is paid for by [Business Name]. Best Pensacola maintains editorial control."* (or operator-customized text).
- **Newsletter rendering** mirrors the badge.
- **Sitemap** still includes sponsored articles.
- **Search results / category pages** label sponsored cards with the same badge.

**Sponsored articles MAY NOT** be featured in "Best of" listicles or appear in the homepage hero rotation. They live in a dedicated "Partner Stories" feed and on the sponsoring business's profile page.

**Consequences**:
- *Positive*: FTC-compliant, protects credibility, transparent to readers.
- *Positive*: Establishes a clear editorial firewall — paid placement does not become editorial endorsement.
- *Negative*: Slightly limits where sponsored content can run. Worth it.

**HIG/UX note**: Apple HIG values honesty in interface communication. Disclosure is the design choice that builds long-term trust over short-term ad revenue.

---

## ADR-016 — Testing strategy: Vitest + Playwright + schema migration tests

**Status**: Accepted

**Context**: A system that auto-sends thousands of emails has a thin margin for regressions. Zero tests is not viable. Over-testing the wrong things wastes time. Right-sized testing keeps confidence high without slowing development.

**Decision**:

**Unit/integration tests with Vitest** (one config at the repo root, per-package configs as needed):
- **`packages/db`**: every query function has a test with a real Neon test branch. Covers happy path + one edge case.
- **`packages/email`**: every email template has a snapshot test (renders to HTML and compares).
- **`packages/agents`**: the API client + lock-acquisition logic.
- **`apps/ops-console/api/`**: every API route has at least an auth-pass and an auth-fail test.

Target: ~70% coverage on `packages/db`, `packages/email`, and the agent API. Lower elsewhere is fine.

**E2E tests with Playwright**:
- **Critical-path tests** that run on every PR:
  1. Newsletter signup → confirmation email → click → confirmed
  2. Unsubscribe click → confirmation page → DB shows status=unsubscribed
  3. Operator login → ops-console loads → can view leads list
  4. Article publish → editorial site renders new article
  5. Mobile `/m` route loads and shows pending approvals
- **Visual regression**: Percy or Playwright's built-in `toHaveScreenshot()` for the homepage of each archetype.

**Schema migration tests**: Every Drizzle migration is run forward and rolled back in CI before merge. A small `scripts/test-migrations.ts` verifies the rollback returns the schema to its prior state.

**CI runner**: GitHub Actions, Vercel preview deploy, Neon ephemeral branch.

**Consequences**:
- *Positive*: Critical paths are protected. Schema changes are safe.
- *Positive*: New contributors (or future-self after 6 months) can refactor with confidence.
- *Negative*: ~15-30 min slow build of CI suite on every PR. Mitigated by parallel job runners.

---

## ADR-017 — Rate limiting and anti-abuse on public surfaces

**Status**: Accepted

**Context**: Newsletter signup forms get bot-spammed within days of going live. Contact forms attract worse. Outreach link redirects can be abused for phishing if unprotected. Login flows need brute-force protection.

**Decision**:

**Rate limiting**: **Upstash Redis** (free tier sufficient for v1) via `@upstash/ratelimit`. Applied at the route level via Next.js middleware.

| Surface | Limit | Window | Consequence |
|---|---|---|---|
| Newsletter signup | 3 per IP | 1 hour | 429 + bot-check |
| Contact form | 5 per IP | 24 hours | 429 |
| Login (magic link) | 5 per email | 15 min | Rate-limit message |
| Outreach link redirects | 100 per IP | 1 min | 429 |
| API (agent endpoints) | 60 per key | 1 min | 429 |
| All public pages | 1000 per IP | 1 min | 429 (DDoS guard) |

**Bot defense on signup forms**: **Cloudflare Turnstile** (free, privacy-preserving, no CAPTCHA images). Invisible challenge by default; manual challenge if the score is suspicious.

**Email validation on signup**: Server-side check for valid syntax + MX record lookup + disposable-email-domain blocklist (use a maintained list like `disposable-email-domains` npm package). A "thanks for subscribing" message renders even when validation fails — the ban is silent so we don't leak which addresses are blocked.

**Consequences**:
- *Positive*: Subscriber list stays clean; bounce rates stay below SES's 5% threshold.
- *Positive*: Outreach tracking links can't be turned into a botnet redirector.
- *Cost*: $0 at start (Upstash free, Turnstile free).

**HIG/UX note**: HIG forbids "user-hostile" anti-abuse like CAPTCHA images. Turnstile's invisible challenge is the right pattern: invisible to humans, hostile to bots. If a human ever sees a challenge, it should be one click.

---

## ADR-018 — Agent cost monitoring and budget enforcement

**Status**: Accepted

**Context**: Agents on Claude Sonnet 4.5+ can quietly burn $100/day if Scout misconfigures or a prompt regresses. Without enforcement, a bad PR could wreck a month's budget. The blueprint estimates $480/month — the ceiling, not the target.

**Decision**:

**Per-run tracking**: Already in the `agentRuns` schema (`tokensUsed` field). Extended to also capture `inputTokens`, `outputTokens`, `cacheCreationTokens`, `cacheReadTokens`, and `costUsd` (computed from current Anthropic pricing).

**Daily budgets** in a new `agent_budgets` table:

```typescript
export const agentBudgets = pgTable('agent_budgets', {
  agentName: text('agent_name').primaryKey(),
  dailyBudgetUsd: numeric('daily_budget_usd').notNull(),
  monthlyBudgetUsd: numeric('monthly_budget_usd').notNull(),
  hardStop: boolean('hard_stop').default(true).notNull(),
});
```

Default budgets:

| Agent | Daily | Monthly |
|---|---|---|
| scout | $5 | $100 |
| diagnoser | $4 | $80 |
| builder | $8 | $150 |
| filmer | $3 | $60 (mostly Higgsfield, not tokens) |
| checker | $1 | $20 |
| pitcher | $1 | $20 |
| mobile | $1 | $20 |
| editor | $4 | $80 |
| growth | $2 | $40 |
| **Total** | **$29/day** | **$570/month** |

**Enforcement**: Every agent run's first action is a budget check via the API. If today's spend ≥ daily budget, the run aborts with a `BudgetExceeded` error and a Slack alert fires. Manual override (`--force-budget`) requires confirmation.

**Reporting**: `ops-console` has a `/metrics/spend` page with a 30-day chart per agent and a forecast of monthly burn.

**Consequences**:
- *Positive*: A misbehaving prompt can't cost more than $5 before being caught.
- *Positive*: Budget chart makes ROI calculations possible (cost per lead, cost per article).
- *Negative*: A small layer of pre-run latency (~100ms for the budget check). Acceptable.

---

## ADR-019 — Prompt versioning and A/B testing

**Status**: Accepted

**Context**: Agent prompts will evolve constantly. A new Diagnoser prompt might dramatically improve diagnosis quality, or it might silently regress. Without versioning, regressions are invisible until reply rates crater.

**Decision**:

**File-based versioning** in `agency/.claude/agents/`:
- Active prompts: `scout.md`, `diagnoser.md`, etc.
- Archive: `agency/.claude/agents/archive/scout.v1.md`, `scout.v2.md`, etc.
- Every prompt has a YAML frontmatter `version: N` field. The orchestrator reads this and writes it to `agentRuns.promptVersion`.
- **Git history is the truth** for what changed when. Archive folder is for human-readable side-by-side comparison.

**A/B testing** (Phase 5+, not Phase 1):
- A `prompt_variants` table that maps an agent name to two or more prompt files.
- The orchestrator picks a variant per run, weighted by configured ratios.
- After 100 runs per variant, a small `metrics/prompts` page in ops-console shows comparative win rate.
- A variant is "promoted" by replacing the active file and archiving the loser.

**Quality regression detection**: Whenever Checker fail rate jumps >50% week-over-week for a given agent, the system flags the most recent prompt version of that agent and pings the operator.

**Consequences**:
- *Positive*: Prompt changes are auditable and reversible.
- *Positive*: A/B testing lets us improve based on outcomes, not opinions.
- *Negative*: Adds a small column to `agentRuns`. Trivial.


---

## ADR-020 — Editor feedback loop & training data

**Status**: Accepted

**Context**: The Editor agent will produce mediocre articles for the first 30-50 attempts. Without a structured way to capture how the operator's edits diverge from Editor's drafts, Editor's quality plateaus. This is the difference between Editor saving 80% of writing time and saving 20%.

**Decision**: New `editorial_feedback` table:

```typescript
export const editorialFeedback = pgTable('editorial_feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id').notNull().references(() => articles.id),
  draftBody: text('draft_body').notNull(),
  finalBody: text('final_body').notNull(),
  editsSummary: text('edits_summary'),         // operator's optional notes
  rejectedDraft: boolean('rejected_draft').default(false),
  rejectionReason: text('rejection_reason'),
  promptVersion: integer('prompt_version'),    // links to Editor's prompt version
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Workflow**:
1. Editor drafts an article → `articles.status = 'draft'` + `articles.bodyMdx = draft_body` (saved as `originalDraftBody` on a hidden field).
2. Operator edits in the composer and publishes → on publish, a row is written to `editorial_feedback` with `draftBody` and `finalBody`.
3. After every 20 published articles, the operator runs a slash command `/refine-editor` that:
   - Pulls the latest 20 feedback rows.
   - Generates a diff summary using a separate Claude run.
   - Proposes specific prompt changes (a YAML patch to `editor.md`).
   - The operator reviews and accepts/rejects.

**UX of providing feedback**: The composer's "Publish" button is split — `Publish` and `Publish + Note feedback`. The notes field is opt-in but encouraged for the first 50 articles. After 50, the diff itself is feedback enough.

**Consequences**:
- *Positive*: Editor improves measurably over time, observable via Checker pass rates and operator-edit time.
- *Positive*: Creates a training dataset that's BEC-specific.
- *Negative*: Adds slight friction to publishing. Worth the long-term gains.

**HIG/UX note**: Apple HIG values low-friction inputs. The optional-notes field follows that — if the operator skips it, publishing is one click; if they want to capture *why* they rewrote a paragraph, the field is there.

---

## ADR-021 — Editorial taxonomy: categories, content types, calendar

**Status**: Accepted

**Context**: Without a defined taxonomy, Editor drafts random articles, navigation is inconsistent across sites, and SEO suffers. The taxonomy is also the structure for the editorial calendar — what gets published when.

**Decision**:

**Content types** (new enum in schema, replacing free-text):

```typescript
export const contentType = pgEnum('content_type', [
  'listicle',          // "10 Best X in Y"
  'profile',           // single business deep-dive
  'guide',             // "A Local's Guide to..."
  'event_coverage',    // before/after a specific event
  'news',              // breaking or seasonal updates
  'sponsored',         // paid placement
  'evergreen',         // FAQ-style, always-relevant
]);
```

**Categories** — a new `categories` table replaces the free-text `articles.category`:

```typescript
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').notNull().references(() => sites.id),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  parentId: uuid('parent_id'),  // self-ref for sub-categories
  sortOrder: integer('sort_order').default(0),
}, (t) => ({
  siteSlugUnique: uniqueIndex('cat_site_slug').on(t.siteId, t.slug),
}));
```

**Initial taxonomy per archetype** (seeded in Phase 1):

*Magazine archetype (Pensacola, FWB)*:
- Eat & Drink (Restaurants, Bars, Coffee, Markets)
- Things to Do (Beaches, Outdoors, Family, Nightlife)
- Stay (Hotels, Vacation Rentals, B&Bs)
- Events
- Local Business (Services, Shops, Wellness)
- City Life (Real Estate, Moving Guide, Schools)

*Coastal archetype (Pensacola Beach, Destin)*:
- Beaches & Water
- Charters & Boats
- Eat & Drink
- Stay
- Events
- Lifestyle

*Premium archetype (30A, South Walton)*:
- Towns of 30A (Seaside, Rosemary, Alys, etc. — one sub-cat per town)
- Stays & Homes
- Restaurants & Bars
- Wellness & Beauty
- Weddings & Events
- Style & Design

**Editorial calendar template** (lives in `docs/editorial-calendar.md`):

| Day | Cadence target | Content type mix |
|---|---|---|
| Mon | 1 listicle (city) + 1 profile (city) | Workhorse SEO |
| Tue | 1 guide (city) | Evergreen |
| Wed | 1 listicle (hub) + 1 event coverage (city) | Regional + timely |
| Thu | 1 profile (city) | Variety |
| Fri | Newsletter only — no new articles | Audience day |
| Sat | 1 evergreen (city or hub) | Steady drumbeat |
| Sun | Editorial planning — no publishing | Breath |

Target: ~12 articles/week across the network in months 1-2, ~20/week by month 6.

**Consequences**:
- *Positive*: Editor has a real slate to draft against. Categories drive consistent navigation.
- *Positive*: Calendar prevents both over-publishing (spam) and under-publishing (Google sees stagnant sites).
- *Negative*: Taxonomy is locked enough to feel rigid. Mitigated by category management UI in ops-console (Phase 3).

---

## ADR-022 — Image strategy: sourcing, rights, optimization

**Status**: Accepted

**Context**: Hero images, article inline images, business profile photos, newsletter inline images, OG cards, featured listing photos. With ~12-20 articles/week and 8 sites, that's 50-100 images/week minimum. No defined sourcing strategy is the most common reason editorial sites stall in month 2.

**Decision**: Tiered sourcing with clear precedence order:

**Tier 1 — Owned/captured photos (best)**:
- Operator's own photos (iPhone-quality fine for v1; the operator lives in the corridor).
- Photos provided by businesses (with written rights — see below).
- AI-edited operator photos (color, crop, retouch via Photoshop or Pixelmator).

**Tier 2 — AI-generated images (good, with rules)**:
- Allowed for: abstract concepts, decorative backgrounds, OG card variations.
- Forbidden for: depicting real businesses, real people, specific food dishes, specific landmarks (a "30A sunset" is OK; "Seaside Town Center" is not).
- Generated via the operator's preferred tool. Saved with `provenance: 'ai'` metadata.
- Always disclosed in the article footer ("Some images on this page were generated with AI assistance.")

**Tier 3 — Licensed stock**:
- Unsplash+, Pexels (free with attribution), or a paid service.
- Saved with full attribution metadata.
- Phase 2 default; can be replaced by Tier 1 over time.

**Tier 4 — User/business submissions (Phase 5+)**:
- A submission flow with explicit rights grant.
- Per-image moderation gate before publication.

**Schema additions** (new `images` table):

```typescript
export const imageProvenance = pgEnum('image_provenance', [
  'owned', 'business_submitted', 'ai_generated', 'licensed_stock', 'unsplash_free', 'public_domain',
]);

export const images = pgTable('images', {
  id: uuid('id').defaultRandom().primaryKey(),
  blobUrl: text('blob_url').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  altText: text('alt_text').notNull(),     // required, accessibility
  caption: text('caption'),
  provenance: imageProvenance('provenance').notNull(),
  attribution: text('attribution'),
  rightsExpiresAt: timestamp('rights_expires_at'),
  blurhash: text('blurhash'),
  uploadedById: text('uploaded_by_id'),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

export const articleImages = pgTable('article_images', {
  articleId: uuid('article_id').notNull().references(() => articles.id),
  imageId: uuid('image_id').notNull().references(() => images.id),
  role: text('role').notNull(),  // 'hero', 'inline', 'gallery', 'og_card'
  position: integer('position'),
}, (t) => ({
  pk: primaryKey({ columns: [t.articleId, t.imageId, t.role] }),
}));
```

**Optimization pipeline**:
- All uploads go through ops-console → uploaded to Vercel Blob via `put()`.
- Blurhash computed server-side and stored.
- `<Image>` component (Next.js) handles AVIF/WebP conversion, responsive `srcset`, lazy loading, blurhash placeholder.
- Required: alt text. Form blocks save until alt text is provided.

**Image rights protocol**:
- For business-submitted photos, a small "rights granted" checkbox in the upload form, with timestamp + IP recorded.
- For AI-generated, the disclosure is automatic.
- For licensed, attribution is rendered in the image caption.

**Consequences**:
- *Positive*: Every image has provenance, alt text, and dimensions — strong accessibility, strong SEO, strong legal footing.
- *Positive*: AI-generated images are explicitly bounded so we never accidentally fabricate a business storefront.
- *Negative*: Adds setup work in Phase 2 (image picker, upload flow, alt text gate).

**HIG/UX note**: Apple HIG mandates accessibility for all visual content. The required alt-text field is non-negotiable — a save button stays disabled until alt text is provided. This is a tiny friction that prevents a major accessibility regression.

---

## ADR-023 — Business data enrichment pipeline & ownership model

**Status**: Accepted

**Context**: The `businesses` table has fields like `editorialSummary`, `websiteStatus`, `gapScore`, `editorialSummary`, `rating`, `reviewCount`. Scout populates the basics; other fields need clear ownership. Worse: `websiteStatus` and `rating` go stale within months.

**Decision**:

**Field ownership matrix** (canonical source of each `businesses` field):

| Field | Owner | Frequency |
|---|---|---|
| `name`, `slug`, `niche`, `city` | Scout | On creation |
| `googlePlaceId`, `rating`, `reviewCount` | Scout (initial) → enrichment cron (refresh) | Every 14 days |
| `websiteUrl`, `websiteStatus` | Diagnoser (initial) → enrichment cron | Every 30 days |
| `contactChannels` | Diagnoser | Every 60 days |
| `gapScore` | Diagnoser (computed, not stored — recomputed on read) | Stateless |
| `editorialSummary` | Editor | On profile-article publish |
| `isClient`, `isFeatured` | Operator (via ops-console) | On state change |

**Enrichment cron**: One Vercel cron at 4am ET daily. The cron walks businesses in priority order (`isClient` first, then `isFeatured`, then most-recently-updated), spending ~10 minutes max per run, refreshing the fields above. The cron writes to `business_enrichment_log` so we know when something was last refreshed.

**Stale-data UI**: The ops-console business detail view shows a small "Last refreshed: 12 days ago" line under each field. Click the value to manually re-refresh.

**Gap score formula** (lives in `packages/business-scoring/`):

```
gap_score = (review_count_score × 0.3)
          + (rating_score × 0.2)
          + (website_age_score × 0.3)
          + (channel_diversity_score × 0.1)
          + (niche_priority_score × 0.1)

range: 0-100, higher = more attractive lead
```

The formula version is stored on each lead so we can recompute when the formula changes.

**Consequences**:
- *Positive*: No more "who writes this field?" ambiguity.
- *Positive*: Stale data is visible, refreshable, and decaying gracefully.
- *Cost*: The enrichment cron uses ~10% of daily Google Maps API quota. Stay within free tier.

---

## ADR-024 — Reply ingestion: per-channel architecture

**Status**: Accepted

**Context**: The Mobile agent depends on knowing when a reply arrives. Each channel (email, SMS, IG DM) has a different ingestion path. The original plan said "inbound email webhook" without specifying.

**Decision**:

**Email replies** (primary channel):
- Resend supports inbound parsing on a verified domain.
- Inbound emails to `replies@mail.bestemeraldcoast.com` route to a Resend Inbound webhook → `POST /api/inbound/email` on `ops-console`.
- The handler matches `In-Reply-To` and `References` headers to a sent `outreachMessages.id`, marks `repliedAt`, stores `replyBody`, runs sentiment classification (Claude Haiku, cheap), sets `replySentiment`, and notifies the operator.

**SMS replies**:
- Twilio webhook → `POST /api/inbound/sms` on `ops-console`.
- Match by `from` phone number against `outreachMessages` sent in the last 14 days.
- Same ingestion flow as email.

**Instagram DM replies** (deferred to Phase 5):
- Meta's Instagram Messaging API requires app review and a Facebook Business verification.
- For v1, IG DMs are checked manually by the operator on phone, and replies marked via a "Mark as replied" button in ops-console.
- Phase 5 revisits proper webhook integration.

**Sentiment classification**:
- A small Claude Haiku call: "Is this reply positive (interested), negative (declines, hostile), neutral (questions, no commitment), or out-of-office?"
- Output: enum value written to `outreachMessages.replySentiment`.
- Haiku is fast (~500ms) and cheap (~$0.0005 per classification).

**Reply-to-Mobile flow**:
- A `pending_replies` view filters `outreachMessages` where `replySentiment IN ('positive', 'question')` and `not yet acknowledged`.
- Mobile agent reads this view, drafts a response, and writes it to `outreachMessages.draftedResponse`.
- The operator approves on `/m`.

**Consequences**:
- *Positive*: Each channel has a defined, testable ingestion path.
- *Positive*: Sentiment classification reduces operator triage load by ~70%.
- *Negative*: IG DM is deferred — operator does manual checking until Phase 5.
- *Cost*: Sentiment classification: ~$0.50/month at projected volume.

---

## ADR-025 — Featured Listing product schema and rendering

**Status**: Accepted

**Context**: The revenue model includes "$99-199/year Featured Listing" but the schema only has `businesses.isFeatured: boolean`. No expiration, no placement variants, no design spec.

**Decision**:

**Schema** (new `featured_listings` table):

```typescript
export const featuredPlacement = pgEnum('featured_placement', [
  'hero',           // homepage hero rotation
  'category_top',   // top of category page
  'sidebar',        // article sidebar widget
  'newsletter',     // 1 mention per quarter
]);

export const featuredListings = pgTable('featured_listings', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  siteId: uuid('site_id').notNull().references(() => sites.id),
  placement: featuredPlacement('placement').notNull(),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  amountCents: integer('amount_cents').notNull(),
  newsletterMentionsRemaining: integer('newsletter_mentions_remaining').default(4),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Rendering** (per archetype, defined in `packages/ui/featured-listing/`):
- **Magazine**: Inline card with photo (4:3 ratio), business name, niche tag, 2-line description, hours, "View Details" link.
- **Coastal**: Wider photo (16:9), more lifestyle-focused copy, prominent CTA ("Book Now" or "Visit").
- **Premium**: Editorial-style card with large photo, minimal text, refined typography.

**Placement rules** (enforced by query layer):
- Hero: max 3 active per site per day, rotate.
- Category top: max 1 active per category per day.
- Sidebar: max 5 candidates per article, rotate per page load.
- Newsletter: deducts from `newsletterMentionsRemaining` each time featured.

**Self-serve management** explicitly *not* in v1 — operator manages via ops-console form.

**Consequences**:
- *Positive*: Real product with bounds. Clear inventory limits prevent over-promising.
- *Positive*: Newsletter mentions track quarterly, matching the offer.
- *Negative*: One more table to maintain. Worth it for the revenue line.

**HIG/UX note**: Apple HIG calls for advertising and editorial to be visually distinct. Featured listings have a subtle "Featured" tag in the corner so readers can distinguish editorial from paid placement at a glance.

---

## ADR-026 — Client onboarding & project delivery workflow

**Status**: Accepted

**Context**: The lead pipeline ends at `closed_won`. Then what? Where do project briefs live? How are designs delivered? Where are monthly hosting/edit tickets tracked? Without this, won deals fall into a Trello-board purgatory.

**Decision**: New `projects` and `project_tasks` tables.

```typescript
export const projectStatus = pgEnum('project_status', [
  'kickoff', 'design', 'build', 'review', 'launched', 'maintenance', 'paused', 'closed',
]);

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  leadId: uuid('lead_id').references(() => leads.id),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  offerType: text('offer_type').notNull(),  // 'starter', 'standard', 'growth', 'maintenance'
  contractAmountCents: integer('contract_amount_cents').notNull(),
  status: projectStatus('status').notNull().default('kickoff'),
  kickoffAt: timestamp('kickoff_at'),
  launchedAt: timestamp('launched_at'),
  brief: jsonb('brief').$type<ProjectBrief>(),
  liveUrl: text('live_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const projectTasks = pgTable('project_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('todo'),  // todo, in_progress, blocked, done
  dueAt: timestamp('due_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Ops-console "Projects" tab** (added in Phase 5):
- Kanban view by status.
- Project detail page with brief, tasks, files, communication log.
- "Maintenance plan" view filters projects with `offerType = 'maintenance'` and shows their monthly recurring tasks.

**Client portal**: Phase 6+. For v1, project status is communicated by email + the ops-console-internal `/share/projects/[id]` link with a public read-only token (Phase 5).

**Consequences**:
- *Positive*: Closed-won leads have a defined next step.
- *Positive*: Maintenance subscriptions are trackable as recurring revenue.
- *Negative*: Adds two tables. Earned by closing v1's first deal.

---

## ADR-027 — Author identity and bylines

**Status**: Accepted

**Context**: `articles.authorId` exists but no `authors` table. AI-drafted articles need a default byline. Future contributors (or the operator's own brand) need to be representable.

**Decision**: New `authors` table.

```typescript
export const authors = pgTable('authors', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  displayName: text('display_name').notNull(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  isAi: boolean('is_ai').default(false),
  isHumanReviewer: boolean('is_human_reviewer').default(false),  // marks the operator
  email: text('email'),
  twitter: text('twitter'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

Initial seeded authors:
1. **"Best Emerald Coast Editorial"** (`is_ai: true`) — default byline for AI-drafted, human-reviewed articles.
2. **Operator's name** (`is_human_reviewer: true`) — used when operator does substantial original writing.

Articles **must** have either:
- An `authorId` pointing to a human/AI author, OR
- A combination: `authorId = AI` + `reviewedById = operator` (rendered as "By BEC Editorial · Reviewed by [Operator]").

**Byline rendering**: Shows on every article, with link to author page (`/authors/[slug]`) listing all their articles. Author pages help SEO (E-E-A-T signals) and build perceived editorial depth.

**Consequences**:
- *Positive*: Real bylines, real author pages, real E-E-A-T signal for Google.
- *Positive*: AI authorship is honestly disclosed, which is increasingly important per Google's helpful-content guidance.
- *Negative*: One more table. Trivial.

**HIG/UX note**: HIG values transparency. AI authorship label combined with human-reviewer attribution is the right pattern — it tells the reader exactly what they're reading without burying the disclosure.

---

## ADR-028 — Events as a separate content type

**Status**: Accepted

**Context**: Articles are wrong-shaped for events. Events have dates, venues, ticket links, and recurrence. Forcing them into the article schema means losing structured-data SEO benefits and complicates listings.

**Decision**: New `events` table, separate from `articles`.

```typescript
export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').notNull().references(() => sites.id),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }),
  recurrence: text('recurrence'),  // RRULE string for recurring events
  venueName: text('venue_name'),
  venueAddress: text('venue_address'),
  venueLat: numeric('venue_lat'),
  venueLng: numeric('venue_lng'),
  ticketUrl: text('ticket_url'),
  priceMin: integer('price_min'),
  priceMax: integer('price_max'),
  isFree: boolean('is_free').default(false),
  category: text('category'),
  heroImageId: uuid('hero_image_id').references(() => images.id),
  associatedBusinessId: uuid('associated_business_id').references(() => businesses.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({
  siteSlugUnique: uniqueIndex('event_site_slug').on(t.siteId, t.slug),
}));
```

**Surfaces**:
- `/events` per site — month/list/map views.
- Hub `/events` — corridor-wide.
- `Event` JSON-LD on detail pages.
- Newsletter "Events This Weekend" auto-generated section.
- iCal feed at `/events.ics` per site (Phase 4+).

**Editor agent extension**: Editor can draft event coverage articles linked to event records. Event records themselves are usually scraped/added manually in Phase 3 (event aggregation API integration is Phase 6).

**Consequences**:
- *Positive*: Proper Event structured data, accurate per-timezone times, recurring events.
- *Positive*: Newsletter-ready event blocks.
- *Negative*: One more route per site, one more table. Worth it — events are some of the highest-engagement content for local sites.


---

## ADR-029 — Mobile `/m` route specifications (Apple HIG)

**Status**: Accepted

**Context**: The mobile control plane `/m` is where the operator lives during the day — approving leads, mockups, replies, articles, sponsorships. Bad mobile UX here is the operational bottleneck for the whole business. Apple HIG must drive the design.

**Decision**: A dedicated set of mobile-first views under `/m/*` in `apps/ops-console`. Designed and tested on iPhone 15 / Safari first, desktop is the secondary view.

**Apple HIG principles applied**:

1. **Clarity** — One primary action per screen. The most-used button is the largest and lowest (thumb-zone optimized).
2. **Deference** — Content (the lead, the mockup, the article) is foreground; controls are subtle until needed.
3. **Depth** — Modal sheets for editing, swipe gestures for triage, full-screen previews for mockups and articles.
4. **Consistency** — Same approve/reject pattern across all approval types.
5. **Direct manipulation** — Swipe right to approve, swipe left to reject, tap to expand. Mirrors Apple Mail.
6. **Feedback** — Haptic feedback on iOS (via Web Vibration API), optimistic UI updates with rollback on error.

**Screens**:

| Route | Purpose | Primary action |
|---|---|---|
| `/m` | Inbox: all pending approvals across categories | Tap any to dive in |
| `/m/leads/[id]` | Lead detail with diagnosis preview | Swipe to triage |
| `/m/mockups/[id]` | Mockup full-screen with notes | Approve / Reject / Edit notes |
| `/m/replies/[id]` | Reply thread + drafted response | Approve send / Edit / Decline |
| `/m/articles/[id]` | Article preview as it'll render on the live site | Approve / Reject / Edit-on-desktop |
| `/m/sponsorships` | Inventory snapshot | Confirm / Adjust |
| `/m/metrics` | Glance: today's signups, sends, replies, dollars | Pull-to-refresh |

**Specific HIG-driven decisions**:

- **Bottom nav** with 5 icons (Home, Leads, Replies, Articles, Metrics). 44×44pt minimum tap target. Icon + label.
- **Pull-to-refresh** on every list view.
- **Modal sheets** for any compose/edit action (mirrors iMessage compose).
- **Safe area insets** respected — content never hides under the home indicator.
- **Dark mode** support via `prefers-color-scheme`; ops-console defaults to dark to match Mail/Messages-at-night.
- **Reduced motion** respected — animations disable when `prefers-reduced-motion: reduce`.
- **Dynamic Type** — base font scale honors the user's iOS system text size preference.
- **One-handed reach** — primary CTA always in the bottom 25% of the screen.
- **Confirmation, not just feedback** — destructive actions (reject, decline, unsubscribe) require a small confirmation sheet (HIG calls this an "alert").
- **Optimistic UI with reversal** — approving an article shows "Approved" instantly; if the server rejects, an undo toast appears for 5 seconds.

**Implementation notes**:
- shadcn's `Sheet`, `Drawer`, and `AlertDialog` cover most needs.
- `@vidstack/react` or native `<video>` for mockup video playback.
- Add `viewport-fit=cover`, `apple-mobile-web-app-capable`, and a properly sized icon set so `/m` can be added to home screen and feel like a real app.
- Service worker for offline caching of the inbox view (Phase 5+).

**Consequences**:
- *Positive*: The most operationally critical surface is the most polished.
- *Positive*: Add-to-Home-Screen lets the operator open `/m` like an app icon.
- *Negative*: Real mobile design takes time. Mitigate by treating `/m` as a Phase 1 deliverable (not a Phase 5 afterthought).

---

## ADR-030 — Operational parameter reconciliation

**Status**: Accepted (resolves contradictions across source docs)

**Context**: The various source docs disagree on numbers. We pick one set, write them here, and any number elsewhere defers to this ADR.

**Decision**:

| Parameter | Value | Notes |
|---|---|---|
| Scout daily cap (businesses scanned) | **150** | Hard cap; ramped up only after Phase 4 stable |
| Scout daily cap (new leads added) | **30** | Even if 150 are scanned |
| Diagnoser daily cap | **30** | Matches Scout output |
| Builder daily cap (mockups) | **4** | Phase 4 ramp; Phase 5+ may reach 6-8 with quality check |
| Filmer daily cap | **4** | One per Builder mockup |
| Pitcher daily cap | **30** | Outreach sends per day across all channels |
| Checker daily cap | **60** | Up to 2 passes per message |
| Editor daily cap (drafts) | **2** | Phase 2-3; raised to 3-4 once feedback loop tunes |
| Approval threshold (deal value) | **$3,000** | Quotes above require human approval |
| Reply rate floor (per niche) | **12%** | Measured over rolling 7-day window |
| Reply rate measurement window | **7-day rolling** | Resolves "rolling window?" gap |
| Newsletter sending volume cap | **5,000/day** | SES warmup ramps over 30 days |
| Agent daily $ cap (combined) | **$29** | Per ADR-018 |
| Agent monthly $ cap (combined) | **$570** | Per ADR-018 |

These are operational parameters, not constants. They live in a `config/operational-params.ts` file that all agents and the orchestrator read at runtime. Changes go through PR review.

**Consequences**:
- *Positive*: One source of truth, no more contradictions.
- *Positive*: A single place to ramp caps as the system proves itself.

---

## ADR-031 — Risk flag and do-not-contact list

**Status**: Accepted

**Context**: `risk_flag: high` is referenced in the orchestrator file but missing from the schema. There's also no defined process for de-listing a business that asks to be removed, or a "do not contact" list for businesses that responded angrily.

**Decision**:

**Schema additions** (to `businesses`):

```typescript
riskFlag: text('risk_flag'),  // 'high', 'medium', 'low', null
doNotContact: boolean('do_not_contact').default(false).notNull(),
doNotContactReason: text('do_not_contact_reason'),
doNotContactAt: timestamp('do_not_contact_at'),
delistedFromEditorial: boolean('delisted_from_editorial').default(false).notNull(),
```

**Risk flag triggers** (set automatically by Diagnoser or manually by operator):
- **High**: Negative reviews specifically mentioning prior bad web-dev experience; lawsuit history visible online; aggressive online behavior in reviews; competitor agencies recently active.
- **Medium**: Outdated information difficult to verify; spam-trap-looking listing; contact info doesn't match Google Maps.
- **Low**: Default for everything else.

Orchestrator behavior:
- `high` requires human approval before any outreach.
- `medium` allows automated outreach but flags the lead in the queue with a yellow tag.
- Outreach to anything other than `low` requires a one-extra-second cooldown (helps catch operator errors).

**Do-not-contact protocol**:
1. Any reply containing "remove", "do not contact", "stop emailing", "unsubscribe" (matched by Checker's classifier) auto-sets `doNotContact = true`.
2. The lead is moved to `closed_lost` with reason "do_not_contact".
3. The business is hidden from any future Scout runs — Scout's query excludes `doNotContact = true`.
4. The business may still appear in editorial *unless* `delistedFromEditorial = true`, which is a separate operator action (covers requests like "I want to be removed from your site entirely").

**Editorial delisting**: When `delistedFromEditorial = true`, the business is removed from listicles and category pages within 24 hours. Profile pages return 410 Gone.

**Consequences**:
- *Positive*: Legal compliance (CAN-SPAM, business privacy requests).
- *Positive*: Reputation protection — angry leads stay angry leads, but the system stops poking them.
- *Negative*: Slight schema bloat. Trivial.

---

## ADR-032 — Design archetypes and theme token contract

**Status**: Accepted

**Context**: 8 sites need to feel distinct without 8 codebases. The discussion in the project plan landed on "three archetypes + per-site theme tokens" — this ADR formalizes the contract.

**Decision**:

**Three archetypes**:

| Archetype | Sites | Vibe | Reference |
|---|---|---|---|
| **Magazine** | bestpensacola, bestfortwaltonbeach, bestemeraldcoast (hub) | Trustworthy, neighborhood, readable | Eater city sites, Garden & Gun |
| **Coastal** | bestpensacolabeach, bestdestinfl | Bright, vacation-forward, lifestyle | Coastal Living, Visit Florida tourism sites |
| **Premium** | bestsouthwalton, bestcr30a, best30a.life | Editorial-magazine, refined, full-bleed | Cereal Magazine, Kinfolk |

**Theme token contract** (TypeScript type that every `sites.themeTokens` row must satisfy):

```typescript
export type SiteTheme = {
  archetype: 'magazine' | 'coastal' | 'premium';
  colors: {
    background: string;        // OKLCH preferred for Tailwind v4
    foreground: string;
    primary: string;
    primaryFg: string;
    accent: string;
    accentFg: string;
    muted: string;
    mutedFg: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono?: string;
    weights: {
      heading: number[];       // e.g., [400, 600, 700]
      body: number[];
    };
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  spacing: {
    contentMaxWidth: string;   // '720px' for magazine, '900px' for premium, etc.
    sectionGap: string;
  };
  imagery: {
    style: 'editorial' | 'lifestyle' | 'minimal';
    heroAspect: '16/9' | '4/3' | '21/9' | '3/2';
    treatment?: 'duotone' | 'desaturated' | 'natural';
  };
  voice: {
    tagline: string;
    tone: 'casual' | 'refined' | 'punchy';
    sampleHeadlinePattern: string;  // for AI-generated content style matching
  };
};
```

**Initial archetype tokens** (locked in design phase, may be adjusted within the archetype):

*Magazine*:
- Background: cream (`oklch(0.98 0.01 80)`), foreground near-black (`oklch(0.18 0 0)`).
- Primary: deep navy (`oklch(0.30 0.06 240)`), accent: amber (`oklch(0.75 0.13 70)`).
- Heading: Fraunces (variable serif), body: Inter.
- Radius: subtle (4-8px).
- Imagery: documentary, natural treatment.

*Coastal*:
- Background: white, foreground near-black with slight cool tint.
- Primary: ocean teal (`oklch(0.55 0.12 220)`), accent: coral (`oklch(0.72 0.14 30)`).
- Heading: General Sans, body: Inter.
- Radius: friendly (8-12px).
- Imagery: bright lifestyle, natural saturation.

*Premium*:
- Background: bone (`oklch(0.97 0.01 90)`), foreground deep charcoal.
- Primary: near-black, accent: sage (`oklch(0.65 0.05 140)`).
- Heading: Editorial New (or fallback Fraunces), body: Söhne (or Inter Tight).
- Radius: minimal (2-4px), with selective full-bleed elements.
- Imagery: editorial, lots of negative space.

**Component contract**: Every component in `packages/ui/` must:
1. Read all colors, fonts, radii, and spacing from CSS variables (no hardcoded values).
2. Render correctly in all three archetypes (verified in Storybook).
3. Pass WCAG 2.2 AA contrast in all archetype color combinations.

**Consequences**:
- *Positive*: 8 sites, one component library. New sites added in <1 day.
- *Positive*: Consistent UX patterns across the network.
- *Negative*: Initial design system work is non-trivial (1-2 weeks of focused design + Storybook setup).

**HIG/UX note**: Apple HIG values consistency across surfaces. The archetype system is BEC's interpretation — every site shares interaction patterns, only visual identity differs. A reader who learns one site instantly knows how to use the others.

---

## ADR-033 — Newsletter visual design (React Email + per-site theming)

**Status**: Accepted

**Context**: Newsletters are read in Apple Mail, Gmail, Outlook, with wildly different rendering. Web fonts often don't load. Dark mode is the user's preference, not ours. The newsletter is also a brand surface: a Pensacola newsletter must visually feel like bestpensacola.com.

**Decision**:

**Stack**: React Email components, rendered to HTML, sent via SES (bulk) or Resend (transactional).

**Constraints baked into templates**:
- **Max width**: 600px (industry standard).
- **Fonts**: System font stacks per archetype (no web fonts).
  - Magazine: `'Georgia', 'Times New Roman', serif` for headings; `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` for body.
  - Coastal: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` throughout.
  - Premium: same as Magazine but reversed weights — heavy for body emphasis.
- **Dark mode**: `<meta name="color-scheme" content="light dark">` and CSS variables that flip in `prefers-color-scheme: dark`. Every color has a dark-mode counterpart.
- **Images**: Always include `width`, `height`, `alt`, and explicit `style="display:block;"`. Hosted on Vercel Blob with edge cache.
- **No JavaScript**, no `<form>`, no embedded video. Links only.
- **Single-column layout** by default. Two-column section is rendered as table-based layout for Outlook compat.

**Per-site theming**:
- Templates accept a `siteId` prop, fetch theme tokens, render with per-site colors/fonts/voice.
- "From name" rendered per site as in ADR-013.

**Standard issue structure**:
1. Header (logo, issue number, date, optional sponsor strip)
2. Hero story (lead article, full-width image, headline, dek, CTA)
3. 3-4 secondary stories (image left, copy right, alternating)
4. Featured listings section (1-3 paid features, clearly labeled)
5. Events block (next 7 days, when applicable)
6. Footer (physical address, unsubscribe, preference center, social links)

**Apple Mail / iOS rendering testing**: Litmus or Email on Acid (paid) used pre-launch; Postmark Spamcheck for spam-score testing. After launch, manual iPhone preview of every issue before send.

**Consequences**:
- *Positive*: Renders well in 95%+ of inboxes.
- *Positive*: Per-site brand consistency strengthens reader trust.
- *Negative*: System fonts mean less typographic personality than the web. Mitigated by strong layout and color.

**HIG/UX note**: Apple Mail's design favors minimal visual chrome and high content density. Our newsletter design follows that — generous whitespace, clear hierarchy, no glossy graphics.

---

## ADR-034 — Copy quality rubric & "AI-smell" elimination

**Status**: Accepted

**Context**: Outreach messages and editorial drafts can sound algorithmic. Once readers smell AI, trust collapses. The Checker agent needs a concrete rubric, not vibes.

**Decision**: A formal **Copy Quality Rubric** (lives in `agency/.claude/rubrics/copy-quality.md`) used by Checker for outreach and Editor self-check for articles. Six dimensions, each scored 0-2:

| Dimension | 0 (fail) | 1 (passable) | 2 (good) |
|---|---|---|---|
| **Specificity** | Generic, swappable to any business | One specific local detail | Two+ specific, verified details |
| **Length discipline** | 100+ words (outreach) / 1500+ words (article without need) | Within target | Tight, every sentence earns its place |
| **Voice match** | Reads like a brochure or LinkedIn post | Mostly natural | Sounds like a person from the corridor |
| **AI markers** | Contains banned words: "streamline", "leverage", "unlock", "synergy", "robust", "delve", "in conclusion", "it's worth noting" | One slip | Zero banned words, no formulaic openers |
| **Local accuracy** | Mentions wrong city/landmark/detail | All details correct, none unique | Correct + uses an inside-baseball detail |
| **CTA clarity** | None or ambiguous | Clear but generic | Clear, low-friction, time-bound |

**Pass threshold**: Total ≥ 9/12 with no 0 in any dimension. Outreach must additionally pass: under 70 words, no AI markers (zero in that dimension), and at least one local-specific reference.

**Banned phrases list** (versioned in `agency/.claude/rubrics/banned-phrases.md`, evolves):
- "I noticed your website..."
- "I came across your business..."
- "Hope this email finds you well..."
- "I wanted to reach out..."
- "streamline", "leverage", "unlock", "synergy", "robust", "harness", "delve", "navigate the complexities", "in today's [adjective] world"
- Em-dash openers (a known LLM tic)

**Editorial-specific addenda**:
- No "five reasons why" tropes unless genuinely a listicle.
- No "in this article we'll explore" meta-narration.
- No "stay tuned" or "what are your thoughts?" engagement-bait closers.

**Consequences**:
- *Positive*: Concrete rubric makes Checker's pass/fail explainable.
- *Positive*: Banned phrase list is a living document the operator can extend on encountering new tics.
- *Negative*: Some legitimate prose may get false-positive blocked. Manual override in ops-console available.


---

## ADR-035 — Definition of "done" for every phase quality gate

**Status**: Accepted

**Context**: The project plan's quality gates ("sounds like a thoughtful human consultant") are subjective. Subjective gates get rationalized through under pressure. We need objective, measurable definitions of done for every phase.

**Decision**: Each phase has a hard "done" checklist. **All boxes ticked before moving forward, no exceptions.**

**Phase 1 — Foundation**:
- [ ] Neon database provisioned via Vercel; production + preview branches verified.
- [ ] Drizzle migrations run cleanly forward and backward.
- [ ] All tables from ADR-003 + ADRs 020-031 created and seeded.
- [ ] 8 sites seeded with placeholder theme tokens.
- [ ] Ops-console deploys to `ops.bestemeraldcoast.com` with NextAuth working.
- [ ] Operator can log in on iPhone Safari without bugs.
- [ ] Scout agent runs on a sample query and writes ≥10 leads to the database.
- [ ] Diagnoser produces a 50-word diagnosis for each lead.
- [ ] **External validation**: 3 friends/peers shown 5 random Diagnoser outputs blind, asked "human or AI?". At least 3/5 pass as human.
- [ ] All Phase 1 ADR-016 unit tests pass on CI.
- [ ] One restore drill run successfully.

**Phase 2 — Outreach + Editorial Foundation**:
- [ ] Checker agent runs all outputs through ADR-034 rubric.
- [ ] Pitcher dispatches 10 real cold messages via Resend.
- [ ] **External validation**: ≥1 reply within 7 days from those 10 sends.
- [ ] No reply contains "is this AI?".
- [ ] Editorial app deployed at all 8 domains via `proxy.ts`.
- [ ] At least 1 city site has 3 published articles, fully rendered with structured data.
- [ ] Sitemap, robots, OG, JSON-LD all validate via Google Rich Results Test.
- [ ] All Phase 2 unit + Playwright tests pass.

**Phase 3 — Newsletter Infrastructure**:
- [ ] SES exited sandbox; sending domain verified DKIM + SPF + DMARC.
- [ ] Newsletter-public app deployed at `mail.bestemeraldcoast.com`.
- [ ] Double opt-in flow: signup → email → confirm → DB shows `confirmed_at`. Tested 5x.
- [ ] One newsletter sent to a list of 5 (operator + friends). All 5 received it; 0 in spam.
- [ ] Unsubscribe link works. DB shows `unsubscribed_at` immediately.
- [ ] Apple Mail, Gmail, Outlook web all render the newsletter without layout breaks.
- [ ] One restore drill run successfully.

**Phase 4 — Asset Generation**:
- [ ] Builder agent generates a Lovable mockup for one real lead, screenshot saved to Blob.
- [ ] Filmer renders a 10-second vertical video for that mockup.
- [ ] Mockup gate in ops-console: operator can approve/reject from `/m`.
- [ ] First outreach with mockup + video sent.
- [ ] **External validation**: blind review of 10 mockups by 2 other people; ≥7/10 rated "looks like a real agency built it".

**Phase 5 — Booking Loop + Mobile**:
- [ ] Inbound email webhook ingests replies and classifies sentiment.
- [ ] Mobile agent drafts response for a positive reply.
- [ ] Operator approves on iPhone `/m` → Calendly link sent.
- [ ] **End-to-end success**: one real prospect books a real call from this pipeline.
- [ ] All `/m` routes pass HIG checklist (44pt taps, safe area, dynamic type, dark mode, reduced motion, haptic feedback).

**Phase 6 — Growth Engine**:
- [ ] Growth agent proposes 3 newsletter optimizations weekly to operator.
- [ ] One sponsored issue sent (paid by a real business).
- [ ] **External validation**: $1 of newsletter sponsorship revenue earned independent of any web build deal.

**Consequences**:
- *Positive*: Phase boundaries are real, not aspirational.
- *Positive*: External validation prevents self-deception.
- *Negative*: Slows momentum slightly when a phase fails its gate. That's the point.

---

## ADR-036 — Accessibility baseline (WCAG 2.2 AA) for all surfaces

**Status**: Accepted

**Context**: Editorial sites have legal exposure under the ADA (cases like Domino's) if they're inaccessible. Newsletter recipients include readers with low vision, color blindness, motor impairments. Apple HIG mandates accessibility throughout.

**Decision**: **WCAG 2.2 AA** as the floor for all public surfaces. Specific commitments:

**Color contrast**:
- All body text: ≥ 4.5:1 against background.
- All large text (18pt+): ≥ 3:1.
- Interactive elements: ≥ 3:1 against adjacent colors.
- Verified per-archetype in Storybook with `@storybook/addon-a11y`.

**Keyboard navigation**:
- Every interactive element reachable via Tab.
- Visible focus indicators on every focusable element.
- Skip-to-content link at the top of every page.
- No keyboard traps in modals or sheets.

**Screen reader**:
- Every image has alt text (enforced by ADR-022 schema requirement).
- Every form field has a `<label>`.
- Page hierarchy uses semantic `<h1>` → `<h2>` → `<h3>` properly.
- ARIA roles only when semantic HTML is insufficient.
- Tested with VoiceOver on macOS and iOS at least once per phase.

**Motor accessibility**:
- Tap targets minimum 44×44pt on mobile.
- No drag-only actions (every drag has a tap fallback).
- Time limits avoidable or extendable.

**Cognitive accessibility**:
- Plain language in error messages ("Your email looks invalid" not "ERR_INVALID_INPUT").
- Confirmation for destructive actions.
- Consistent navigation.

**Animation/motion**:
- `prefers-reduced-motion` honored everywhere; non-essential animations disable.
- No flashing > 3Hz.

**Forms**:
- Inline validation that doesn't block until submit.
- Errors announced to screen readers via `aria-live`.
- Forms work without JavaScript where possible.

**CI gate**: `axe-core` or Playwright a11y assertions on every E2E test. A new violation fails the build.

**Consequences**:
- *Positive*: Legally defensible, ethically right, often improves SEO and usability for everyone.
- *Negative*: Adds review time. Mitigated by automated checks catching most issues.

**HIG/UX note**: Apple HIG considers accessibility a baseline, not a feature. This ADR matches that posture.

---

## ADR-037 — Component library structure (shadcn + theming)

**Status**: Accepted

**Context**: Multiple apps share components (article cards, business cards, signup forms, navigation, footer). Without a shared library, three codebases diverge. shadcn/ui is the right base — but it's source-vendored, not installed. The structure for sharing it across the monorepo needs a clear convention.

**Decision**:

**Package**: `packages/ui/`

**Layout**:
```
packages/ui/
├── package.json
├── tsconfig.json
├── components/
│   ├── primitives/        # shadcn-vendored components (Button, Input, Sheet, Dialog, etc.)
│   ├── compositions/      # BEC-specific compositions (ArticleCard, BusinessCard, NewsletterSignup)
│   └── layouts/           # Page-level layout wrappers (SiteHeader, SiteFooter, ArticleLayout)
├── theme/
│   ├── tokens.ts          # SiteTheme TypeScript type from ADR-032
│   ├── archetypes/        # Three archetype token files
│   │   ├── magazine.ts
│   │   ├── coastal.ts
│   │   └── premium.ts
│   ├── apply.ts           # Server function: theme tokens → CSS variables
│   └── globals.css        # Tailwind v4 @theme + base styles
├── icons/                 # lucide-react re-exports + custom BEC icons
├── stories/               # Storybook stories per component
└── tests/                 # Vitest tests per composition
```

**Conventions**:
- **No hardcoded colors or fonts** in any component. Every visual property reads from a CSS variable.
- **Props are content + behavior**, never style. Style comes from theme.
- **Accessible by default**: all interactive components include `aria-*` props as needed.
- **Stories required**: every composition has a Storybook story rendered in all three archetypes.
- **shadcn updates**: re-vendoring a shadcn component (when upstream improves) is done via a documented script, not freehand.

**Storybook deployment**: Deployed to `ui.bestemeraldcoast.com` via Vercel preview, password-protected. Acts as the design-system reference for the operator and any future contractor.

**Consequences**:
- *Positive*: One source of truth for components.
- *Positive*: Storybook is a live spec — no Figma-vs-code drift.
- *Negative*: Storybook setup adds ~half day. Worth it.

---

## ADR-038 — Per-environment configuration (local, preview, production)

**Status**: Accepted

**Context**: Local dev needs a different Postgres (a Neon dev branch), different API keys (sandbox versions where available), different Resend domain (devnull or test inbox), different Cron behavior (disabled or shortened). Without an environment matrix, mistakes happen — production data shown in dev, test emails sent to real subscribers.

**Decision**:

**Three environments**:

| Environment | Vercel | Database | Email | Crons | Anthropic |
|---|---|---|---|---|---|
| **Development** | Local Next dev | Neon `dev` branch | Mailhog (Docker) | Disabled | Real, with low daily cap |
| **Preview** | Auto-PR deployments | Neon ephemeral branch (auto-created per PR) | Resend test mode | Disabled | Real, capped |
| **Production** | `main` branch deploy | Neon `production` branch | Resend (real) + SES (real) | Enabled | Real, full caps |

**Environment-specific config** in `packages/config/env.ts` with Zod validation:
- Required variables per env validated at boot.
- Boot fails loudly with a clear message when a required variable is missing.
- A `NODE_ENV` + `VERCEL_ENV` combo determines which env we're in.

**Safety rails**:
- Production database connection requires `VERCEL_ENV=production` AND a special `PROD_DB_ALLOWED=true` flag — prevents accidental local connection to prod.
- Sending emails outside production requires `EMAIL_REAL_SEND_ENABLED=true`. Otherwise, all emails go to Mailhog or Resend test mode.
- Banner across the top of ops-console in non-production environments: yellow "PREVIEW" or red "DEV" stripe.

**Consequences**:
- *Positive*: Hard to confuse environments.
- *Positive*: Boot failures are loud and clear.
- *Negative*: Extra setup for Mailhog locally. Worth it.

**HIG/UX note**: HIG values clear modal/state communication. The dev/preview banner is the same principle — the operator always knows which environment they're acting in.

---

## ADR-039 — Monorepo task graph & build pipeline (Turborepo)

**Status**: Accepted

**Context**: Three apps + ~6 packages = lots of build steps. Without a task graph, every change rebuilds everything. With a bad task graph, broken builds get cached and shipped.

**Decision**:

**Turborepo** as the monorepo orchestrator. `pnpm` as the package manager (faster, smaller node_modules, monorepo-friendly).

**Task graph** (in `turbo.json`):

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"],
      "env": ["DATABASE_URL", "..."]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test:unit": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "cache": false
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

**Vercel build**: Vercel auto-detects Turborepo. Each app project on Vercel has Root Directory set to `apps/[name]` and runs `pnpm turbo build --filter=[name]...`.

**Remote caching**: Vercel Remote Cache enabled — first push warms the cache, subsequent CI/preview builds finish in 1/4 the time.

**Conventions**:
- Every package has `package.json` scripts: `dev`, `build`, `lint`, `test:unit`, `type-check`.
- Internal packages use `workspace:*` versioning.
- Apps may import from `packages/*`; packages may not import from apps.
- A `packages/config-eslint/`, `packages/config-tsconfig/` carry shared configs.

**Consequences**:
- *Positive*: Builds are incremental and parallelized.
- *Positive*: CI is fast, even as the codebase grows.
- *Negative*: Slight learning curve for monorepo conventions. Documented in `docs/monorepo-conventions.md`.

---

## ADR-040 — Editorial-pipeline coupling and niche rotation algorithm

**Status**: Accepted

**Supersedes**: The one-sentence "Sunday cron generates briefs" placeholder previously in Phase 6. Extends and makes concrete the editorial calendar template in ADR-021.

**Context**: The project plan specified an editorial calendar template (when to publish what content type) and a flat priority niche list (what the lead pipeline hunts), but did not connect them. The brief queue cron in Phase 6 was referenced in one sentence with no algorithm. This left five concrete gaps unresolved:

1. **Niche-to-category mapping** — which categories cover which priority niches on each archetype.
2. **Niche rotation logic** — what determines next week's niche focus per site.
3. **Per-site niche assignment** — does every city cover every niche, or is coverage matched to local relevance.
4. **Seasonal triggers** — how seasonal patterns (wedding season, charter season, snowbird season, festivals) modulate the calendar.
5. **Brief content generation** — how concrete article angles and headlines get produced from a niche slot.

The system was loosely coupled: editorial published broadly, lead pipeline targeted priority niches, the operator noticed alignment manually. This worked at low volume but broke the publisher-first agency thesis (cold outreach anchored on real editorial inclusion) at scale, and produced operator workload the system was meant to absorb.

The operator's choices that shaped this ADR:
- **Coupling**: Tight — editorial follows Scout's output.
- **Network coordination**: Independent — each site rotates on its own schedule.
- **Operator workload**: 20-minute approval of a fully generated queue.

**Decision**: Adopt a tightly coupled, per-site-independent, algorithmically generated brief queue with operator approval. Specifically:

1. **Tight pipeline coupling.** The editorial calendar is driven primarily by lead pipeline activity over the trailing 14 days, modulated by seasonal multipliers and content debt. When Scout produces a cluster of leads in a niche-city pair, that pair's editorial coverage gets prioritized in the following week's brief queue.

2. **Per-site independent rotation.** Each city site runs its own rotation. The hub (`bestemeraldcoast.com`) does **not** lead the corridor with a weekly theme; it functions as a synthesis surface, publishing weekly aggregations of city activity and standalone regional roundups on a slower cadence (1-2 hub-original pieces per week).

3. **Algorithmic brief queue with 20-minute approval.** A new **Curator** agent (the 10th agent) runs every Sunday. It produces a per-site brief queue for the following 7 days with concrete headlines, angles, and recommended business mentions. The operator approves, edits, or swaps briefs in a dedicated ops-console view.

4. **Three new artifacts**, fully specified in the project plan's Phase 6:
   - A niche-category-archetype mapping (data, seeded once)
   - A seasonal multiplier table (data, refreshed annually)
   - A scoring algorithm (code, in `packages/editorial-scoring/`)

5. **Lead pipeline → editorial signal flow.** When a lead is created or transitions through Scout/Diagnoser/Pitcher, an event is recorded in a new `pipeline_signals` table tagged with `(niche, city, signal_strength)`. The Curator algorithm reads trailing 14 days of signals to weight niche selection.

**Schema additions** (full Drizzle definitions in project plan): `niches`, `niche_category_map`, `season_weights`, `season_events`, `pipeline_signals`, `briefs`, `evergreen_brief_bank`. Plus `minimumWeeklyArticles` / `maximumWeeklyArticles` columns on `sites`.

**Scoring algorithm components** (weighted composite, 0-100 each):

| Input | Weight | Source |
|---|---|---|
| Pipeline signal score | 0.35 | trailing 14 days of `pipeline_signals` for (niche, city) |
| Seasonal weight | 0.20 | `season_weights` × any active `season_events` |
| Content debt score | 0.20 | days since last article in (site, niche-mapped category) |
| Business inventory score | 0.10 | unfeatured businesses suitable for editorial |
| Content type fit | 0.10 | content_type appropriateness for (niche, recent coverage) |
| Niche editorial value | 0.05 | static value from niches table |

**Diversification rules enforced** after scoring: no same niche twice on same site in same week, max 2 listicles per site per week, hub gets aggregation logic instead of niche rotation, at least 1 profile per site per week, sponsored articles don't count toward niche slots.

**Consequences**:

*Positive*:
- The publisher-first thesis becomes operational. Outreach can reliably reference editorial coverage that just published or is about to.
- Operator's Sunday workload is bounded to ~20 minutes (review, not creation).
- Editor's prompt tunes against a tighter input distribution because briefs are structured, not improvised.
- Niche rotation is auditable — every brief has a documented score and reason.
- Independent site rotation means a slow week in one city doesn't drag the whole network's pace.

*Negative*:
- The hub loses its "weekly theme leader" role. It must be redesigned as an aggregator/synthesis surface (worth the tradeoff but a real change).
- Tight coupling means a quiet week from Scout produces a quiet brief queue. The Curator algorithm includes a fallback (seasonal evergreens, content-debt fillers) so editorial doesn't go dark.
- Per-site independent rotation means cross-city listicles ("Best charter captains corridor-wide") become a hub-original effort, not a natural byproduct of synchronized weeks.
- A new agent (Curator) and a new ops-console approval surface add Phase 6 scope. Phase 6 timeline expands from 3-4 weeks to 5-7 weeks.

*Risk mitigation*:
- The Curator algorithm includes a `minimumWeeklyVolume` floor per site. If proposals fall below the floor, it backfills from a seasonal-evergreen content bank.
- The brief queue is *editable*, not just approve/reject. The operator can always override the algorithm.
- Curator runs in proposal mode for the first 4 weeks. Only after stable approval rates does the queue auto-promote high-confidence briefs.

**HIG/UX note**: The Sunday approval surface in ops-console is a high-density review screen optimized for fast triage on iPhone. It uses the same swipe-right-approve / swipe-left-edit pattern as the existing `/m` approval flows (per ADR-029). Briefs are grouped by site, with seasonal context, scoring breakdown, and one-tap edit available. The 20-minute target is the design constraint that drives this surface.

---

## ADR-041 — Customer relationship & service operations layer

**Status**: Accepted

**Context**: The original project plan had `projects` and `project_tasks` tables (ADR-026) for tracking won deals through delivery, but no broader customer-relationship layer. As soon as the first deal closes, several gaps become operationally painful:

1. **No client identity unifies the records.** A business that buys a featured listing, then upgrades to a website build, then adds maintenance, then sponsors a newsletter is four disconnected rows in four tables, all pointing back to the same `business_id` but with no single "client view" that pulls them together.

2. **No communication history table.** Every conversation with a client — calls, emails after cold outreach, project check-ins, sponsorship discussions — has nowhere to live. The `outreach_messages` table is for cold outreach only. After a deal closes, communication scatters into the operator's inbox and memory.

3. **No SLA tracking.** Maintenance ticket response times, sponsored article turnaround, sponsorship pre-send confirmations — all implicit, none enforced. Customer service quality becomes "whatever the operator happens to remember."

4. **No proactive touch cadence.** Maintenance check-ins, featured listing renewals, post-launch follow-ups, NPS solicitations — none scheduled, all dependent on operator memory.

5. **No unified client dashboard.** The ops-console has separate views for leads, articles, projects — but no single screen showing "everything we have with [Business Name]" across all product lines.

These aren't oversights — they're the right gaps to address before the first deal closes, not after ten clients have accumulated and the system is reactive instead of proactive.

**Decision**: Add a first-class **Customer Relationship & Service Operations layer** to the system, peer to the lead pipeline and editorial pipeline. Specifically:

1. **A `clients` table** that gets populated when a lead transitions to `closed_won`. The client record unifies all product relationships: active products, lifetime value, last contact, scheduled touches, internal notes, NPS scores.

2. **A `communication_log` table** that captures every interaction across all channels (email, SMS, phone, video, in-person, Slack, IG DM, internal notes). Every email send/reply auto-logs via webhook; calls are logged manually via "Log a call" action; internal notes are first-class entries.

3. **A `tickets` table** with SLA tracking. Every active client has SLAs based on their product mix (maintenance: 4hr first response / 72hr resolution; sponsored content: 4hr/24hr; new build inquiry: 4hr/24hr; etc.). A background cron monitors SLA elapsed time and alerts on warning (75%) and breach (100%).

4. **A `scheduled_touches` table** that drives proactive contact. Touch types include maintenance check-ins, featured-listing reviews, 30/90/180-day post-launch sequences, sponsorship pre/post-send reminders, NPS requests, renewal warnings, and reactivation outreach for churned clients.

5. **A new agent — Concierge — the 11th agent.** Runs daily and weekly via Vercel cron. Drafts touches due today, surfaces SLA-at-risk tickets, recommends check-ins for clients gone quiet, generates renewal pipeline messages, and prepares quarterly business-review data. Concierge is read + draft only; the operator approves every touch in a dedicated queue, similar to Curator's brief queue.

6. **A unified client view in ops-console** at `/clients/[id]` (desktop) and `/m/clients/[id]` (mobile). Six tabs: Overview, Products, Communication, Tickets, Editorial mentions, Activity. Mobile uses iMessage-style chat bubble layout for the communication log.

7. **A global tickets view** at `/tickets` and `/m/tickets`, sorted by SLA-breach-soonest, color-coded green/yellow/red.

**Lead-to-client promotion logic**: When a lead transitions to `closed_won`, the system automatically:
- Creates a `clients` row promoting the business from prospect to active.
- Creates a `projects` row for the delivery (per ADR-026).
- Inserts an initial `communication_log` entry for the closing call.
- Schedules touches based on the offer type (e.g., 30/90/180-day post-launch for web builds, monthly check-ins for maintenance plans, quarterly NPS for any active client).
- Updates the business's `isClient` flag.

**SLA defaults per product** (seeded as configuration in `packages/config/sla-defaults.ts`, tunable per client):

| Product | First response | Resolution |
|---|---|---|
| Maintenance plan | 4 hours (business hours) | 72 hours |
| Active web build | 8 hours | 168 hours (1 week) |
| Featured listing | 24 hours | 168 hours |
| Sponsorship | 4 hours | 24 hours |
| Sponsored article | 8 hours | 120 hours (5 days) |
| Prospect inquiry | 4 hours | 24 hours |

**Inbound integration**: Email replies from existing clients (matched by email address) auto-create tickets with appropriate SLA. Replies from prospects route to existing `outreach_messages` flow. The system distinguishes by checking whether the sender email matches a `clients.primaryContactEmail` row.

**Schema additions** (full Drizzle definitions in project plan): `clients`, `communication_log`, `tickets`, `scheduled_touches`, plus enums for `client_status`, `communication_direction`, `communication_channel`, `ticket_status`, `ticket_priority`, `scheduled_touch_type`, `scheduled_touch_status`.

**Phase placement**: This layer slots into Phase 5 (Booking Loop + Mobile), expanding it from 2-3 weeks to 4-5 weeks. The reasoning: the moment the first deal closes, the client needs somewhere to live. Building this in Phase 5 means by the time you have a real client, the system handles them properly.

**Consequences**:

*Positive*:
- One screen per client, regardless of how many products they have.
- Every conversation searchable and findable in seconds.
- Customer-service excellence becomes structural, not memorial.
- SLA compliance is measurable and alertable.
- Proactive touches happen automatically — no client falls through the cracks.
- Year-over-year client metrics (retention, expansion, NPS) become trivially queryable.
- The Concierge agent absorbs ~70% of routine customer-relationship admin into a 5-10 min daily approval queue.

*Negative*:
- 4 new tables, 1 new agent, multiple new UI surfaces — significant Phase 5 expansion.
- The operator must commit to using the system. If communication still scatters into personal email, the unified view becomes inaccurate.
- Inbound auto-classification (prospect vs. client) needs to handle edge cases (forwarded emails, multiple email addresses per client).
- Concierge's drafted touches need quality oversight to prevent "robotic" check-ins that erode the personal relationship.

*Risk mitigation*:
- Concierge drafts in operator's voice (uses `editorial_feedback`-style learning loop, ADR-020 pattern).
- Touches that haven't been approved within 48 hours surface as urgent.
- The "log a call" action is one-tap on mobile to make manual logging frictionless.
- All Concierge messages go through ADR-034 Copy Quality Rubric before sending.

**HIG/UX note**: Apple's HIG values clarity through unified context. The client detail view follows that — every relevant piece of context for one client lives behind one tap, organized by tabs that match how the operator actually thinks about clients ("what are they paying for?" → Products tab; "what did we last talk about?" → Communication tab). The mobile communication log uses iMessage's chat-bubble pattern because it's the universally familiar mental model for "ongoing conversation with a person."

The client view is the surface where customer service either feels effortless or feels like a fight. Apple HIG's "deference" principle applies: chrome recedes, the conversation is the foreground. SLA warnings are quiet (yellow border, no modal interrupt) until breach (red, alerted). Concierge's drafted touches feel like personal notes the operator reviews, not auto-generated email templates.

---

## Appendix A — Decisions Cross-Reference

When reading other docs, this table maps where each decision applies:

| Affects | Relevant ADRs |
|---|---|
| Database design | 002, 003, 020, 021, 022, 023, 025, 026, 027, 028, 031, 040, 041 |
| Hosting & deploy | 001, 004, 008, 038, 039 |
| Security & ops | 006, 007, 012, 017, 018 |
| Email | 013, 014, 015, 024, 033 |
| SEO & content | 009, 010, 014, 015, 021, 022, 027, 028, 040 |
| Agents | 004, 018, 019, 020, 023, 024, 030, 031, 034, 040, 041 |
| UI/UX & design | 029, 032, 033, 036, 037, 040, 041 |
| Quality & testing | 016, 035, 036 |
| Analytics | 011 |
| Editorial automation | 020, 021, 040 |
| Customer relationships | 026, 041 |

---

## Appendix B — Decisions intentionally deferred to v2+

Documented for future reference, not scoped now:

- Multi-tenant agency mode (multiple operators).
- Multi-language editorial content (Spanish for Latin American tourism).
- Public job board / classifieds.
- Stripe billing automation (manual invoicing for first ~10 deals).
- Native iOS/Android app (`/m` route is sufficient).
- Public-facing API (third parties consuming BEC data).
- Business owner self-serve portal (login, edit listing, manage subscription).
- Real-time chat or community features.
- Per-site sending domains (revisit when 5,000+ subscribers and reputation established).
- Self-serve sponsorship inventory (revisit at 5,000+ subscribers).
- Event aggregation API integration (revisit Phase 6).
- IG DM webhook integration (revisit Phase 5+ when Meta business verification clears).

---

*This ADR document is versioned with the project plan. When a decision is overturned, mark its ADR as Superseded and link forward to its replacement. Never delete an ADR — the history of decisions is itself a tool.*

*MASTER document — supersedes all prior ADR documents and addendums. Last updated: master consolidation incorporating ADR-040 (editorial rotation) and ADR-041 (customer relationship operations).*
