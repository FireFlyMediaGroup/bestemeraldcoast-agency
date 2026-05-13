# Best Emerald Coast — Project Plan & Implementation Guide (MASTER)

> **MASTER source-of-truth implementation document.** Supersedes all prior project plans and addendums.
>
> **Companion**: `MASTER-bec-architecture-decisions.md` — 41 ADRs covering every significant decision in the build.
>
> **Audience**: the operator + Claude Code. Every phase is broken down into commits Claude Code can execute, with explicit acceptance criteria.
>
> ---
>
> **How to use this document with Claude Code**:
>
> 1. **Phase-by-phase execution.** Each phase below is a self-contained context that can be pasted into a Claude Code session. The phase tells Claude what to build, what schemas to use, what acceptance criteria must pass. No cross-references to other documents required mid-build.
>
> 2. **Per-commit prompts.** Within each phase, individual commits have ready-to-use prompts (in blockquotes prefixed with `>`). Each is sized for one focused work session.
>
> 3. **Acceptance gates are real.** Per ADR-035, every phase has a definition-of-done checklist. All boxes ticked before moving forward, no exceptions. Skipping gates compounds into Phase 6 chaos.
>
> 4. **The ADR doc is the "why" reference.** When something feels ambiguous in the plan, the ADR has the rationale.
>
> ---
>
> **Document map**:
> - This document = the *how* (schema, code, phases, commits, acceptance criteria)
> - `MASTER-bec-architecture-decisions.md` = the *what* and *why* (decisions, rationale, consequences)
>
> **How to use**: Phase 0 sets up the workspace. Phases 1-6 are executed in order. Each phase's checklist must be 100% green before moving forward (per ADR-035).

---

## Table of Contents

1. [Vision & Strategic Frame](#vision--strategic-frame)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [Repository Structure](#repository-structure)
5. [Database Schema](#database-schema)
6. [The Agents](#the-agents)
7. [Editorial Rotation Specification](#editorial-rotation-specification)
8. [Customer Relationship Specification](#customer-relationship-specification)
9. [Design System](#design-system)
10. [User Experience Principles (Apple HIG)](#user-experience-principles-apple-hig)
11. [Phase 0 — Workspace & Foundations](#phase-0--workspace--foundations)
12. [Phase 1 — Database, Ops Console, Lead Pipeline](#phase-1--database-ops-console-lead-pipeline)
13. [Phase 2 — Outreach + Editorial Foundation](#phase-2--outreach--editorial-foundation)
14. [Phase 3 — Newsletter Infrastructure](#phase-3--newsletter-infrastructure)
15. [Phase 4 — Asset Generation](#phase-4--asset-generation)
16. [Phase 5 — Booking Loop + Mobile + Customer Relationships](#phase-5--booking-loop--mobile--customer-relationships)
17. [Phase 6 — Editorial Automation + Growth Engine](#phase-6--editorial-automation--growth-engine)
18. [Operating Constraints & Guardrails](#operating-constraints--guardrails)
19. [Revenue Model](#revenue-model)
20. [Daily Operating Procedures](#daily-operating-procedures)

---

## Vision & Strategic Frame

Best Emerald Coast (BEC) is a **regional editorial network and automated local web design agency** covering the Florida Emerald Coast corridor — Pensacola through Panama City Beach. The business model is a media company with a services arm: a network of city-specific editorial sites builds an audience and an email list, which feeds a Claude Code-orchestrated agency engine that sells web design, hosting, featured listings, and newsletter sponsorships back into the same audience.

### The Two Flywheels

The system is two coordinated revenue engines that share the same database:

**Flywheel 1 — Editorial → Audience → Sponsorships**

Editor agent drafts articles → Operator approves & publishes → SEO + social drives readers → Newsletter signup forms capture them → Weekly newsletter sent via SES → List grows → Sponsorship slots become valuable → Recurring revenue independent of any web build.

**Flywheel 2 — Lead Pipeline → Web Design Sales**

Scout walks Google Maps → Diagnoser writes diagnosis + cold message draft → Builder generates Lovable mockup (top 5/day) → Filmer renders 10-second vertical video → Checker quality-gates the message → Pitcher sends via right channel → Operator approves replies → Mobile books Calendly call → Operator closes deal on the call.

**Where they connect**: the same `businesses` table feeds both. A business found by Scout can become an editorial subject (free listing), a featured listing ($199/yr), a web design client ($1.5K-$10K), AND a newsletter sponsor ($200-$1,500/send). One business record, four revenue lines.

### Strategic Insight

The newsletter changes the economic model. Instead of cold outreach to strangers, BEC operates as a **publisher-first agency**: cold outreach becomes editorial inclusion offers — *"We're featuring you in next Friday's bestdestinfl.com edition — here's a preview mockup of how your listing would look. Want to be included?"*

### The Domains

| Domain | Coverage | Archetype |
|---|---|---|
| bestemeraldcoast.com | Corridor-wide hub | Magazine |
| bestpensacola.com | Pensacola | Magazine |
| bestpensacolabeach.com | Pensacola Beach | Coastal |
| bestfortwaltonbeach.com | FWB / Navarre | Magazine |
| bestdestinfl.com | Destin | Coastal |
| bestsouthwalton.com | South Walton county | Premium |
| bestcr30a.com | 30A corridor | Premium |
| best30a.life | 30A lifestyle | Premium |

Priority business niches: charter fishing, vacation rental managers, wedding venues, seafood restaurants, HVAC / contractors, boutique hotels, dental practices, landscaping, auto detailing, salon/spa.

---

## Tech Stack

| Layer | Choice | ADR |
|---|---|---|
| Hosting (apps) | **Vercel Pro** | ADR-001 |
| Database | **Neon Postgres** (via Vercel marketplace) | ADR-002 |
| ORM | **Drizzle** with `@neondatabase/serverless` driver | ADR-002 |
| Framework | **Next.js 16** (App Router, Cache Components, async params, `proxy.ts`) | — |
| Language | TypeScript 5.5+ | — |
| Package manager | pnpm 9+ | ADR-039 |
| Monorepo | Turborepo | ADR-039 |
| Styling | Tailwind CSS v4 | — |
| Components | shadcn/ui (vendored) | ADR-037 |
| Auth | NextAuth (magic link, single-user) | — |
| Email — transactional | Resend + React Email | ADR-013 |
| Email — bulk newsletter | Amazon SES | ADR-013 |
| Object storage (hot) | Vercel Blob | ADR-005 |
| Object storage (cold/backup) | Backblaze B2 | ADR-005, ADR-006 |
| Agent orchestration | Claude Code, local Mac | ADR-004 |
| Agent runtime | Claude Sonnet 4.5+ via Anthropic API | — |
| MCP servers | Google Maps, Postgres (read), Resend, Calendly, Filesystem (scratch) | — |
| Analytics | PostHog Cloud + Plausible (secondary) | ADR-011 |
| Errors | Sentry | ADR-012 |
| Logs | Axiom | ADR-012 |
| Rate limiting / cache | Upstash Redis | ADR-017 |
| Bot defense | Cloudflare Turnstile | ADR-017 |
| DNS / Registrar | Cloudflare | ADR-008 |
| Secrets | 1Password (system of record) + Vercel env vars | ADR-007 |
| Testing | Vitest + Playwright + axe-core | ADR-016, ADR-036 |
| Storybook | Vercel-deployed, password-protected | ADR-037 |
| CI | GitHub Actions | ADR-016 |
| Background jobs (Curator materialization, SLA monitoring) | **Vercel Workflows** (default) or Inngest | ADR-040, ADR-041 |

### Why these choices

- **Vercel + Neon** — native integration, zero-config branching for previews, scale-to-zero on idle. The earlier Coolify plan was replaced because Vercel removes operational burden the operator shouldn't be carrying alone.
- **Drizzle over Prisma** — schemas-as-TypeScript, no codegen step, thin layer over SQL, plays well with Next.js 16 server components, and `drizzle-zod` gives free runtime validation matching the schema.
- **Resend + SES split** — Resend for transactional and outreach (best React Email integration, simple API). SES for bulk newsletter (~$0.10 per thousand emails vs. $200-500/month on Mailchimp at projected volume).
- **Claude Code on local Mac** — Vercel functions can't run multi-minute agent batches (per ADR-004). Local Mac is the right runtime for the orchestrator and most agents; iPhone runs Mobile agent.

### Next.js 16 specifics that matter

- `params` and `searchParams` are now Promises — `await props.params` in every dynamic route.
- **Cache Components and `"use cache"`** are the right tool for editorial pages, with `cacheTag` invalidation when articles publish.
- **`proxy.ts` replaces `middleware.ts`** — used for host-based site routing across the eight domains.
- **Turbopack stable** — significantly faster dev/build cycles.

---

## System Architecture

### Three concentric rings

```
┌─────────────────────────────────────────────────┐
│  RING 1: PUBLIC SURFACE (what readers see)      │
│  ─────────────────────────────────────────────  │
│  • 7 city sites + 1 hub (bestX.com)             │
│  • mail.bestemeraldcoast.com (subscribe)        │
│  • Articles, listicles, profiles, events        │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │  RING 2: CONTROL PLANE (operator only)    │  │
│  │  ───────────────────────────────────────  │  │
│  │  • ops.bestemeraldcoast.com               │  │
│  │  • Mobile /m route (Apple HIG-driven)     │  │
│  │  • Editorial composer, metrics, approvals │  │
│  │                                            │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  RING 3: AGENT ENGINE (background)  │  │  │
│  │  │  ─────────────────────────────────  │  │  │
│  │  │  • 9 Claude Code sub-agents         │  │  │
│  │  │  • Orchestrator (CLAUDE.md)         │  │  │
│  │  │  • MCP servers, runs on Mac         │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘

       ALL THREE RINGS SHARE ONE NEON POSTGRES
```

### Two software systems

**System A — Claude Code Agency Engine.** Lives in `agency/` directory. File-based agent definitions (`.claude/agents/*.md`), MCP server registry (`.mcp.json`), `CLAUDE.md` master orchestrator rules. Agents read/write to Postgres exclusively via the ops-console internal API (`/api/agent/*`). Per ADR-003.

**System B — Three Next.js Apps on Vercel:**
- `apps/editorial` — public editorial network, host-routed across 8 domains
- `apps/ops-console` — internal control plane at `ops.bestemeraldcoast.com`
- `apps/newsletter-public` — subscriber surface at `mail.bestemeraldcoast.com`

All three read/write to the same Neon Postgres.

---

## Repository Structure

```
best-emerald-coast/
├── apps/
│   ├── editorial/                  # 8-domain editorial network (host routing via proxy.ts)
│   ├── ops-console/                # Internal agency control plane + agent API
│   └── newsletter-public/          # Subscribe pages, archive, preferences
├── packages/
│   ├── db/                         # Drizzle schema + client (single source of truth)
│   ├── ui/                         # shadcn primitives + BEC compositions + theme
│   ├── email/                      # React Email templates + send routing
│   ├── content/                    # Editorial content types + queries
│   ├── agents/                     # Shared agent invocation/logging utilities
│   ├── analytics/                  # PostHog event taxonomy + helpers
│   ├── storage/                    # Vercel Blob + B2 abstraction
│   ├── logger/                     # Pino + Sentry + Axiom transports
│   ├── config/                     # Env validation (Zod), operational params
│   ├── config-eslint/              # Shared ESLint config
│   └── config-tsconfig/            # Shared tsconfig presets
├── agency/                         # Claude Code workspace (agent runtime)
│   ├── CLAUDE.md                   # Orchestrator rules
│   ├── .claude/
│   │   ├── agents/                 # 9 agent definitions
│   │   ├── commands/               # Slash commands for daily ops
│   │   └── rubrics/                # Copy quality, banned phrases
│   ├── .mcp.json                   # MCP server registry
│   ├── scripts/                    # Daily run shells, restore drills
│   └── state/                      # Scratch only (gitignored); per ADR-003
├── infra/
│   ├── docker-compose.yml          # Local dev: mailhog, redis, blob-emulator
│   └── vercel/                     # vercel.json per app, cron schedules
├── docs/
│   ├── runbooks/                   # Domain setup, restore drill, secret rotation
│   ├── editorial-calendar.md       # Per-site weekly cadence (ADR-021)
│   ├── monorepo-conventions.md
│   └── restore-drill-log.md
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## Database Schema

Schema lives in `packages/db/schema/` split by domain. Below is the v2 cut showing tables and relationships. **All schemas reflect the ADRs**; this is the implementation target.

### Core: Sites & Categories

```typescript
// packages/db/schema/sites.ts
export const sites = pgTable('sites', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  domain: text('domain').notNull().unique(),
  name: text('name').notNull(),
  tagline: text('tagline'),
  archetype: text('archetype').notNull(),       // 'magazine' | 'coastal' | 'premium'
  themeTokens: jsonb('theme_tokens').$type<SiteTheme>().notNull(),
  geoCenterLat: numeric('geo_center_lat'),
  geoCenterLng: numeric('geo_center_lng'),
  geoRadiusMiles: integer('geo_radius_miles'),
  isHub: boolean('is_hub').default(false),
  ogImageUrl: text('og_image_url'),
  faviconUrl: text('favicon_url'),
  sendingFromName: text('sending_from_name'),    // e.g., 'Pensacola Weekly'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').notNull().references(() => sites.id),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  parentId: uuid('parent_id'),
  sortOrder: integer('sort_order').default(0),
}, (t) => ({
  siteSlugUnique: uniqueIndex('cat_site_slug').on(t.siteId, t.slug),
}));
```

### Businesses (shared across editorial & agency)

```typescript
// packages/db/schema/businesses.ts
export const businesses = pgTable('businesses', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  niche: text('niche').notNull(),
  city: text('city').notNull(),
  primarySiteId: uuid('primary_site_id').references(() => sites.id),
  googlePlaceId: text('google_place_id').unique(),
  rating: numeric('rating'),
  reviewCount: integer('review_count'),
  websiteUrl: text('website_url'),
  websiteStatus: text('website_status'),         // 'none' | 'outdated' | 'modern'
  contactChannels: jsonb('contact_channels').$type<ContactChannel[]>(),
  isClient: boolean('is_client').default(false),
  isFeatured: boolean('is_featured').default(false),
  editorialSummary: text('editorial_summary'),
  // ADR-031: risk + DNC
  riskFlag: text('risk_flag'),                   // 'high' | 'medium' | 'low' | null
  doNotContact: boolean('do_not_contact').default(false).notNull(),
  doNotContactReason: text('do_not_contact_reason'),
  doNotContactAt: timestamp('do_not_contact_at'),
  delistedFromEditorial: boolean('delisted_from_editorial').default(false).notNull(),
  lastEnrichedAt: timestamp('last_enriched_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const businessEnrichmentLog = pgTable('business_enrichment_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  fieldName: text('field_name').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  source: text('source').notNull(),              // 'scout' | 'diagnoser' | 'cron' | 'operator'
  enrichedAt: timestamp('enriched_at').defaultNow(),
});
```

### Lead Pipeline & Outreach

```typescript
// packages/db/schema/leads.ts
export const leadStatus = pgEnum('lead_status', [
  'new', 'diagnosed', 'build_ready', 'approved_to_send',
  'sent', 'replied', 'booked', 'closed_won', 'closed_lost',
]);

export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  status: leadStatus('status').notNull().default('new'),
  diagnosis: jsonb('diagnosis').$type<Diagnosis>(),
  offer: jsonb('offer').$type<Offer>(),
  mockupUrl: text('mockup_url'),
  videoUrl: text('video_url'),
  notes: text('notes'),
  lockedBy: text('locked_by'),
  lockedAt: timestamp('locked_at'),
  gapScoreSnapshot: integer('gap_score_snapshot'),
  scoringVersion: integer('scoring_version').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const leadStatusHistory = pgTable('lead_status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  leadId: uuid('lead_id').notNull().references(() => leads.id),
  fromStatus: leadStatus('from_status'),
  toStatus: leadStatus('to_status').notNull(),
  changedBy: text('changed_by').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow(),
});

// packages/db/schema/outreach.ts
export const replySentiment = pgEnum('reply_sentiment', [
  'positive', 'negative', 'neutral', 'question', 'out_of_office', 'unsubscribe_request',
]);

export const outreachMessages = pgTable('outreach_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  leadId: uuid('lead_id').notNull().references(() => leads.id),
  channel: text('channel').notNull(),            // 'email' | 'sms' | 'ig_dm'
  draft: text('draft').notNull(),
  finalCopy: text('final_copy'),
  checkerPass: boolean('checker_pass').default(false),
  checkerScore: integer('checker_score'),        // 0-12 per ADR-034
  checkerNotes: jsonb('checker_notes'),
  approvedAt: timestamp('approved_at'),
  approvedBy: text('approved_by'),
  sentAt: timestamp('sent_at'),
  sentMessageId: text('sent_message_id'),
  repliedAt: timestamp('replied_at'),
  replyBody: text('reply_body'),
  replySentiment: replySentiment('reply_sentiment'),
  draftedResponse: text('drafted_response'),
  responseSentAt: timestamp('response_sent_at'),
  trackingCode: text('tracking_code').unique(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Editorial, Authors, Images, Events

```typescript
// packages/db/schema/editorial.ts
export const articleStatus = pgEnum('article_status', [
  'draft', 'review', 'scheduled', 'published', 'archived',
]);

export const contentType = pgEnum('content_type', [
  'listicle', 'profile', 'guide', 'event_coverage', 'news', 'sponsored', 'evergreen',
]);

export const articles = pgTable('articles', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').notNull().references(() => sites.id),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  bodyMdx: text('body_mdx').notNull(),
  originalDraftBody: text('original_draft_body'),  // Editor's first draft, preserved
  status: articleStatus('status').notNull().default('draft'),
  contentType: contentType('content_type').notNull().default('listicle'),
  authorId: uuid('author_id').references(() => authors.id),
  reviewedById: uuid('reviewed_by_id').references(() => authors.id),
  categoryId: uuid('category_id').references(() => categories.id),
  heroImageId: uuid('hero_image_id').references(() => images.id),
  tags: jsonb('tags').$type<string[]>(),
  publishedAt: timestamp('published_at'),
  scheduledFor: timestamp('scheduled_for'),
  // Hub syndication, ADR-010
  syndicatedToHub: boolean('syndicated_to_hub').default(false),
  hubAdaptedBody: text('hub_adapted_body'),
  hubCanonicalOverride: boolean('hub_canonical_override').default(false),
  // Sponsored content, ADR-015
  isSponsored: boolean('is_sponsored').default(false).notNull(),
  sponsoredByBusinessId: uuid('sponsored_by_business_id').references(() => businesses.id),
  sponsorshipDisclosure: text('sponsorship_disclosure'),
  // SEO
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  ogImageId: uuid('og_image_id').references(() => images.id),
  viewCount: integer('view_count').default(0),
  lastViewedAt: timestamp('last_viewed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({
  siteSlugUnique: uniqueIndex('article_site_slug_unique').on(t.siteId, t.slug),
}));

export const articleBusinesses = pgTable('article_businesses', {
  articleId: uuid('article_id').notNull().references(() => articles.id),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  rank: integer('rank'),
}, (t) => ({
  pk: primaryKey({ columns: [t.articleId, t.businessId] }),
}));

// ADR-020: Editor feedback loop
export const editorialFeedback = pgTable('editorial_feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id').notNull().references(() => articles.id),
  draftBody: text('draft_body').notNull(),
  finalBody: text('final_body').notNull(),
  editsSummary: text('edits_summary'),
  rejectedDraft: boolean('rejected_draft').default(false),
  rejectionReason: text('rejection_reason'),
  promptVersion: integer('prompt_version'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ADR-027: Authors
export const authors = pgTable('authors', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  displayName: text('display_name').notNull(),
  bio: text('bio'),
  avatarImageId: uuid('avatar_image_id'),
  isAi: boolean('is_ai').default(false),
  isHumanReviewer: boolean('is_human_reviewer').default(false),
  email: text('email'),
  twitter: text('twitter'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ADR-022: Images
export const imageProvenance = pgEnum('image_provenance', [
  'owned', 'business_submitted', 'ai_generated', 'licensed_stock', 'unsplash_free', 'public_domain',
]);

export const images = pgTable('images', {
  id: uuid('id').defaultRandom().primaryKey(),
  blobUrl: text('blob_url').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  altText: text('alt_text').notNull(),           // required, accessibility
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
  role: text('role').notNull(),                  // 'hero' | 'inline' | 'gallery' | 'og_card'
  position: integer('position'),
}, (t) => ({
  pk: primaryKey({ columns: [t.articleId, t.imageId, t.role] }),
}));

// ADR-028: Events
export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').notNull().references(() => sites.id),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }),
  recurrence: text('recurrence'),
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

### Audience, Sponsorships, Projects, Ops

```typescript
// packages/db/schema/audience.ts
export const subscriberStatus = pgEnum('subscriber_status', [
  'pending', 'active', 'unsubscribed', 'bounced', 'complained',
]);

export const subscribers = pgTable('subscribers', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  status: subscriberStatus('status').notNull().default('pending'),
  primarySiteId: uuid('primary_site_id').references(() => sites.id),
  interestedSiteIds: jsonb('interested_site_ids').$type<string[]>().default([]),
  interestedCategories: jsonb('interested_categories').$type<string[]>().default([]),
  source: text('source'),
  sourceUrl: text('source_url'),
  ipCountry: text('ip_country'),
  lastOpenedAt: timestamp('last_opened_at'),
  lastClickedAt: timestamp('last_clicked_at'),
  totalOpens: integer('total_opens').default(0),
  totalClicks: integer('total_clicks').default(0),
  doubleOptInToken: text('double_opt_in_token'),
  confirmedAt: timestamp('confirmed_at'),
  unsubscribedAt: timestamp('unsubscribed_at'),
  unsubscribeReason: text('unsubscribe_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const newsletterIssues = pgTable('newsletter_issues', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').references(() => sites.id),
  issueNumber: integer('issue_number').notNull(),
  subject: text('subject').notNull(),
  preheader: text('preheader'),
  contentMdx: text('content_mdx').notNull(),
  scheduledAt: timestamp('scheduled_at'),
  sentAt: timestamp('sent_at'),
  recipientCount: integer('recipient_count'),
  openCount: integer('open_count').default(0),
  clickCount: integer('click_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const newsletterSends = pgTable('newsletter_sends', {
  id: uuid('id').defaultRandom().primaryKey(),
  issueId: uuid('issue_id').notNull().references(() => newsletterIssues.id),
  subscriberId: uuid('subscriber_id').notNull().references(() => subscribers.id),
  sentAt: timestamp('sent_at'),
  openedAt: timestamp('opened_at'),
  clickedAt: timestamp('clicked_at'),
  bouncedAt: timestamp('bounced_at'),
  bounceType: text('bounce_type'),
}, (t) => ({
  uniqueIssueSubscriber: uniqueIndex('newsletter_sends_unique').on(t.issueId, t.subscriberId),
}));

// packages/db/schema/monetization.ts (ADR-025)
export const featuredPlacement = pgEnum('featured_placement', [
  'hero', 'category_top', 'sidebar', 'newsletter',
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

export const sponsorships = pgTable('sponsorships', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  issueId: uuid('issue_id').references(() => newsletterIssues.id),
  articleId: uuid('article_id').references(() => articles.id),
  type: text('type').notNull(),
  amountCents: integer('amount_cents').notNull(),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  status: text('status').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// packages/db/schema/projects.ts (ADR-026)
export const projectStatus = pgEnum('project_status', [
  'kickoff', 'design', 'build', 'review', 'launched', 'maintenance', 'paused', 'closed',
]);

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  leadId: uuid('lead_id').references(() => leads.id),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  offerType: text('offer_type').notNull(),
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
  status: text('status').notNull().default('todo'),
  dueAt: timestamp('due_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// packages/db/schema/ops.ts (ADR-018, ADR-019)
export const agentRuns = pgTable('agent_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  agentName: text('agent_name').notNull(),
  promptVersion: integer('prompt_version'),
  invokedBy: text('invoked_by').notNull(),
  inputLeadIds: jsonb('input_lead_ids').$type<string[]>(),
  outputSummary: text('output_summary'),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  cacheCreationTokens: integer('cache_creation_tokens'),
  cacheReadTokens: integer('cache_read_tokens'),
  costUsd: numeric('cost_usd'),
  durationMs: integer('duration_ms'),
  status: text('status').notNull(),
  error: text('error'),
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
});

export const agentBudgets = pgTable('agent_budgets', {
  agentName: text('agent_name').primaryKey(),
  dailyBudgetUsd: numeric('daily_budget_usd').notNull(),
  monthlyBudgetUsd: numeric('monthly_budget_usd').notNull(),
  hardStop: boolean('hard_stop').default(true).notNull(),
});
```

### Editorial Rotation (ADR-040)

```typescript
// packages/db/schema/editorial-rotation.ts

export const niches = pgTable('niches', {
  id: text('id').primaryKey(),                     // 'charter_fishing', 'wedding_venues', etc.
  displayName: text('display_name').notNull(),
  commercialValue: integer('commercial_value').notNull(),   // 0-100
  editorialValue: integer('editorial_value').notNull(),     // 0-100
  primaryArchetypes: jsonb('primary_archetypes').$type<Archetype[]>().notNull(),
  excludedArchetypes: jsonb('excluded_archetypes').$type<Archetype[]>().default([]),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const nicheCategoryMap = pgTable('niche_category_map', {
  id: uuid('id').defaultRandom().primaryKey(),
  nicheId: text('niche_id').notNull().references(() => niches.id),
  archetype: text('archetype').notNull(),          // 'magazine' | 'coastal' | 'premium'
  primaryCategorySlug: text('primary_category_slug').notNull(),
  secondaryCategorySlug: text('secondary_category_slug'),
  isExcluded: boolean('is_excluded').default(false).notNull(),
}, (t) => ({
  uniqueMapping: uniqueIndex('niche_archetype_unique').on(t.nicheId, t.archetype),
}));

export const seasonWeights = pgTable('season_weights', {
  id: uuid('id').defaultRandom().primaryKey(),
  nicheId: text('niche_id').notNull().references(() => niches.id),
  month: integer('month').notNull(),               // 1-12
  multiplier: numeric('multiplier').notNull(),     // 0.5 - 2.0
  notes: text('notes'),
}, (t) => ({
  uniqueNicheMonth: uniqueIndex('niche_month_unique').on(t.nicheId, t.month),
}));

export const seasonEvents = pgTable('season_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  boostedNicheIds: jsonb('boosted_niche_ids').$type<string[]>().notNull(),
  multiplier: numeric('multiplier').notNull(),
  notes: text('notes'),
});

export const pipelineSignals = pgTable('pipeline_signals', {
  id: uuid('id').defaultRandom().primaryKey(),
  nicheId: text('niche_id').notNull().references(() => niches.id),
  city: text('city').notNull(),
  signalType: text('signal_type').notNull(),       // 'lead_added', 'diagnosis_done', 'reply_received', etc.
  signalStrength: integer('signal_strength').notNull(),
  leadId: uuid('lead_id').references(() => leads.id),
  occurredAt: timestamp('occurred_at').defaultNow(),
}, (t) => ({
  byNicheCity: index('pipeline_signals_niche_city').on(t.nicheId, t.city, t.occurredAt),
}));

export const briefStatus = pgEnum('brief_status', [
  'proposed', 'approved', 'rejected', 'edited', 'in_draft', 'published', 'expired',
]);

export const briefs = pgTable('briefs', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').notNull().references(() => sites.id),
  targetWeekStart: date('target_week_start').notNull(),
  slot: text('slot').notNull(),                    // 'mon-listicle', 'mon-profile', etc.
  nicheId: text('niche_id').notNull().references(() => niches.id),
  contentType: text('content_type').notNull(),
  proposedHeadline: text('proposed_headline').notNull(),
  proposedAngle: text('proposed_angle').notNull(),
  proposedBusinessIds: jsonb('proposed_business_ids').$type<string[]>().default([]),
  proposedKeywords: jsonb('proposed_keywords').$type<string[]>().default([]),
  finalScore: numeric('final_score').notNull(),
  componentScores: jsonb('component_scores').$type<Record<string, number>>().notNull(),
  reasonSummary: text('reason_summary').notNull(),
  status: briefStatus('status').notNull().default('proposed'),
  approvedAt: timestamp('approved_at'),
  approvedBy: text('approved_by'),
  editedHeadline: text('edited_headline'),
  editedAngle: text('edited_angle'),
  rejectedReason: text('rejected_reason'),
  articleId: uuid('article_id').references(() => articles.id),
  curatorRunId: uuid('curator_run_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const evergreenBriefBank = pgTable('evergreen_brief_bank', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteArchetype: text('site_archetype').notNull(),
  contentType: text('content_type').notNull(),
  category: text('category'),
  proposedHeadline: text('proposed_headline').notNull(),
  proposedAngle: text('proposed_angle').notNull(),
  lastUsedAt: timestamp('last_used_at'),
  timesUsed: integer('times_used').default(0),
  notes: text('notes'),
});

// Add to existing sites table:
//   minimumWeeklyArticles: integer('minimum_weekly_articles').default(2),
//   maximumWeeklyArticles: integer('maximum_weekly_articles').default(3),
```

### Customer Relationships (ADR-041)

```typescript
// packages/db/schema/clients.ts

export const clientStatus = pgEnum('client_status', [
  'active', 'paused', 'churned', 'prospect',
]);

export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().unique().references(() => businesses.id),
  status: clientStatus('status').notNull().default('active'),
  primaryContactName: text('primary_contact_name'),
  primaryContactEmail: text('primary_contact_email'),
  primaryContactPhone: text('primary_contact_phone'),
  preferredContactChannel: text('preferred_contact_channel'),  // 'email' | 'sms' | 'phone'
  becameClientAt: timestamp('became_client_at').notNull(),
  churnedAt: timestamp('churned_at'),
  churnReason: text('churn_reason'),
  // Aggregates (denormalized; refreshed nightly via cron)
  lifetimeValueCents: integer('lifetime_value_cents').default(0),
  activeProductCount: integer('active_product_count').default(0),
  lastContactedAt: timestamp('last_contacted_at'),
  nextScheduledTouchAt: timestamp('next_scheduled_touch_at'),
  internalNotes: text('internal_notes'),
  npsScore: integer('nps_score'),
  npsCollectedAt: timestamp('nps_collected_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const communicationDirection = pgEnum('communication_direction', [
  'inbound', 'outbound', 'internal_note',
]);

export const communicationChannel = pgEnum('communication_channel', [
  'email', 'sms', 'phone_call', 'video_call', 'in_person', 'slack', 'instagram_dm', 'note',
]);

export const communicationLog = pgTable('communication_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  leadId: uuid('lead_id').references(() => leads.id),
  projectId: uuid('project_id').references(() => projects.id),
  ticketId: uuid('ticket_id'),
  direction: communicationDirection('direction').notNull(),
  channel: communicationChannel('channel').notNull(),
  occurredAt: timestamp('occurred_at').notNull(),
  subject: text('subject'),
  body: text('body'),
  attachmentUrls: jsonb('attachment_urls').$type<string[]>().default([]),
  durationMinutes: integer('duration_minutes'),
  participantsExternal: jsonb('participants_external').$type<string[]>().default([]),
  sentiment: text('sentiment'),                    // 'positive' | 'neutral' | 'negative' | 'urgent'
  category: text('category'),                      // 'sales' | 'support' | 'check_in' | 'delivery' | 'billing'
  externalMessageId: text('external_message_id'),  // Resend/Gmail message ID
  threadId: text('thread_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const ticketStatus = pgEnum('ticket_status', [
  'open', 'in_progress', 'waiting_on_client', 'resolved', 'closed',
]);

export const ticketPriority = pgEnum('ticket_priority', [
  'low', 'normal', 'high', 'urgent',
]);

export const tickets = pgTable('tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  projectId: uuid('project_id').references(() => projects.id),
  title: text('title').notNull(),
  description: text('description'),
  status: ticketStatus('status').notNull().default('open'),
  priority: ticketPriority('priority').notNull().default('normal'),
  category: text('category'),                      // 'bug' | 'change_request' | 'question' | 'billing' | 'feature_request'
  slaResponseDueAt: timestamp('sla_response_due_at'),
  slaResolutionDueAt: timestamp('sla_resolution_due_at'),
  firstRespondedAt: timestamp('first_responded_at'),
  resolvedAt: timestamp('resolved_at'),
  closedAt: timestamp('closed_at'),
  slaWarning: boolean('sla_warning').default(false),
  slaBreach: boolean('sla_breach').default(false),
  assignedTo: text('assigned_to'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const scheduledTouchType = pgEnum('scheduled_touch_type', [
  'maintenance_check_in', 'featured_listing_review',
  'post_launch_30_day', 'post_launch_90_day', 'post_launch_180_day',
  'sponsorship_pre_send', 'sponsorship_post_send',
  'nps_request', 'renewal_warning', 'renewal_final',
  'reactivation', 'birthday', 'manual',
]);

export const scheduledTouchStatus = pgEnum('scheduled_touch_status', [
  'pending', 'completed', 'skipped', 'overdue',
]);

export const scheduledTouches = pgTable('scheduled_touches', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  type: scheduledTouchType('type').notNull(),
  scheduledFor: timestamp('scheduled_for').notNull(),
  status: scheduledTouchStatus('status').notNull().default('pending'),
  context: jsonb('context'),                       // arbitrary data the touch needs
  draftedMessage: text('drafted_message'),         // Concierge drafts; operator approves
  completedAt: timestamp('completed_at'),
  skippedReason: text('skipped_reason'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## The Agents

**Eleven sub-agents**, each with a single clear responsibility. All run via Claude Code on the operator's local Mac (per ADR-004), except Curator and Concierge which run on Vercel cron + Workflows for predictable scheduling. Each writes to Postgres via the ops-console agent API (per ADR-003).

### 1. Scout — Lead Discovery

**Input**: a query (niche + city) like `pensacola charter fishing`.
**Output**: rows in `businesses` with Google Place data + new rows in `leads` with status `new`.
**Daily cap**: 150 businesses scanned, 30 leads added (ADR-030).
**Tools**: Google Maps MCP, Postgres MCP (read), agent API (write).
**Prompt**: `agency/.claude/agents/scout.md`. Versioned per ADR-019.

### 2. Diagnoser — Website Analysis

**Input**: lead id with status `new`.
**Output**: `leads.diagnosis` populated, `leads.offer` populated, status → `diagnosed`.
**Daily cap**: 30 (matches Scout).
**Behavior**: visits the business website, evaluates against a checklist (loading speed, mobile responsiveness, age signals, conversion-element presence, schema markup, indexing). Writes a 50-word diagnosis. Drafts a tiered offer ($1.5K starter, $3.5K standard, $7.5K growth, $200/mo maintenance) based on `gap_score`.
**Voice rule**: writes like a thoughtful local consultant, not a salesperson. No banned phrases (ADR-034).

### 3. Builder — Mockup Generation

**Input**: lead with status `build_ready`.
**Output**: a Lovable-generated mockup, screenshot saved to Vercel Blob, URL written to `leads.mockupUrl`.
**Daily cap**: 4 (ADR-030).
**Behavior**: takes the diagnosis + business details, generates a Lovable prompt, captures the result, runs a self-review, retries up to 2 times. The mockup is **not** the final website — it's a teaser image.

### 4. Filmer — Video Generation

**Input**: a lead with `mockupUrl`.
**Output**: a 10-second vertical (9:16) MP4 saved to Blob, URL written to `leads.videoUrl`.
**Daily cap**: 4 (matches Builder).
**Behavior**: Higgsfield API call, scripted hook ("Hey [Name], here's what your site could look like…"), captures the mockup, adds CTA endcard.

### 5. Checker — Quality Gate

**Input**: any draft outreach message.
**Output**: pass/fail + score 0-12 (ADR-034 rubric), notes.
**Daily cap**: 60 passes (covers retries).
**Behavior**: scores against Specificity, Length, Voice, AI markers, Local accuracy, CTA clarity. ≥9/12 with no zero in any dimension passes. Failures route back to Diagnoser/Pitcher with notes.

### 6. Pitcher — Send Routing

**Input**: an approved outreach message.
**Output**: actual send (email via Resend, SMS via Twilio, IG DM manual), `outreachMessages.sentAt`/`sentMessageId` recorded.
**Daily cap**: 30 across channels.
**Behavior**: picks the right channel based on `businesses.contactChannels`. Adds tracking codes for click attribution. Respects rate limits (avoid burst sends).

### 7. Mobile — Reply Triage & Response

**Input**: an inbound reply (`outreachMessages.repliedAt IS NOT NULL`).
**Output**: a drafted response in `outreachMessages.draftedResponse`, awaiting operator approval on `/m`.
**Behavior**: reads thread context, classifies intent, drafts conversational reply (≤80 words, includes Calendly link if appropriate). Operator approves/edits/sends from iPhone.

### 8. Editor — Editorial Drafting

**Input**: a content brief (site, content type, target keyword, businesses to feature).
**Output**: a draft article in `articles` with `status='draft'`.
**Daily cap**: 2 drafts/day initially, ramping to 3-4 once feedback loop tunes (ADR-020).
**Behavior**: writes in the site's voice (per archetype), uses verified business details from `businesses` + `images`, follows the editorial calendar (ADR-021), follows banned-phrase rules (ADR-034). Operator edits in the composer; on publish, edits are captured in `editorial_feedback` for the prompt-refinement loop.

### 9. Growth — Audience & Optimization

**Input**: weekly metrics from PostHog + Postgres.
**Output**: a Friday morning report in ops-console with 3 specific recommendations.
**Behavior**: identifies highest-performing articles by signup conversion, lowest-performing categories, subject-line patterns that win, sponsorship slot inventory, and proposes 3 actionable tweaks.

### 10. Curator — Editorial Brief Queue Generator

**Input**: trailing 14 days of pipeline signals + seasonal weights + content debt + business inventory.
**Output**: 14 briefs/week across 8 sites, written to `briefs` table with `status='proposed'`.
**Daily cap**: runs once weekly (Sunday 11pm ET); produces 14-18 briefs per run.
**Behavior**: Reads scored candidates from the editorial scoring algorithm (`packages/editorial-scoring/`), applies diversification rules (no same niche twice/site/week, max 2 listicles/site/week, etc.), generates concrete headlines and angles per brief, links proposed business mentions, generates hub aggregates separately. Backfills from `evergreen_brief_bank` when scoring rankings fall below threshold.
**Runtime**: Vercel cron triggers scoring (pure SQL/TS, fits in function timeout); brief materialization (LLM-heavy headline/angle generation) runs in Vercel Workflows for longer timeout.
**Slash command**: `/curate-week [weekStart]` for manual invocation.
**Specification**: full algorithm and data tables in [Editorial Rotation Specification](#editorial-rotation-specification) section.

### 11. Concierge — Customer Service Operations

**Input**: scheduled touches due, tickets approaching SLA, clients gone quiet, renewals approaching.
**Output**: drafted touches in `scheduled_touches.draftedMessage`, surfaced in `/m/concierge` for operator approval. SLA breach alerts.
**Daily cap**: 5-15 drafted touches per day.
**Behavior**: Daily — scans `scheduled_touches` due today, drafts appropriate message based on touch type (maintenance check-in, post-launch sequence, sponsorship pre-send reminder, NPS request, renewal warning, etc.) and client context. Surfaces SLA-at-risk tickets with severity escalation. Weekly — scans active clients with `lastContactedAt > 30 days`, recommends check-in cadence, generates renewal pipeline. Monthly — scans completed projects past 30 days for clients without an NPS request.
**Constraints**: Read + draft only. Never sends autonomously. All touches go through operator approval queue at `/m/concierge`. Drafts run through ADR-034 Copy Quality Rubric before surfacing.
**Runtime**: Vercel cron — daily 7am ET for daily run, Monday 7am for weekly run, 1st of month 7am for monthly.
**Slash command**: `/run-concierge` for manual invocation.
**Specification**: full touch types and SLA defaults in [Customer Relationship Specification](#customer-relationship-specification) section.

### Orchestrator (CLAUDE.md)

The orchestrator is the master rules document the operator types `claude` against. It coordinates agents, enforces daily caps, runs the budget check (ADR-018), reads operational params (ADR-030), and routes work to the right sub-agent. It does not write structured data directly — every mutation goes through the agent API.

---

## Editorial Rotation Specification

> **Implements ADR-040.** This is the full spec for how the editorial calendar gets generated, scored, and approved each week.

### Conceptual model — three layers

```
LAYER 3: BRIEF QUEUE (operator-facing)
• 14 briefs per week per network (~2 per site)
• Each brief: site + slot + niche + content type + headline + angle + businesses + score
• Generated Sunday 11pm ET; operator approves Monday morning in ~20 minutes

         ↑ generated by

LAYER 2: SCORING ALGORITHM (the engine)
• For each (site, slot) pair, score every eligible (niche, content_type) candidate
• Inputs: pipeline signals, season weights, content debt, content cap, business inventory, prior coverage
• Output: ranked candidates → top 1-2 per slot

         ↑ reads from

LAYER 1: DATA FOUNDATION (seeded once + updated daily)
• niches (the 10 priority niches with commercial/editorial scores)
• niche_category_map (static, archetype-aware)
• season_weights (annual table)
• season_events (named seasonal triggers)
• pipeline_signals (event log, written by Scout/Diagnoser/Pitcher)
• prior_coverage (computed from articles table)
• business_inventory (computed from businesses table)
```

### The priority niches with profiles

Each niche has commercial value (agency revenue) and editorial value (audience growth). The algorithm uses both.

| Niche | Commercial value | Editorial value | Primary archetype fit | Notes |
|---|---|---|---|---|
| Charter fishing | High | Medium-high | Coastal | Peak May-Sep; bookings-driven |
| Wedding venues | High | High | Premium, Coastal | Peak Apr-Jun + Oct; high LTV |
| Vacation rental managers | High | Medium | All | Year-round; multi-property accounts |
| Boutique hotels | High | Medium-high | Premium, Coastal | Year-round; high touch |
| Seafood restaurants | Medium | Very high | All | Year-round; biggest traffic driver |
| Dental practices | High | Low-medium | Magazine | Year-round; family-focused content |
| HVAC / contractors | Medium-high | Low | Magazine | Seasonal demand; service-emergency content |
| Salon / spa | Medium | Medium | Premium, Coastal | Wedding tie-in; lifestyle content |
| Landscaping | Medium | Low | Magazine | Spring peak; visual-friendly |
| Auto detailing | Low-medium | Low | Magazine | Year-round; underserved niche |

### Niche-category-archetype mapping

**Magazine (Pensacola, FWB)**:
- Charter fishing → Things to Do
- Wedding venues → Local Business
- Vacation rental managers → Stay
- Boutique hotels → Stay
- Seafood restaurants → Eat & Drink
- Dental, HVAC, Salon, Landscaping, Auto detailing → Local Business

**Coastal (Pensacola Beach, Destin)**:
- Charter fishing → Charters & Boats
- Wedding venues → Events
- VRMs, Boutique hotels → Stay
- Seafood restaurants → Eat & Drink
- Dental, Salon, HVAC (low priority), Landscaping (low priority), Auto detailing (low priority) → Lifestyle

**Premium (South Walton, 30A sites)**:
- Charter fishing → Restaurants & Bars (only when paired with food)
- Wedding venues → Weddings & Events
- VRMs, Boutique hotels → Stays & Homes
- Seafood restaurants → Restaurants & Bars
- Salon → Wellness & Beauty
- Dental → Wellness & Beauty (very low priority)
- HVAC, Auto detailing → **excluded** (wrong archetype fit)
- Landscaping → Style & Design (only architectural/garden coverage)

**Note**: Premium sites exclude some niches entirely. A 30A site running an HVAC profile breaks the editorial voice. The algorithm respects exclusions.

### Seasonal weight system

Multipliers per niche per month (0.5 to 2.0 range; 1.0 = neutral). Applied during scoring.

| Niche | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Charter fishing | 0.6 | 0.7 | 1.0 | 1.3 | 1.5 | 1.5 | 1.5 | 1.4 | 1.3 | 1.1 | 0.7 | 0.6 |
| Wedding venues | 0.8 | 0.9 | 1.2 | 1.5 | 1.5 | 1.4 | 0.9 | 0.9 | 1.0 | 1.4 | 1.0 | 0.8 |
| Vacation rental managers | 1.2 | 1.3 | 1.4 | 1.2 | 1.0 | 1.1 | 1.2 | 1.1 | 0.9 | 0.9 | 1.0 | 1.3 |
| Boutique hotels | 1.0 | 1.1 | 1.3 | 1.2 | 1.1 | 1.1 | 1.2 | 1.1 | 0.9 | 1.0 | 0.9 | 1.0 |
| Seafood restaurants | 0.9 | 0.9 | 1.2 | 1.3 | 1.2 | 1.2 | 1.3 | 1.2 | 1.0 | 1.2 | 1.0 | 1.0 |
| Dental practices | 1.1 | 1.0 | 1.0 | 1.0 | 0.9 | 0.9 | 1.0 | 1.1 | 1.1 | 1.0 | 1.0 | 1.1 |
| HVAC / contractors | 1.2 | 1.1 | 1.0 | 0.9 | 1.0 | 1.3 | 1.4 | 1.3 | 1.0 | 0.9 | 1.0 | 1.1 |
| Salon / spa | 1.0 | 1.1 | 1.3 | 1.4 | 1.3 | 1.2 | 1.0 | 1.0 | 1.0 | 1.2 | 1.1 | 1.1 |
| Landscaping | 0.7 | 0.8 | 1.4 | 1.5 | 1.4 | 1.2 | 1.0 | 1.0 | 1.0 | 1.1 | 0.9 | 0.7 |
| Auto detailing | 0.9 | 0.9 | 1.1 | 1.2 | 1.1 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 0.9 | 0.9 |

**Named seasonal events** (override monthly base when active):

| Event | Window | Niches boosted | Multiplier |
|---|---|---|---|
| Spring break | Mar 1 - Apr 15 | Restaurants, Charters, VRMs | 1.6 |
| Wedding peak | Apr 15 - Jun 15 | Wedding venues, Salon/spa, Hotels | 1.8 |
| Memorial Day weekend | May 23 - 27 | All tourism niches | 1.4 |
| July 4 week | Jun 30 - Jul 7 | Restaurants, Charters | 1.5 |
| Destin Seafood Festival | Mid-October | Restaurants, Charters | 1.7 |
| Fall wedding | Sep 15 - Nov 1 | Wedding venues | 1.5 |
| Snowbird arrival | Nov 1 - Dec 15 | VRMs, Restaurants, Dental | 1.4 |
| Pensacola Beach Air Show | Mid-July | Restaurants, Hotels | 1.3 |

### Scoring algorithm

Each candidate `(niche, content_type)` for a given `(site, slot, week)` is scored 0-100 across six dimensions, then weighted into a final score:

| Component | Weight | How calculated |
|---|---|---|
| Pipeline signal score | 0.35 | Trailing 14 days of `pipeline_signals` for (niche, city), weighted by event type |
| Seasonal weight | 0.20 | Monthly multiplier × any active named event multiplier |
| Content debt score | 0.20 | Days since last article in (site, niche-mapped category) |
| Business inventory score | 0.10 | Count of unfeatured eligible businesses for the niche/city |
| Content type fit | 0.10 | Has this content type been overused? Listicle fatigue check |
| Niche editorial value | 0.05 | Static value from niches table |

**Pipeline signal weights** (events in `pipeline_signals` summed, divided by `MAX_EXPECTED_SIGNAL=200`, capped at 100):

| Signal type | Strength |
|---|---|
| Scout adds new lead | 10 |
| Diagnoser completes diagnosis | 15 |
| Builder produces mockup | 20 |
| Pitcher sends outreach | 10 |
| Reply received (any sentiment) | 25 |
| Positive reply | 40 |
| Booked call | 60 |

**Exclusion checks** (return null/skip candidate):
- Niche excluded for archetype (Premium excludes HVAC, auto detailing)
- Business inventory < 3 for listicle (need at least 3 to make a list)
- Recently published in same niche on same site (last 14 days) and content_type isn't "profile"

**Diversification rules** applied after scoring:
1. No same niche twice on same site in same week (unless evergreen backfill)
2. Max 2 listicles per site per week
3. Hub gets aggregation logic instead of niche rotation
4. At least 1 profile per site per week
5. Sponsored articles don't count toward niche slots

### Scoring algorithm — full pseudocode

```typescript
// packages/editorial-scoring/score.ts

type ScoreInputs = {
  niche: Niche;
  contentType: ContentType;
  site: Site;
  slot: CalendarSlot;
  weekStartingMonday: Date;
};

async function scoreCandidate(inputs: ScoreInputs): Promise<ScoredCandidate | null> {
  const { niche, contentType, site, slot, weekStartingMonday } = inputs;

  // EXCLUSION CHECKS
  if (!nicheCategoryMap.has(site.archetype, niche)) return null;
  if (businessInventoryFor(niche, site.city) < 3 && contentType === 'listicle') return null;
  if (recentlyPublished(site.id, niche, days: 14) && contentType !== 'profile') return null;

  // SCORE COMPONENTS (each 0-100)
  const pipelineSignalScore = await getPipelineSignalScore(niche, site.city, days: 14);
  const seasonalWeight = getSeasonalWeight(niche, weekStartingMonday) * 100;
  const contentDebtScore = getContentDebtScore(site.id, niche);
  const businessInventoryScore = getBusinessInventoryScore(niche, site.city);
  const contentTypeFit = getContentTypeFit(contentType, niche, site.id);
  const nicheEditorialValue = niche.editorialValue;

  // WEIGHTED COMPOSITE
  const finalScore =
    pipelineSignalScore * 0.35 +
    seasonalWeight * 0.20 +
    contentDebtScore * 0.20 +
    businessInventoryScore * 0.10 +
    contentTypeFit * 0.10 +
    nicheEditorialValue * 0.05;

  return {
    niche, contentType, site, slot,
    finalScore,
    componentScores: { pipelineSignalScore, seasonalWeight, contentDebtScore, businessInventoryScore, contentTypeFit, nicheEditorialValue },
    reasonSummary: humanReadableReason(componentScores),
  };
}

async function generateBriefQueue(weekStartingMonday: Date): Promise<Brief[]> {
  const sites = await getActiveSites();
  const queue: Brief[] = [];

  for (const site of sites) {
    const slots = getCalendarSlotsForSite(site, weekStartingMonday);

    for (const slot of slots) {
      // score every (niche, content_type) candidate
      const candidates = [];
      for (const niche of getEligibleNiches(site)) {
        for (const contentType of slot.allowedContentTypes) {
          const scored = await scoreCandidate({ niche, contentType, site, slot, weekStartingMonday });
          if (scored) candidates.push(scored);
        }
      }

      // sort, dedupe (avoid same niche twice in same site's week)
      candidates.sort((a, b) => b.finalScore - a.finalScore);
      const used = new Set(queue.filter(b => b.siteId === site.id).map(b => b.niche));
      const winner = candidates.find(c => !used.has(c.niche));

      if (winner) {
        const brief = await materializeBrief(winner);  // turns scored candidate into full brief
        queue.push(brief);
      }
    }

    // backfill if site is below minimum weekly volume
    while (queue.filter(b => b.siteId === site.id).length < site.minimumWeeklyArticles) {
      const evergreen = await pullEvergreenBrief(site);
      if (evergreen) queue.push(evergreen);
      else break;
    }
  }

  return queue;
}
```

### Component scoring details

**Content debt score** (days since last article in site/niche-mapped-category):
- 0-7 days: score 0 (recently covered, don't repeat)
- 8-30 days: score = (days - 7) × 4
- 31-60 days: score = 90 + (days - 30) × 0.33
- 60+ days: score 100 (urgent debt)

**Business inventory score**:
- 0-2 businesses available: score 20 (thin; only profile possible)
- 3-7 businesses: score 60 (listicle viable)
- 8+ businesses: score 90 (deep listicle viable)

**Content type fit**:
- Last 3 articles for niche on site were all listicles → profile scores higher
- No listicle in 60+ days → listicle scores higher
- Guide content always fits if no guide in 90+ days
- Event coverage scores high if relevant event within 14 days

### Hub-specific logic

The hub does **not** rotate niches. Instead:

| Slot | Frequency | Description |
|---|---|---|
| Weekly aggregate | 1/week (Wed) | "This Week Across the Emerald Coast" — auto-aggregated from city-site articles in last 7 days |
| Regional roundup | 1-2/month | Original "Best [niche] on the Emerald Coast" cross-corridor listicle |
| Cross-niche guide | 1-2/month | "How to plan a destination wedding," "A weekend in 30A" |

**Aggregate trigger**: Curator generates a regional roundup brief whenever (a) a niche has had ≥10 city-site articles in past 60 days AND (b) no regional roundup for that niche has run in 90+ days.

**Cross-niche guides**: Pulled from `evergreen_brief_bank` filtered to `siteArchetype='magazine'` (hub uses Magazine), least-recently-used first.

### Curator agent prompt skeleton

```markdown
---
name: curator
description: Generates next week's brief queue from scored editorial candidates.
permissionMode: read-only-except-briefs
tools: [filesystem, agent-api-briefs, agent-api-businesses]
version: 1
---

# Curator — Editorial Brief Queue Generator

You are the Curator for Best Emerald Coast. Every Sunday you generate next
week's editorial brief queue across all 8 sites.

## Input
A list of scored candidates (siteId, slot, niche, contentType, scores).
An eligible business pool for each (niche, city) pair.
Recent coverage on each site.

## Job
For each (site, slot) pair, take the highest-scored candidate that doesn't
violate diversification rules and generate a brief:

- **Headline** — clear, specific, includes location, ≤ 65 chars when possible
- **Angle** — 2-3 sentence editorial direction explaining what this article
  argues, who it's for, what makes it interesting now
- **Businesses to feature** — for listicles: 7-10 ranked by rating × review count,
  weighted by featured listing status. For profiles: single most editorial-worthy
  business, with rationale.
- **Keywords** — 3-5 SEO-relevant phrases

## Hub briefs (different logic)
Hub site does NOT rotate niches. Hub slots filled with one of:
- "This week across the Emerald Coast" — aggregation
- Regional roundup (cross-corridor)
- Cross-niche guides

## Voice rules
- Reference a specific city or landmark (not "the area")
- Avoid banned phrases
- Match archetype voice (Magazine = trustworthy, Coastal = bright, Premium = refined)

## Backfill
If site has fewer scored candidates than minimumWeeklyArticles:
1. Pull from evergreen_brief_bank, ordered by lastUsedAt DESC
2. If bank empty, leave with status='proposed' and reason='LOW PIPELINE — operator decision needed'

## Output
Write each brief to briefs table via agent API.
```

### The Sunday approval surface (ops-console)

**Desktop layout** at `/editorial/queue`:
- Top: week header, summary stats (briefs proposed, backfilled, low-pipeline warnings)
- Left rail: filter chips (by site, niche, content type, score)
- Main: 8 site columns, each showing 1-3 brief cards
- Right rail: bulk-approve button, "approve all above 70 score" shortcut

**Each brief card** shows:
- Headline (large)
- Site + slot tag, niche + content type badges
- Score (color-coded: green ≥70, yellow 50-70, red <50)
- One-line reason summary
- Approve / Edit / Reject buttons (one-tap each)
- "Why this score?" disclosure (expands to show component scores as horizontal bar chart)

**Mobile layout** at `/m/queue` (HIG-driven, ADR-029):
- Stack-list: each brief is a full-width card, tap-to-expand
- **Swipe right** = approve (green flash + haptic)
- **Swipe left** = open edit sheet
- **Long-press** = reject with reason
- **Pull-to-refresh** = re-fetch queue
- Bottom bar: "X of 14 reviewed", "Approve remaining above 70" shortcut

**Edit sheet** (modal):
- Editable headline (char counter, target ≤65)
- Editable angle (3-row textarea)
- Business list — drag to reorder, tap to remove, search-and-add
- Keyword chips
- Save / Save & Approve / Cancel

### Cron orchestration

**Sunday Curator cron** (Vercel cron in `apps/ops-console/vercel.json`):
```json
{ "path": "/api/cron/curate-week", "schedule": "0 23 * * 0" }
```

Sunday 11pm ET. Handler:
1. Verifies CRON_SECRET (per ADR-038)
2. Computes `weekStartingMonday` for next week
3. Runs scoring algorithm (pure SQL/TS, fits in function timeout)
4. Triggers Vercel Workflow for brief materialization (LLM-heavy headline/angle generation)
5. Sends Slack/Telegram notification: "Brief queue ready: 14 briefs across 8 sites. Review at ops.bestemeraldcoast.com/editorial/queue."

**Weekly cleanup cron** (Monday 6am ET):
```json
{ "path": "/api/cron/expire-briefs", "schedule": "0 6 * * 1" }
```
Marks unpublished approved briefs from prior weeks as `expired`.

### Pipeline signal capture

Existing agents write `pipeline_signals` rows alongside their normal work:
- **Scout**: on lead creation → `signalType='lead_added'`, strength 10
- **Diagnoser**: on diagnosis → `signalType='diagnosis_done'`, strength 15
- **Builder**: on mockup → `signalType='mockup_done'`, strength 20
- **Pitcher**: on send → `signalType='outreach_sent'`, strength 10
- **Inbound webhook**: on reply → `signalType='reply_received'`, strength 25; if positive, additional `signalType='positive_reply'`, strength 40
- **Calendly webhook**: on booking → `signalType='booked_call'`, strength 60

Each agent gets one extra POST to the agent API per action.

### Failure modes and recovery

| Failure | Detection | Recovery |
|---|---|---|
| Sunday cron doesn't fire | No notification by Monday 8am | Operator runs `/curate-week` manually |
| Curator fails mid-run | agent_runs.status = 'error' | Operator runs `/curate-week` again; partial briefs deduped |
| Vercel Workflow timeout on materialization | Briefs created with placeholders | Operator runs `/curate-week --resume` to fill placeholders |
| Pipeline signals empty/sparse | All scores low | Backfill from evergreen_brief_bank kicks in automatically |
| Operator misses Monday review | Briefs sit in 'proposed' | Tue 8am: gentle reminder. Wed 8am: warning. Thu: cron auto-approves only briefs >85 score |
| Algorithm always picks same niche | Diversification rule failure | Manual override `/curate-week --no-pipeline-weight` |
| Niche has zero businesses | Exclusion check filters it | If all niches excluded for site, evergreen backfill |

### Curator metrics

In `(app)/metrics/curator`:
- Queue size by week — proposed, approved, edited, rejected
- Approval rate (target ≥60%)
- Edit rate (target ≤30%)
- Reject rate (target ≤10%)
- Score distribution histogram
- Coverage heatmap (niche × week)
- Coverage per site — vs. min/max
- Pipeline-to-publish lag (median days)
- Backfill rate (target <20%)
- Brief expiration rate (target <5%)

If approval rate <50% or backfill rate >40%, run `/refine-curator` to propose weight adjustments.

### Decision log for future revisits

| Decision | When to revisit | Trigger |
|---|---|---|
| Component score weights (0.35/0.20/0.20/0.10/0.10/0.05) | After 8 weeks live | Approval rate <50% or backfill rate >40% |
| Seasonal multipliers | Annually each January | Year-over-year traffic data |
| Named season events list | Annually | New events; date drift |
| Maximum brief age before expiration | After 12 weeks | Expiration rate >10% |
| Hub aggregation logic | After 8 weeks | Hub traffic stagnates |
| Diversification rules | After 12 weeks | Engagement metrics suggest different mix |
| Auto-flow score threshold (>85) | After 4 weeks of auto-flow | Operator catches errors auto-flow missed |
| Per-site min/max weekly articles | Quarterly | Pipeline pace changes |

---

## Customer Relationship Specification

> **Implements ADR-041.** This is the full spec for how clients are tracked, how communication is logged, how SLAs are enforced, and how Concierge handles proactive customer service.

### Conceptual model

A **client** is a business that has paid you anything, ever. The moment a lead transitions to `closed_won`, the business is promoted to client status with a unified profile aggregating all relationships:

```
clients (one row per business that's ever paid)
   │
   ├── communication_log (every email, call, message, note)
   ├── tickets (support requests with SLA tracking)
   ├── scheduled_touches (proactive contact cadence)
   ├── projects (active deliveries — from ADR-026)
   ├── featured_listings (current paid placements)
   ├── sponsorships (newsletter/article paid placements)
   └── articleBusinesses (every editorial mention)
```

The client view in ops-console pulls all of this into one screen. Concierge agent reads from this layer to draft proactive touches.

### Schema additions

```typescript
// packages/db/schema/clients.ts

export const clientStatus = pgEnum('client_status', [
  'active',           // currently has at least one active product
  'paused',           // had products, paused (didn't churn)
  'churned',          // ended all products
  'prospect',         // in active sales conversation but not yet paid
]);

export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().unique().references(() => businesses.id),
  status: clientStatus('status').notNull().default('active'),
  // Primary contact
  primaryContactName: text('primary_contact_name'),
  primaryContactEmail: text('primary_contact_email'),
  primaryContactPhone: text('primary_contact_phone'),
  preferredContactChannel: text('preferred_contact_channel'),  // 'email' | 'sms' | 'phone'
  // Relationship
  becameClientAt: timestamp('became_client_at').notNull(),
  churnedAt: timestamp('churned_at'),
  churnReason: text('churn_reason'),
  // Aggregates (denormalized for dashboard speed; refreshed nightly via cron)
  lifetimeValueCents: integer('lifetime_value_cents').default(0),
  activeProductCount: integer('active_product_count').default(0),
  lastContactedAt: timestamp('last_contacted_at'),
  nextScheduledTouchAt: timestamp('next_scheduled_touch_at'),
  // Operator context
  internalNotes: text('internal_notes'),
  npsScore: integer('nps_score'),
  npsCollectedAt: timestamp('nps_collected_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const communicationDirection = pgEnum('communication_direction', [
  'inbound', 'outbound', 'internal_note',
]);

export const communicationChannel = pgEnum('communication_channel', [
  'email', 'sms', 'phone_call', 'video_call', 'in_person', 'slack', 'instagram_dm', 'note',
]);

export const communicationLog = pgTable('communication_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id),
  businessId: uuid('business_id').notNull().references(() => businesses.id),  // covers prospect-stage convos
  // Optional links to specific contexts
  leadId: uuid('lead_id').references(() => leads.id),
  projectId: uuid('project_id').references(() => projects.id),
  ticketId: uuid('ticket_id'),
  // The communication
  direction: communicationDirection('direction').notNull(),
  channel: communicationChannel('channel').notNull(),
  occurredAt: timestamp('occurred_at').notNull(),
  subject: text('subject'),
  body: text('body'),
  attachmentUrls: jsonb('attachment_urls').$type<string[]>().default([]),
  // For calls/meetings
  durationMinutes: integer('duration_minutes'),
  participantsExternal: jsonb('participants_external').$type<string[]>().default([]),
  // Auto-classification
  sentiment: text('sentiment'),  // 'positive' | 'neutral' | 'negative' | 'urgent'
  category: text('category'),    // 'sales' | 'support' | 'check_in' | 'delivery' | 'billing'
  // For email integration
  externalMessageId: text('external_message_id'),
  threadId: text('thread_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const ticketStatus = pgEnum('ticket_status', [
  'open', 'in_progress', 'waiting_on_client', 'resolved', 'closed',
]);

export const ticketPriority = pgEnum('ticket_priority', [
  'low', 'normal', 'high', 'urgent',
]);

export const tickets = pgTable('tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  projectId: uuid('project_id').references(() => projects.id),
  title: text('title').notNull(),
  description: text('description'),
  status: ticketStatus('status').notNull().default('open'),
  priority: ticketPriority('priority').notNull().default('normal'),
  category: text('category'),  // 'bug' | 'change_request' | 'question' | 'billing' | 'feature_request'
  // SLA tracking
  slaResponseDueAt: timestamp('sla_response_due_at'),
  slaResolutionDueAt: timestamp('sla_resolution_due_at'),
  firstRespondedAt: timestamp('first_responded_at'),
  resolvedAt: timestamp('resolved_at'),
  closedAt: timestamp('closed_at'),
  slaWarning: boolean('sla_warning').default(false),
  slaBreach: boolean('sla_breach').default(false),
  assignedTo: text('assigned_to'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const scheduledTouchType = pgEnum('scheduled_touch_type', [
  'maintenance_check_in',     // monthly maintenance client touch
  'featured_listing_review',  // quarterly performance email
  'post_launch_30_day',       // 30 days post-launch
  'post_launch_90_day',
  'post_launch_180_day',
  'sponsorship_pre_send',     // 24h before sponsored newsletter
  'sponsorship_post_send',    // 24h after
  'nps_request',              // quarterly NPS
  'renewal_warning',          // 30 days before featured listing expires
  'renewal_final',            // 7 days before
  'reactivation',             // 60 days post-churn outreach
  'birthday',                 // business anniversary
  'manual',                   // operator-scheduled
]);

export const scheduledTouchStatus = pgEnum('scheduled_touch_status', [
  'pending', 'completed', 'skipped', 'overdue',
]);

export const scheduledTouches = pgTable('scheduled_touches', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  type: scheduledTouchType('type').notNull(),
  scheduledFor: timestamp('scheduled_for').notNull(),
  status: scheduledTouchStatus('status').notNull().default('pending'),
  context: jsonb('context'),  // arbitrary data the touch needs (e.g., issue id, expiration date)
  draftedMessage: text('drafted_message'),  // Concierge drafts; operator approves
  completedAt: timestamp('completed_at'),
  skippedReason: text('skipped_reason'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### SLA defaults per product

Seeded as configuration in `packages/config/sla-defaults.ts`. Tunable per client via a `client_sla_overrides` JSON field if needed.

| Product | First response | Resolution |
|---|---|---|
| Maintenance plan | 4 hours (business hours) | 72 hours |
| Active web build | 8 hours | 168 hours (1 week) |
| Featured listing | 24 hours | 168 hours |
| Sponsorship | 4 hours | 24 hours |
| Sponsored article | 8 hours | 120 hours (5 days) |
| Prospect inquiry | 4 hours | 24 hours |

`tickets.slaResponseDueAt` and `slaResolutionDueAt` computed at ticket creation based on the highest-tier active product the client has.

### Lead-to-client promotion logic

Triggered when a lead transitions to `closed_won` (operator action via `/leads/[id]` or via `/m/leads/[id]`):

```typescript
async function promoteLead(leadId: string, dealAmountCents: number, offerType: string) {
  await db.transaction(async (tx) => {
    const lead = await tx.select().from(leads).where(eq(leads.id, leadId));
    const business = await tx.select().from(businesses).where(eq(businesses.id, lead.businessId));

    // 1. Create or update clients row
    const client = await tx.insert(clients).values({
      businessId: business.id,
      status: 'active',
      becameClientAt: now(),
      lifetimeValueCents: dealAmountCents,
      activeProductCount: 1,
      lastContactedAt: now(),
    }).onConflictDoUpdate({
      target: clients.businessId,
      set: {
        status: 'active',
        lifetimeValueCents: sql`${clients.lifetimeValueCents} + ${dealAmountCents}`,
        activeProductCount: sql`${clients.activeProductCount} + 1`,
        updatedAt: now(),
      }
    }).returning();

    // 2. Create projects row
    const project = await tx.insert(projects).values({
      leadId, businessId: business.id, offerType,
      contractAmountCents: dealAmountCents,
      status: 'kickoff',
      kickoffAt: now(),
    }).returning();

    // 3. Initial communication_log entry
    await tx.insert(communicationLog).values({
      clientId: client.id, businessId: business.id, projectId: project.id,
      direction: 'outbound', channel: 'phone_call',
      occurredAt: now(),
      category: 'sales',
      body: 'Closing call — deal won.',
    });

    // 4. Schedule appropriate touches based on offer type
    const touches = computeInitialTouches(client.id, offerType);
    await tx.insert(scheduledTouches).values(touches);

    // 5. Update business
    await tx.update(businesses).set({ isClient: true }).where(eq(businesses.id, business.id));

    // 6. Update lead
    await tx.update(leads).set({ status: 'closed_won' }).where(eq(leads.id, leadId));
  });
}

function computeInitialTouches(clientId: string, offerType: string): ScheduledTouchInsert[] {
  const touches = [];
  const now = new Date();

  if (offerType === 'web_build_starter' || offerType === 'web_build_standard' || offerType === 'web_build_growth') {
    // Post-launch sequence (relative to expected launch date, ~30 days from kickoff)
    const launchEstimate = addDays(now, 30);
    touches.push(
      { clientId, type: 'post_launch_30_day', scheduledFor: addDays(launchEstimate, 30) },
      { clientId, type: 'post_launch_90_day', scheduledFor: addDays(launchEstimate, 90) },
      { clientId, type: 'post_launch_180_day', scheduledFor: addDays(launchEstimate, 180) },
      { clientId, type: 'nps_request', scheduledFor: addDays(launchEstimate, 60) },
    );
  }

  if (offerType === 'maintenance_plan') {
    // Monthly check-ins for a year, NPS quarterly
    for (let m = 1; m <= 12; m++) {
      touches.push({ clientId, type: 'maintenance_check_in', scheduledFor: addMonths(now, m) });
    }
    for (let q = 1; q <= 4; q++) {
      touches.push({ clientId, type: 'nps_request', scheduledFor: addMonths(now, q * 3) });
    }
  }

  if (offerType === 'featured_listing') {
    // Quarterly review, plus renewal warnings before expiration
    touches.push(
      { clientId, type: 'featured_listing_review', scheduledFor: addMonths(now, 3) },
      { clientId, type: 'renewal_warning', scheduledFor: addDays(now, 365 - 30) },
      { clientId, type: 'renewal_final', scheduledFor: addDays(now, 365 - 7) },
    );
  }

  // All clients get quarterly NPS unless already added
  if (!touches.some(t => t.type === 'nps_request')) {
    touches.push({ clientId, type: 'nps_request', scheduledFor: addMonths(now, 3) });
  }

  return touches;
}
```

### Communication log integration

**Outbound emails** (Resend webhook → log entry):
- Resend `email.sent` webhook → match recipient against `clients.primaryContactEmail` or `business.contactChannels.email`
- If match → create `communication_log` entry with direction='outbound', channel='email', externalMessageId, threadId
- Update client's `lastContactedAt`

**Inbound emails** (Resend Inbound webhook):
- Match sender email against `clients.primaryContactEmail`
- If match → check if reply to existing thread (via `In-Reply-To` headers); if so, log to that thread
- If new thread from existing client → auto-create ticket with appropriate SLA
- Sentiment classification via Haiku (cheap, fast)
- If no match → existing prospect/outreach flow (per ADR-024)

**SMS** (Twilio webhook):
- Match phone against `clients.primaryContactPhone`
- Same flow as email

**Calls** (manual logging):
- "Log a call" button on client view opens modal sheet
- Fields: duration, participants, summary, sentiment
- Creates `communication_log` entry with direction='outbound' or 'inbound', channel='phone_call'

**Internal notes**:
- Always-visible "Add note" field on client view
- Creates `communication_log` entry with direction='internal_note', channel='note'
- Renders distinctly (centered, dotted border) in the timeline

### Tickets and SLA monitoring

**Background SLA cron** (every 30 min during business hours, in `apps/ops-console/api/cron/sla-monitor`):
- Scan tickets with `status IN ('open', 'in_progress', 'waiting_on_client')` and `firstRespondedAt IS NULL OR resolvedAt IS NULL`
- For each, compute % of SLA elapsed
- If >75% and `slaWarning=false` → set `slaWarning=true`, write to log
- If >100% and `slaBreach=false` → set `slaBreach=true`, send Slack/SMS alert to operator

**Ticket dashboard** at `/tickets` and `/m/tickets`:
- Default view: open tickets sorted by SLA-breach-soonest
- Color coding: green (>50% SLA remaining), yellow (warning), red (breached)
- Each card: ticket title, client, SLA status, last activity
- Tap → ticket detail with conversation thread, status changes, related comm log entries

**Ticket creation paths**:
1. Inbound email from client → auto-create
2. Operator manually via "Open ticket" on client view
3. Concierge identifies a problem in client comm log (Phase 6 enhancement)

### Concierge agent

**Daily run** (Vercel cron, 7am ET):
1. Query `scheduled_touches` due today (`scheduledFor <= now()` and `status='pending'`)
2. For each, generate a draft message based on touch type and client context
3. Run draft through Copy Quality Rubric (ADR-034)
4. Write to `scheduledTouches.draftedMessage`
5. Surface in `/m/concierge` queue
6. Send Slack/Telegram: "X touches drafted for review"

**Weekly run** (Monday 7am ET):
1. Scan active clients with `lastContactedAt > 30 days` → recommend check-ins
2. Generate renewal pipeline (featured listings expiring 30/14/7 days)
3. Surface in `/m/concierge` queue

**Monthly run** (1st of month, 7am ET):
1. Scan completed projects past 30 days without NPS request
2. Generate quarterly business review data for active clients
3. Surface in queue

**Touch templates** (one per `scheduledTouchType`, lives in `agency/.claude/concierge-templates/`):
- `maintenance_check_in.md` — "Hey [Name], it's [month]. Anything we should adjust on the site this month?"
- `post_launch_30_day.md` — "It's been a month since [Site] launched. How's it performing? Any feedback?"
- `featured_listing_review.md` — "Quick quarterly update on your featured listing. Here are your numbers..."
- `nps_request.md` — "On a scale of 0-10, how likely are you to recommend us? Quick reply appreciated."
- `renewal_warning.md` — "Heads up: your featured listing expires in 30 days. Want to renew?"
- `sponsorship_pre_send.md` — "Your sponsored slot is sending tomorrow at 9am ET. Final preview attached."

Each template is a Markdown file with placeholders that Concierge fills with client-specific context.

**Concierge prompt skeleton**:

```markdown
---
name: concierge
description: Customer success automation — drafts proactive touches and SLA alerts.
permissionMode: read-and-draft-only
tools: [filesystem, agent-api-clients, agent-api-tickets, agent-api-touches]
version: 1
---

# Concierge — Customer Service Operations

You are the Concierge for Best Emerald Coast. You handle proactive customer
service: scheduled touches, SLA monitoring, renewal warnings, NPS collection,
and reactivation outreach.

## Daily routine
1. Read scheduled_touches due today (status='pending' and scheduledFor <= now)
2. For each, fetch client context (active products, last comms, last article mentions)
3. Pick the appropriate template from concierge-templates/
4. Draft a personalized message respecting:
   - Operator's voice (warm, direct, no corporate-speak)
   - ADR-034 Copy Quality Rubric (no banned phrases)
   - Client's preferred channel
5. Write draft to scheduled_touches.draftedMessage
6. Mark for operator approval at /m/concierge

## Weekly routine
On Mondays:
- Scan active clients with lastContactedAt > 30 days → recommend check-in
- Generate renewal pipeline (featured listings expiring soon)
- Generate inactive-client list

## Voice rules
- Always personalized (specific to this client's relationship history)
- Never templated-feeling ("As a valued customer..." → REJECTED)
- Reference real shared context (their actual project, their actual articles)
- Short and direct — these are not marketing emails

## Constraints
- READ + DRAFT only. Never sends autonomously.
- All touches go through operator approval queue.
- If you can't draft a touch with confidence, mark status='skipped' with reason.
- For SLA breaches, prioritize alerting over drafting (operator handles directly).

## Output
Write drafts to scheduled_touches.draftedMessage via agent API.
Touches stay status='pending' until operator approves (then 'completed').
On completion, write summary to agent_runs.
```

### Unified client view

**Desktop layout** at `/clients/[id]`:

**Header strip:**
- Business name + city
- Status badge (active/paused/churned)
- Lifetime value (e.g., "$8,400 LTV")
- Last contact ("12 days ago" — yellow if >30 days for active client)
- Next scheduled touch ("Maintenance check-in due Nov 16")

**Quick actions row:**
- Log a call — modal sheet for adding phone-call entry
- Send email — opens compose with subject pre-filled
- Open ticket — creates ticket scoped to client
- Schedule touch — adds to scheduled_touches

**Six tabs:**
1. **Overview** (default) — active products panel, open tickets, recent comms (5 entries), upcoming touches (3), editorial mentions (3), internal notes
2. **Products** — every product purchased ever, active at top, archive below; each card shows product type, dates, contract value, status, link to project/listing detail
3. **Communication** — full searchable timeline, filterable by channel/direction/date range/category
4. **Tickets** — open and resolved, sorted by SLA status
5. **Editorial** — every article that mentions this business (via `articleBusinesses`)
6. **Activity** — chronological event stream (status changes, payments, deliveries, touches completed)

**Mobile layout** at `/m/clients/[id]` (HIG-driven, ADR-029):
- Header collapses to two lines
- Tabs become swipeable segmented control
- Quick actions become floating action button (FAB) opening sheet with options
- Communication log uses iMessage-style chat bubbles (you on right, client on left, internal notes centered)
- Tap any entry to expand inline
- Swipe-to-archive on tickets
- Pull-to-refresh on communication
- Haptic feedback on log creation

**Client list view** at `/clients` and `/m/clients`:
- Filters: status, active products, last contact age, city, niche, has open tickets
- Sort: lifetime value, last contact, churn risk, alphabetical
- Side panel: aggregate metrics for filtered set (total LTV, count, average tenure, churn rate)
- Tap row → client detail

### Concierge approval queue

**`/m/concierge`** — the daily review surface:
- Stack of drafted touches due today
- Each card: client name, touch type, drafted message preview, scheduled-for timestamp
- **Swipe right** = approve and send (green flash + haptic)
- **Swipe left** = open edit sheet (modify message, save & send)
- **Long-press** = skip with reason
- Bottom bar: "X of Y reviewed", "Approve all simple touches" shortcut

Daily target: 5-10 minutes to clear the queue.

### Failure modes and recovery

| Failure | Detection | Recovery |
|---|---|---|
| Concierge cron doesn't fire | No drafts in queue by 8am | Operator runs `/run-concierge` manually |
| Draft fails Copy Quality check | Internal flag in agent_runs | Concierge retries with adjusted prompt; if 2nd fails, marks 'skipped' |
| SLA breach not alerted | Operator sees red ticket | Slack/SMS alert system needs review |
| Touch drafted but operator misses approval window | scheduled_for past + status='pending' | Daily cleanup cron sets to 'overdue', re-queues for next morning |
| Inbound email doesn't match client | Goes to outreach pile by mistake | Manual reassignment in ops-console |
| Client has multiple email addresses | Only one matched | Add `client_emails` table (deferred to v2) |
| NPS request flood (every Q at once) | Approval queue backed up | Stagger by ±15 days based on `becameClientAt` modulo |

### Customer success metrics

In `(app)/metrics/concierge`:
- Touches scheduled vs. completed (weekly)
- Touch approval rate (target ≥90%)
- Average time from drafted → approved (target <24h)
- Average client `lastContactedAt` for active clients (target <30 days)
- Open ticket count + SLA breach rate (target <5%)
- NPS scores (collected, distribution)
- Churn rate (monthly, by product type)
- Lifetime value by client cohort
- Reactivation rate (churned clients responding to outreach)

---

## Design System

### Three archetypes, one component library (ADR-032)

Eight sites do **not** mean eight codebases. One `packages/ui/` library, one set of layouts, three archetypes, and per-site theme tokens that produce visually distinct sites.

| Archetype | Sites | Vibe | Visual cues |
|---|---|---|---|
| **Magazine** | bestpensacola, bestfortwaltonbeach, bestemeraldcoast (hub) | Trustworthy, neighborhood, readable | Cream backgrounds, navy primary, amber accent, Fraunces serif headings, Inter body, modest radii (4-8px), 4:3 hero images |
| **Coastal** | bestpensacolabeach, bestdestinfl | Bright, vacation, lifestyle | White backgrounds, ocean teal primary, coral accent, General Sans throughout, friendly radii (8-12px), 16:9 hero images |
| **Premium** | bestsouthwalton, bestcr30a, best30a.life | Editorial-magazine, refined | Bone backgrounds, near-black primary, sage accent, Editorial New + Söhne, minimal radii (2-4px), 21:9 hero images, full-bleed sections |

### Theme token contract

Every site's `themeTokens` row satisfies the `SiteTheme` TypeScript type defined in `packages/ui/theme/tokens.ts` (full type in ADR-032). Tokens flow:

1. Site row loads from DB via `proxy.ts` host match.
2. Theme tokens convert to CSS variables via `applyTheme()`.
3. Variables inject on `<html>` element.
4. Tailwind v4's `@theme` directive maps utility classes to those variables.
5. Every component reads variables; nothing is hardcoded.

### Build order

1. **Build one site fully** (Pensacola, Magazine archetype). Hardcode at first.
2. **Extract tokens** — every color, font, spacing decision becomes a CSS variable.
3. **Build a second archetype** (Destin, Coastal). If something doesn't theme cleanly, it's a component bug, not a token bug.
4. **Build the third archetype** (30A, Premium). By now the system is real.
5. **Remaining sites take <1 day each** — pick archetype + tweak ~5 tokens.

### Newsletter design (ADR-033)

- **Stack**: React Email components, rendered server-side, sent via SES (bulk) or Resend (transactional).
- **Constraints**: 600px max width, system font stacks (no web fonts in email), single-column primary, table layouts where Outlook compat matters, `<meta name="color-scheme" content="light dark">` for dark mode.
- **Structure**: Header → Hero story → 3-4 secondary stories → Featured listings (clearly labeled) → Events block → Footer (physical address per CAN-SPAM, unsubscribe, preference center).
- **Per-site theming**: each newsletter reads `siteId` → fetches theme tokens → renders branded email.

### Storybook

Every component in `packages/ui/` has a story. Storybook deploys to `ui.bestemeraldcoast.com` (Vercel preview, password-protected). It shows every component in all three archetypes side-by-side. Catches theming bugs early. Acts as the live design-system reference.

### Imagery direction (ADR-022)

| Archetype | Photo style | AI-generated allowed for |
|---|---|---|
| Magazine | Documentary, neighborhood, slightly desaturated, real people in context | Abstract backgrounds, decorative |
| Coastal | Bright outdoor lifestyle, water, beach action, natural saturation | OG cards, decorative |
| Premium | Still life, architectural, painterly, lots of negative space | Background textures only |

All images: required alt text, blurhash placeholder, AVIF/WebP via Next `<Image>`, provenance tracked in DB.

---

## User Experience Principles (Apple HIG)

Every screen — public, ops-console, mobile, newsletter — follows Apple's Human Interface Guidelines. The HIG isn't iOS-only; it's a design philosophy that applies anywhere.

### The five principles

**1. Clarity** — text legible at every size, icons precise and lucid, adornments subtle and appropriate, sharp focus on functionality. *Implementation*: minimum 16px body text on mobile, 4.5:1 contrast for text (ADR-036), one primary CTA per screen, every label is a noun + verb.

**2. Deference** — fluid motion and a crisp, beautiful interface help people understand and interact with content while never competing with it. *Implementation*: content (the article, the lead, the mockup) is the visual foreground; navigation chrome recedes; animations are quick (200ms or less) and meaningful.

**3. Depth** — distinct visual layers and realistic motion impart vitality and heighten people's delight and understanding. *Implementation*: modal sheets (not full-page transitions) for editing, layered cards, subtle elevation on interactive elements, visible state changes.

**4. Consistency** — implements familiar standards and paradigms. *Implementation*: same approve/reject pattern across all approval types (leads, mockups, replies, articles), same form field treatment everywhere, same error message tone, shadcn primitives never customized away from their core behavior.

**5. Direct manipulation** — engaging actions enhance the sense of mastery. *Implementation*: swipe-to-triage in `/m` lists, drag-to-reorder where ranking matters, tap-to-edit-inline, optimistic UI with explicit undo.

### Operator-side UX (ops-console + `/m`)

- **Bottom navigation on mobile** — five icons, 44pt minimum tap targets, icon + label, primary action lowest and largest.
- **Pull-to-refresh** on every list view.
- **Modal sheets** for all compose/edit actions (mirrors iMessage compose).
- **Safe area insets** respected — content never hides under home indicator.
- **Dark mode support** via `prefers-color-scheme`. Ops-console defaults to dark for evening triage.
- **Reduced motion** respected — animations disable when `prefers-reduced-motion: reduce`.
- **Dynamic Type** — base font scale honors iOS system text size.
- **One-handed reach** — primary CTA always in the bottom 25% of the screen.
- **Confirmation, not just feedback** — destructive actions (reject, decline, delete) require an `AlertDialog` confirmation.
- **Optimistic UI with reversal** — actions show "done" instantly; if the server rejects, an undo toast appears for 5 seconds.
- **Haptic feedback** on iOS via Web Vibration API for swipe approvals.

### Reader-side UX (editorial sites)

- **Title + subtitle** are the visual anchor of every article page; everything else defers.
- **Generous whitespace** — at least 1.5× line-height, comfortable measure (60-75ch).
- **Tap targets ≥ 44×44pt** for any link or button on mobile.
- **No autoplay video, no autoplay audio.** Ever.
- **No interrupting modals** — newsletter signup is inline at the bottom of articles + a slide-in after 50% scroll, dismissible.
- **No layout shift** — every image has explicit dimensions, every font preloaded.
- **Reading time estimate** at the top of each article.
- **Reader-mode-friendly** — semantic HTML, no ad-tech blocking the reader.
- **Visible focus rings** for keyboard users on every interactive element.

### Newsletter UX

- **Subject line + preheader** treated as a unit — together ≤ 100 characters.
- **Single-column, scannable** structure.
- **Tap targets in email** ≥ 44pt with 8px padding around links.
- **Dark mode** rendering tested and supported.
- **Unsubscribe link** at the top in addition to footer (low-friction, builds trust).
- **No tracking pixels invisible to readers** — disclosed in privacy policy (ADR-014).

---

## Phase 0 — Workspace & Foundations

**Goal**: an empty-but-correct repo, all accounts provisioned, all secrets in 1Password, the operator's machine ready to develop. No business logic yet.

**Estimated time**: 2-3 days.

### Phase 0 — Claude Code commits

> Each commit is a discrete unit of work. Run `claude` with the prompt and review the diff before merging.

#### Commit 0.1 — Monorepo skeleton

> "Initialize a Turborepo monorepo at the current directory with pnpm. Create the directory structure from the project plan: `apps/{editorial,ops-console,newsletter-public}`, `packages/{db,ui,email,content,agents,analytics,storage,logger,config,config-eslint,config-tsconfig}`, `agency/`, `infra/`, `docs/`. Add `package.json` files for the root and every package with placeholder scripts. Add `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.editorconfig`, `.nvmrc` (Node 20+). Set up shared `tsconfig.json` and ESLint config in their respective config packages. Initialize git."

**Acceptance**: `pnpm install` succeeds. `pnpm turbo build` succeeds (no-op). Tree matches the structure documented.

#### Commit 0.1.5 — Install Ralph slash commands

> "Make the three Ralph loop commands (`/adr-plan`, `/ralph-next`, `/ship-task`) runnable as Claude Code slash commands. Create `.claude/commands/` at the repo root and add symlinks from there to the existing runbooks under `docs/dev/claude/commands/`. Symlinks (not copies) keep a single source of truth — editing the docs updates the slash commands. This commit doubles as the first end-to-end exercise of the standard branch-per-commit + PR + auto-merge + CodeRabbit flow; the bootstrap exception from Commit 0.1 no longer applies. After merge, the operator applies Pass-1 branch protection per `docs/dev/status/next-step.md` § Operator Pre-Flight (now that CodeRabbit has reviewed at least one PR, the `CodeRabbit` status-check name will appear in GitHub's dropdown for Pass-2 protection later)."

**Acceptance**: `.claude/commands/{adr-plan,ralph-next,ship-task}.md` exist as symlinks resolving to `docs/dev/claude/commands/*.md`. PR opened against `main` with auto-merge enabled. CodeRabbit's final review state is `APPROVED`. Squash-merged to `main`; branch auto-deleted.

#### Commit 0.1.7 — Public repo hygiene

> "Harden the repo for the public-visibility window while CodeRabbit's OSS free tier is in use. Rewrite `.gitignore` to cover (a) all `.env*` files except the documented `.env.example`, (b) certificates / private keys (`*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.crt`, `*.cer`, etc.), (c) cloud-provider local credential caches (`.aws/`, `.gcp/`, `.op/`, etc.), (d) SSH key filenames, (e) local database files and SQL dumps, (f) infrastructure-as-code state (`.terraform/`, `*.tfstate`, `.pulumi/`, etc.), (g) extra OS / editor scratch patterns. Also annotate `docs/dev/status/next-step.md` § Commit 0.2 Acceptance with explicit *deferred-to-Commit-X* markers so the operator can proceed to Commit 0.3 with only Pass-1 protection + the SES sandbox-exit request kicked off (the rest provision just-in-time at the commit that needs them)."

**Acceptance**: `.gitignore` includes every category above. `next-step.md` § Commit 0.2 Acceptance has each item tagged with its blocking commit (or `now` / `kick off now`). PR opened against `main`, CodeRabbit `APPROVED`, squash-merged.

#### Commit 0.2 — Cloud accounts & domains

Manual operator work (not Claude Code), but tracked here:
- [ ] Vercel Pro account active.
- [ ] Cloudflare account, all 8 domains transferred or pointed.
- [ ] Neon project created via Vercel marketplace.
- [ ] Resend account verified.
- [ ] AWS account + SES sandbox requested production access.
- [ ] Anthropic API key with budget cap.
- [ ] PostHog project, Sentry project, Axiom workspace.
- [ ] 1Password vault `BEC-Production` populated with every credential.
- [ ] Backblaze B2 bucket with lifecycle rules.
- [ ] Upstash Redis free tier provisioned.
- [ ] Cloudflare Turnstile site key.

#### Commit 0.3 — Environment validation

> "Create `packages/config/env.ts` that defines a Zod schema for every environment variable used in BEC. Group by app/package. Export typed `serverEnv` and `clientEnv` objects. The schema must boot-fail if a required variable is missing in production. Also create a `.env.example` at the repo root with every variable documented and grouped by purpose. Implement the safety rails from ADR-038 (PROD_DB_ALLOWED, EMAIL_REAL_SEND_ENABLED)."

**Acceptance**: Removing `DATABASE_URL` from `.env` causes `pnpm dev` to fail with a clear message. `.env.example` is comprehensive.

#### Commit 0.4 — Logger and Sentry

> "Create `packages/logger` exporting a Pino instance with multiple transports: pretty-print to stdout in dev, structured JSON in production with Sentry transport for warn+ and Axiom transport for everything. Initialize Sentry in each Next.js app via `@sentry/nextjs`. Confirm source-map upload on Vercel deploy."

**Acceptance**: A test `logger.error()` call shows up in Sentry. Axiom receives structured logs.

#### Commit 0.5 — Storybook scaffolding

> "Set up Storybook in `packages/ui` with the @storybook/addon-a11y addon, theme switcher (three archetypes), Tailwind v4 integration. Add a placeholder Button story rendered in all three archetypes. Configure deployment to a `bec-storybook` Vercel project at `ui.bestemeraldcoast.com` with password protection."

**Acceptance**: Storybook runs locally. Deployed Storybook is reachable with password.

#### Commit 0.6 — CI baseline

> "Create `.github/workflows/ci.yml` that on every PR: installs with pnpm, runs `turbo lint`, `turbo type-check`, `turbo test:unit` against a Neon ephemeral branch. Cache Turbo, cache pnpm. Add Vercel Remote Cache integration."

**Acceptance**: A throwaway PR runs CI in under 5 minutes.

### Phase 0 quality gate (ADR-035)

- [ ] Repo structure matches plan.
- [ ] `pnpm install` and `pnpm turbo build` succeed.
- [ ] All cloud accounts provisioned and 1Password is populated.
- [ ] Env validation fails loudly when secrets are missing.
- [ ] Sentry captures a test error from each app.
- [ ] Storybook deploys and renders the placeholder.
- [ ] CI runs green on a no-op PR.

---

## Phase 1 — Database, Ops Console, Lead Pipeline

**Goal**: Postgres schema fully migrated, ops-console deployed at `ops.bestemeraldcoast.com`, operator can log in, Scout and Diagnoser run end-to-end producing real lead data.

**Estimated time**: 2-3 weeks.

### Phase 1 — Claude Code commits

#### Commit 1.1 — Drizzle schemas

> "In `packages/db/schema/`, create the Drizzle schemas exactly as defined in the project plan's Database Schema section: `sites.ts` (sites + categories), `businesses.ts` (businesses + enrichment log), `leads.ts` (leads + status history), `outreach.ts`, `editorial.ts` (articles, article_businesses, editorial_feedback, authors), `images.ts`, `events.ts`, `audience.ts` (subscribers, newsletter_issues, newsletter_sends), `monetization.ts` (featured_listings, sponsorships), `projects.ts`, `ops.ts` (agent_runs, agent_budgets). Export everything from `packages/db/schema/index.ts`. Also create `packages/db/client.ts` exporting a configured Neon serverless drizzle client. Generate the initial migration with `drizzle-kit generate`."

**Acceptance**: `drizzle-kit migrate` runs cleanly. All tables exist in the dev branch. `drizzle-kit studio` shows the schema.

#### Commit 1.2 — Seed data

> "Create `packages/db/seed.ts` that idempotently seeds: 8 site rows with placeholder theme tokens (one per archetype), 3-5 categories per site (per ADR-021's taxonomy), 2 author rows ('BEC Editorial' as AI + the operator as human reviewer), agent budget rows for all 9 agents (per ADR-018). Add a `pnpm db:seed` script."

**Acceptance**: Running seed against an empty DB populates it. Running it again is a no-op.

#### Commit 1.3 — Migration tests

> "Create `scripts/test-migrations.ts` that, in CI, runs every Drizzle migration forward, then rolls back, and verifies the schema returns to its prior state. Wire to the CI workflow."

**Acceptance**: CI runs migration tests. A purposely-broken migration fails CI.

#### Commit 1.4 — Ops-console scaffold + auth

> "In `apps/ops-console`, set up a Next.js 16 app with App Router, Tailwind v4, and shadcn (vendored to packages/ui). Configure NextAuth with the magic link provider over Resend. Create `(auth)/login` route and a `(app)` route group with auth guard. Single allow-listed email (operator's address). Deploy to Vercel as project `bec-ops-console`, mapped to `ops.bestemeraldcoast.com`. Apply the Apple HIG ops-side principles documented in the project plan (dark mode default, 44pt tap targets, modal sheets via shadcn Sheet)."

**Acceptance**: Operator can log in on iPhone Safari. Unauthenticated requests redirect to login. Magic link works end-to-end.

#### Commit 1.5 — Internal agent API

> "In `apps/ops-console/app/api/agent/`, create the internal API surface that all agents call. Endpoints: `POST /leads` (create), `PATCH /leads/:id` (update + status transitions), `POST /leads/:id/lock` (acquire lock), `POST /leads/:id/release`, `POST /businesses` (upsert by googlePlaceId), `POST /agent-runs` (record a run), `POST /agent-runs/:id/finalize` (record cost and outcome). Auth via `Bearer ${AGENT_API_KEY}` header (separate from operator auth). All mutations enforce status transition validity and write to `lead_status_history`. Rate-limit per ADR-017."

**Acceptance**: Postman/curl tests pass. Lock acquisition is exclusive (concurrent requests get 409). Unauthorized requests get 401.

#### Commit 1.6 — Ops-console: Leads view

> "Create `(app)/leads/page.tsx` showing a table of leads with columns: business name, niche, city, status, gap score, days in current status, lock holder. Filter by status. Sort by gap score desc by default. Click a row to open `(app)/leads/[id]` with full detail (diagnosis, offer, mockup if present, status history, manual transition controls). Apply HIG: skeleton loading states, empty states, optimistic transitions with rollback toast, pull-to-refresh on mobile."

**Acceptance**: Loads correctly. Empty state ("No leads yet — run Scout to populate.") renders when DB empty. Status changes optimistically and rolls back on error.

#### Commit 1.7 — Mobile `/m` route — basic shell

> "Create `(app)/m/page.tsx` and the mobile route group. Implement bottom navigation (5 icons: Home, Leads, Replies, Articles, Metrics). Each tab gets a placeholder screen for now. Apply every Apple HIG principle from the project plan: 44pt taps, safe-area insets via env() CSS, modal sheets for compose, dark mode default, dynamic type honoring iOS settings, viewport-fit=cover, apple-mobile-web-app-capable. Add manifest.json so it can be added to home screen."

**Acceptance**: Add-to-home-screen works on iPhone. App-like behavior — no Safari chrome when launched from icon. All five tabs reachable.

#### Commit 1.8 — Agent runtime: Scout

> "In `agency/.claude/agents/scout.md`, write the Scout agent prompt with frontmatter including `version: 1`. The prompt: input is a query (niche + city); use Google Maps MCP to find ≤150 businesses matching the query within the city's geo radius; for each, look up googlePlaceId; check via the agent API whether business already exists; if new, POST it. Then for each new business, evaluate against gap-score signals; if score >= 60, create a lead with status `new`. Respect daily caps (150 scanned, 30 leads added). All work logged via agent_runs. Also: in `agency/.mcp.json`, register Google Maps MCP server and the Postgres read-only MCP. Create slash command `/scout` in `agency/.claude/commands/scout.md` that takes a query string."

**Acceptance**: `claude /scout pensacola charter fishing` produces ≥10 lead rows in DB with diagnoses pending. Daily cap enforced.

#### Commit 1.9 — Agent runtime: Diagnoser

> "In `agency/.claude/agents/diagnoser.md`, write Diagnoser prompt with frontmatter `version: 1`. Input: a lead id with status `new`. Behavior: fetch business detail from API, visit website (or note absence), evaluate against the Diagnoser checklist documented in the project plan, write a 50-word diagnosis, propose a tiered offer based on gap_score. Apply ADR-034 copy quality rubric to the diagnosis text. Update lead via API to status `diagnosed`. Log to agent_runs. Slash command `/diagnose [lead_id]` and a batch `/diagnose-pending` that processes up to today's remaining cap."

**Acceptance**: For 10 leads, Diagnoser produces 10 diagnoses. Operator review confirms ≥7/10 sound like a thoughtful human consultant.

#### Commit 1.10 — Editorial rotation foundation schema

> "Add the editorial rotation tables to `packages/db/schema/editorial-rotation.ts` per the Editorial Rotation Specification: `niches`, `niche_category_map`, `season_weights`, `season_events`, `pipeline_signals`. Generate migrations. Update `packages/db/seed.ts` to seed the 10 priority niches with commercial/editorial values per the spec's profile table, the 30 niche-category-archetype mappings (3 archetypes × 10 niches per the spec), the 120 monthly season weights (10 niches × 12 months per the seasonal weight table), and the 8 named season events. Also add `minimumWeeklyArticles` (default 2) and `maximumWeeklyArticles` (default 3) columns to the sites table."

**Acceptance**: All tables created. Seeded data is queryable. A test query like `getSeasonalWeight('charter_fishing', new Date('2026-06-15'))` returns 1.5 with active "Wedding peak" event boosting nearby niches.

#### Commit 1.11 — Pipeline signal capture

> "Update Scout and Diagnoser agents (and prepare hooks for Builder, Filmer, Pitcher, inbound webhook handlers — these come online in Phase 2-5) to write `pipeline_signals` rows alongside their normal work per the Editorial Rotation Specification. Each agent gets one extra POST to the agent API per action. The agent-api endpoints `POST /pipeline-signals` and `GET /pipeline-signals?niche=&city=&since=` are added. Signal types and strengths per the spec table."

**Acceptance**: Running Scout on a sample query produces matching `pipeline_signals` rows. The trailing-14-day query returns expected signals. Pipeline data starts accumulating during Phase 1 and grows naturally through Phase 5; Curator (Phase 6) launches against 8-12 weeks of real data.

### Phase 1 quality gate (ADR-035)

- [ ] Neon database provisioned via Vercel; production + preview branches verified.
- [ ] All Drizzle migrations run cleanly forward and backward.
- [ ] All tables (sites, categories, businesses, business_enrichment_log, leads, lead_status_history, outreach_messages, articles, article_businesses, editorial_feedback, authors, images, article_images, events, subscribers, newsletter_issues, newsletter_sends, featured_listings, sponsorships, projects, project_tasks, agent_runs, agent_budgets, **niches, niche_category_map, season_weights, season_events, pipeline_signals**) created and seeded.
- [ ] 8 sites seeded with placeholder theme tokens.
- [ ] 10 priority niches seeded with commercial/editorial values.
- [ ] 30 niche-category-archetype mappings seeded.
- [ ] 120 season weights seeded (10 niches × 12 months).
- [ ] 8 named season events seeded.
- [ ] Ops-console deploys to `ops.bestemeraldcoast.com` with NextAuth magic link working.
- [ ] Operator can log in on iPhone Safari without bugs.
- [ ] Scout runs on a sample query and writes ≥10 leads to the database.
- [ ] Scout writes `pipeline_signals` rows alongside lead creation.
- [ ] Diagnoser produces a 50-word diagnosis for each lead.
- [ ] Diagnoser writes `pipeline_signals` rows on diagnosis completion.
- [ ] **External validation**: 3 friends/peers shown 5 random Diagnoser outputs blind, asked "human or AI?". At least 3/5 pass as human.
- [ ] All Phase 1 unit tests (per ADR-016) pass on CI.
- [ ] One restore drill (ADR-006) run successfully.

---

## Phase 2 — Outreach + Editorial Foundation

**Goal**: Pitcher, Checker, and Editor running end-to-end. First real cold messages sent. First articles published on a city site with full SEO foundation. The editorial app deployed at all 8 domains.

**Estimated time**: 3-4 weeks.

### Phase 2 — Claude Code commits

#### Commit 2.1 — Editorial app shell with `proxy.ts`

> "In `apps/editorial`, create a Next.js 16 app with App Router, Tailwind v4 with `@theme` directive, packages/ui imports. Implement `proxy.ts` (Next 16 replacement for middleware.ts) that resolves the request host to a `siteId` via DB lookup, writes the site context to `request.headers`, and rewrites accordingly. Cache the host->site map in Upstash Redis with 60s TTL. Set up route segments: `/` (home), `/[category]` (category index), `/[category]/[slug]` (article), `/businesses/[slug]` (business profile), `/events`, `/events/[slug]`, `/authors/[slug]`, `/(legal)/{privacy,terms,disclosure,cookies,editorial-standards}` MDX pages. Apply HIG reader-side principles: comfortable measure, 44pt taps, no autoplay, no layout shift."

**Acceptance**: Hitting `bestpensacola.com` shows the Pensacola site shell. Hitting `bestdestinfl.com` shows Destin's. All 8 domains map. Lighthouse mobile score >= 95 for performance, accessibility, best practices, SEO.

#### Commit 2.2 — Theme system + Magazine archetype

> "In `packages/ui/theme/`, implement `tokens.ts` (SiteTheme type from ADR-032), `apply.ts` (server function that converts theme tokens into a CSS-variables string for inline injection on `<html>`), and `archetypes/magazine.ts` (full Magazine token set). In `packages/ui/components/`, build the Magazine layouts and primitives needed for an article: SiteHeader, SiteFooter, ArticleLayout, ArticleCard, ListicleSection, BusinessCard, NewsletterSignupInline, BreadcrumbNav, FeaturedListingMagazine. Every component reads CSS variables; nothing hardcoded. Add Storybook stories for each. Update Pensacola's seeded site row with the Magazine token set."

**Acceptance**: Pensacola's homepage renders with the Magazine archetype. Storybook shows every component. axe-core finds 0 violations.

#### Commit 2.3 — Article rendering with structured data

> "Build the `(site)/[category]/[slug]/page.tsx` route in editorial. Use Cache Components + 'use cache' with a cacheTag tied to the article slug. Render the article with the Magazine ArticleLayout. Embed JSON-LD: `Article` for the article itself, `BreadcrumbList` for the trail, `LocalBusiness` for any businesses referenced via article_businesses. Implement Open Graph and Twitter card meta. Implement canonical URL per ADR-010 (city is canonical; hub points back if syndicated). Honor the AI authorship + reviewer byline pattern from ADR-027. Add the FTC sponsored disclosure rendering (ADR-015) when isSponsored=true."

**Acceptance**: Google's Rich Results Test validates the structured data. View source shows correct OG tags, canonical URL, JSON-LD. Sponsored articles display the badge.

#### Commit 2.4 — Sitemap, robots, OG image generation

> "Create `app/sitemap.xml/route.ts` that generates per-domain sitemaps from articles, businesses, events, and static pages. Create `app/robots.txt/route.ts` with the rules from ADR-009. Add `app/[category]/[slug]/opengraph-image.tsx` for dynamic OG image generation using Next.js Image Response. Apply per-archetype design to OG cards."

**Acceptance**: `/sitemap.xml` validates. `/robots.txt` matches ADR-009. OG cards render correctly when shared on iMessage/Twitter.

#### Commit 2.5 — Coastal and Premium archetypes

> "Implement `packages/ui/theme/archetypes/coastal.ts` and `premium.ts` with full token sets per ADR-032. Build any archetype-specific component variants needed (e.g., FeaturedListingCoastal, FeaturedListingPremium). Update Storybook to show every component in all three archetypes. Update the seeded site rows for the remaining 7 sites with appropriate archetype tokens."

**Acceptance**: All 8 domains render in their assigned archetype. Storybook shows the matrix. axe-core passes for all variants.

#### Commit 2.6 — Editor agent

> "In `agency/.claude/agents/editor.md`, write the Editor agent (version 1). Input: a content brief (siteId, contentType, target keyword, businessIds to feature). Behavior: query the site's voice/tone via theme tokens, query verified business details via API, generate a draft article matching the editorial calendar (ADR-021) and respecting banned phrases (ADR-034). Save originalDraftBody. Slash command `/draft-article` that takes a brief or pulls one from a draft queue. After 20 published articles, slash command `/refine-editor` reads recent editorial_feedback rows and proposes prompt improvements (ADR-020)."

**Acceptance**: Editor produces 3 drafts; operator publishes after editing; `editorial_feedback` rows captured. `/refine-editor` produces a coherent prompt-improvement proposal.

#### Commit 2.7 — Editorial composer (ops-console)

> "In `apps/ops-console/(app)/editorial/`, build the composer: list view (drafts/scheduled/published), detail view with markdown editor + live preview + business linker (search + add to article_businesses) + image picker (with required alt text gate per ADR-022) + category dropdown + sponsored toggle + publish button. The publish button is split: `Publish` and `Publish + Note feedback` (ADR-020). Apply HIG principles for desktop + mobile."

**Acceptance**: Operator can edit, link businesses, set hero image with alt text, publish. Required-alt-text gate prevents save without alt. Editorial feedback row written on publish.

#### Commit 2.8 — Checker agent

> "In `agency/.claude/agents/checker.md`, write Checker (version 1). Loads the rubric file `agency/.claude/rubrics/copy-quality.md` and `banned-phrases.md` (create both with the content from ADR-034). Input: a draft outreach message + lead context. Output: pass/fail + score 0-12 + per-dimension scores + notes. ≥9/12 with no zero passes. Updates outreachMessages.checkerScore and checkerNotes."

**Acceptance**: Checker correctly fails messages containing banned phrases. Passes natural-sounding messages.

#### Commit 2.9 — Pitcher agent + Resend integration

> "Implement `packages/email/templates/outreach.tsx` (React Email) — three template variants matching the three archetypes' voice. In `agency/.claude/agents/pitcher.md`, write Pitcher (version 1). Input: an outreach message that has passed Checker. Behavior: pick channel from contactChannels priority order, render the template, send via Resend, write outreachMessages.sentAt and sentMessageId, attach a tracking code, log to agent_runs. Daily cap 30. Slash command `/pitch [outreach_id]` and `/pitch-batch` for the daily run."

**Acceptance**: Pitcher sends to a test inbox successfully. Tracking code embeds in links. Daily cap enforced.

#### Commit 2.10 — Legal pages package + cookie consent

> "Create the five legal MDX pages from ADR-014 (Privacy, Terms, Disclosure, Cookie Policy, Editorial Standards) in `packages/content/legal/`. Render them in editorial under `(legal)/`. Add a cookie consent banner using `vanilla-cookieconsent` or PostHog's built-in consent — minimal banner for non-EU, full CMP for EU. Add the AI disclosure label ('Drafted with AI assistance, edited by [Author]') to the article byline footer."

**Acceptance**: All 5 legal pages render on every domain. Cookie consent works. AI disclosure visible.

#### Commit 2.11 — Rate limiting + Turnstile

> "Implement Upstash Redis rate limiting in `apps/editorial` and `apps/newsletter-public` per ADR-017. Add Turnstile to all newsletter signup forms and the contact form. Implement email validation (syntax + MX + disposable-domain blocklist) on signups. Add the Search Console verification TXT records for all 8 domains (track in `docs/runbooks/domain-setup.md`)."

**Acceptance**: A burst of 10 signups from one IP returns 429. Turnstile shows up. Disposable emails are rejected silently.

### Phase 2 quality gate (ADR-035)

- [ ] Checker runs all outputs through ADR-034 rubric.
- [ ] Pitcher dispatches 10 real cold messages via Resend.
- [ ] **External validation**: ≥1 reply within 7 days from those 10 sends.
- [ ] No reply contains "is this AI?".
- [ ] Editorial app deployed at all 8 domains via `proxy.ts`.
- [ ] At least 1 city site has 3 published articles, fully rendered with structured data.
- [ ] Sitemap, robots, OG, JSON-LD all validate via Google Rich Results Test.
- [ ] All Phase 2 unit + Playwright tests pass.
- [ ] Lighthouse mobile score ≥ 95 on all four pillars for a representative article page.
- [ ] axe-core finds 0 violations on home, article, business profile, signup pages.

---

## Phase 3 — Newsletter Infrastructure

**Goal**: SES out of sandbox, double opt-in confirmed, the first newsletter sent successfully to a small list, unsubscribe + preferences working, full per-archetype theming on emails.

**Estimated time**: 2 weeks.

### Phase 3 — Claude Code commits

#### Commit 3.1 — SES sandbox exit + DKIM/SPF/DMARC

Manual + Claude-assisted operator work:

> "Help me request SES production access for `mail.bestemeraldcoast.com`. Generate the DKIM, SPF, DMARC, and MX records I need to add to Cloudflare DNS for `bestemeraldcoast.com` (the only sending root, per ADR-013). Walk me through verifying the domain in SES."

**Acceptance**: SES production access granted. Domain verified. DKIM passes mail-tester.com check (10/10).

#### Commit 3.2 — Newsletter-public app

> "Create `apps/newsletter-public` Next.js 16 app deployed to Vercel as `bec-newsletter-public` mapped to `mail.bestemeraldcoast.com` and `subscribe.bestemeraldcoast.com`. Routes: `/` (multi-site signup hub), `/[siteSlug]` (per-site signup), `/confirm/[token]` (double opt-in), `/unsubscribe/[token]`, `/preferences/[token]`, `/archive/[siteSlug]` (public newsletter archive). Apply per-archetype theming. Apply HIG: 44pt taps, comfortable measure, single-column reading, no autoplay, dismissible inline signup."

**Acceptance**: All routes render. Site detection by URL parameter works. axe-core passes.

#### Commit 3.3 — Subscriber API + double opt-in

> "Build `/api/subscribe` in newsletter-public that: validates email (syntax + MX + disposable list), runs Turnstile check, rate-limits per ADR-017, creates subscriber row with status 'pending' + double_opt_in_token, sends confirmation email via Resend (React Email template, archetype-themed). `/confirm/[token]` route validates token, sets status 'active' and confirmedAt timestamp. `/unsubscribe/[token]` with one-click flow per CAN-SPAM (no login required), sets status 'unsubscribed' and reason. `/preferences/[token]` lets subscriber pick interestedSiteIds and interestedCategories with debounced auto-save."

**Acceptance**: Full flow works end-to-end on iPhone. DB rows transition correctly. axe-core passes. Unsubscribe takes ≤2 taps.

#### Commit 3.4 — Newsletter templates (React Email)

> "Create `packages/email/templates/newsletter/` with: `NewsletterLayout.tsx` (the chassis: header, footer with physical address per CAN-SPAM, unsubscribe link top + bottom, color-scheme meta), `HeroStory.tsx`, `SecondaryStory.tsx`, `FeaturedListingBlock.tsx` (with 'Featured' badge per ADR-025), `EventsBlock.tsx`. Three archetype variants per component. System fonts only (per ADR-033). Dark mode via prefers-color-scheme. Max width 600px. Snapshot tests for each template."

**Acceptance**: Templates render in Litmus across 30+ clients without breaks. Dark mode works in Apple Mail and Gmail. Snapshot tests pass.

#### Commit 3.5 — Newsletter composer (ops-console)

> "In `apps/ops-console/(app)/newsletter/`, build the issue composer: list view (drafts/scheduled/sent), detail view with subject + preheader fields (combined char counter, target ≤100), MDX editor for issue content, drag-to-reorder story blocks, featured listing picker (deducts newsletterMentionsRemaining), event picker, scheduled-send time picker, recipient count preview, send-test-to-self button. Apply HIG principles."

**Acceptance**: Operator can compose, preview, send test, and schedule. Test send reaches operator's inbox in <30s.

#### Commit 3.6 — Send pipeline + cron

> "Build the send pipeline: a Vercel cron at `0 9 * * 5` (Friday 9am ET, scheduled-send for Phase 3) hits `/api/cron/send-newsletter` (auth via CRON_SECRET per ADR-038). The handler queries scheduled issues due to send, expands recipients (per site/category preferences), batches via SES (max 5,000/day per ADR-030), records newsletterSends rows, writes per-recipient tracking codes. Open and click tracking via tracking pixel + redirect endpoints. Bounce + complaint handling via SES SNS webhook → `/api/sns/ses` → updates subscriber status."

**Acceptance**: A scheduled issue sends to 5 test recipients. Opens and clicks track in DB. A bounced email updates subscriber.status to 'bounced'.

#### Commit 3.7 — Public newsletter archive + RSS

> "Add `/archive/[siteSlug]` showing the issue list and `/archive/[siteSlug]/[issueNumber]` showing the rendered issue (server-renders the React Email template to a public HTML page). Add `/feed.xml` per site for RSS, `/events.ics` per site for calendar subscription."

**Acceptance**: Archive renders. RSS validates. iCal feed imports successfully into Apple Calendar.

### Phase 3 quality gate (ADR-035)

- [ ] SES exited sandbox; sending domain verified DKIM + SPF + DMARC.
- [ ] Newsletter-public app deployed at `mail.bestemeraldcoast.com`.
- [ ] Double opt-in flow tested 5x: signup → email → confirm → DB shows `confirmed_at`.
- [ ] One newsletter sent to a list of 5 (operator + friends). All 5 received it; 0 in spam.
- [ ] Unsubscribe link works one-click; DB shows `unsubscribed_at` immediately.
- [ ] Apple Mail, Gmail, Outlook web all render the newsletter without layout breaks.
- [ ] Mail-tester.com score ≥ 9/10 for a real send.
- [ ] One restore drill run successfully.

---

## Phase 4 — Asset Generation

**Goal**: Builder agent producing real Lovable mockups, Filmer producing 10-second videos, mockup approval flow on `/m`. First outreach with mockup + video sent.

**Estimated time**: 2 weeks.

### Phase 4 — Claude Code commits

#### Commit 4.1 — Storage abstraction + Vercel Blob + B2

> "In `packages/storage/`, create the storage abstraction with two backends (Vercel Blob for hot, B2 for cold per ADR-005). Functions: `uploadHot(file, options)`, `uploadCold(file, options)`, `mirrorToCold(blobUrl)`, `getPublicUrl(handle)`. Encapsulate auth and SDK details. Used by every part of the system that needs file storage."

**Acceptance**: Test uploads succeed in both backends. Mirror function copies a Blob asset to B2 verified.

#### Commit 4.2 — Builder agent

> "In `agency/.claude/agents/builder.md`, write Builder (version 1). Input: a lead with status 'diagnosed' and gap_score ≥ 70. Behavior: read diagnosis + business details, generate a Lovable prompt, invoke Lovable (operator may be in the loop initially via slash command), capture screenshot, run a self-review (looks-real check), retry up to 2x if review fails, upload screenshot to Vercel Blob via storage package, write leads.mockupUrl. Daily cap 4 (ADR-030). Slash command `/build-mockup [lead_id]` and `/build-batch`."

**Acceptance**: Builder produces a real Lovable mockup for one lead end-to-end. Screenshot URL renders in ops-console.

#### Commit 4.3 — Filmer agent

> "In `agency/.claude/agents/filmer.md`, write Filmer (version 1). Input: a lead with mockupUrl set. Behavior: generate a 10-second vertical (9:16) MP4 via Higgsfield API, scripted hook ('Hey [Name], here's what your site could look like…'), capture the mockup, add CTA endcard. Upload to Vercel Blob via storage package, write leads.videoUrl. Daily cap 4. Slash command `/film-mockup [lead_id]`."

**Acceptance**: Filmer produces one MP4 from a mockup. Plays correctly on iPhone Safari.

#### Commit 4.4 — Mockup approval on `/m`

> "Build `(app)/m/mockups/page.tsx` showing pending-approval mockups in a card list. Tap to open `(app)/m/mockups/[id]`: full-screen mockup screenshot, video below, swipe-right approve / swipe-left reject (with haptic feedback via Web Vibration API), notes field for rejection reason. Approve transitions lead to 'build_ready' (ready for outreach). Reject sends back to Builder with notes. Apply every ADR-029 spec."

**Acceptance**: Operator approves a real mockup from iPhone in <10 seconds. Haptic fires. Optimistic UI shows approval; reverts on server error.

#### Commit 4.5 — Outreach with mockup + video

> "Update the outreach email template (`packages/email/templates/outreach.tsx`) to embed the mockup screenshot and a video play button (linking to a hosted page with the inline video). Update Pitcher to include mockup/video URLs when present. Add a tracking link for video views. Update Resend send to include the screenshot as an attachment-like inline image."

**Acceptance**: Operator receives a test outreach email with the mockup visible and the video playable on iPhone.

### Phase 4 quality gate (ADR-035)

- [ ] Builder generates a Lovable mockup for one real lead, screenshot saved to Blob.
- [ ] Filmer renders a 10-second vertical video for that mockup.
- [ ] Mockup gate in ops-console: operator can approve/reject from `/m` with haptic feedback.
- [ ] First outreach with mockup + video sent.
- [ ] **External validation**: blind review of 10 mockups by 2 other people; ≥7/10 rated "looks like a real agency built it".

---

## Phase 5 — Booking Loop + Mobile + Customer Relationships

**Goal**: Inbound replies ingest correctly, Mobile agent drafts responses, operator books real calls from iPhone, full mobile control plane polished. **Plus**: customer relationship layer fully built — first closed deal lands in a working CRM with unified client view, communication log, ticket SLA tracking, and Concierge-driven proactive touches.

**Estimated time**: 4-5 weeks (was 2-3; expanded for ADR-041 customer relationship layer).

### Phase 5 — Claude Code commits

#### Commit 5.1 — Reply ingestion (email + SMS)

> "In `apps/ops-console/api/inbound/email/route.ts`, build the Resend Inbound webhook handler per ADR-024: parse incoming email, match In-Reply-To/References against outreachMessages.sentMessageId, populate replyBody and repliedAt, run sentiment classification via Claude Haiku and write replySentiment, transition lead to 'replied'. **Also**: check whether sender email matches `clients.primaryContactEmail` — if so, route to client communication flow (commit 5.11) instead. In `api/inbound/sms/route.ts`, do the same for Twilio webhooks matching by phone number. Also add `api/sns/ses/route.ts` for SES bounce/complaint webhooks updating subscriber status. Write `pipeline_signals` rows on reply received (per the editorial rotation spec)."

**Acceptance**: Real reply to a test outreach correctly tags as 'replied' in DB with sentiment classified within 2 seconds. Bounce updates subscriber status. Pipeline signal written.

#### Commit 5.2 — Mobile agent

> "In `agency/.claude/agents/mobile.md`, write Mobile (version 1). Input: outreachMessages with replyBody set and replySentiment in ('positive', 'question'), no draftedResponse yet. Behavior: read full thread context, draft a conversational reply ≤80 words, include Calendly link if positive intent detected, write to draftedResponse. Slash command `/draft-replies` runs hourly batch."

**Acceptance**: Mobile drafts a reply for a real positive reply within 1 minute. Draft includes Calendly link when appropriate.

#### Commit 5.3 — Reply approval on `/m`

> "Build `(app)/m/replies/page.tsx` showing pending replies with sentiment badge. `(app)/m/replies/[id]` shows the full thread, the drafted response, edit-in-place, swipe-right approve-and-send / swipe-left decline-with-note. Approving fires Pitcher to send via the same channel. Apply ADR-029 spec — haptic feedback, modal sheet for edit."

**Acceptance**: Operator approves a drafted reply from iPhone; the reply lands in the prospect's inbox within 30 seconds.

#### Commit 5.4 — Calendly integration

> "Register the Calendly MCP server in `agency/.mcp.json`. Mobile uses it to surface available slots in drafted replies (next 5 business-hour slots). When prospect books, Calendly webhook → `/api/inbound/calendly` → updates lead status to 'booked' and creates a Project record placeholder. **Also**: write `pipeline_signals` row with signalType='booked_call', strength 60."

**Acceptance**: A real Calendly booking transitions the lead, creates project row, and writes pipeline signal.

#### Commit 5.5 — Articles approval on `/m`

> "Build `(app)/m/articles/page.tsx` showing draft articles. Tap to open the article preview (rendered as it would appear on the live site). Swipe-right approve-and-publish / swipe-left reject-with-notes / tap to edit-on-desktop (sends operator a deep link to the desktop composer). Apply ADR-029."

**Acceptance**: Operator publishes an article from iPhone. Article goes live within 60 seconds.

#### Commit 5.6 — Metrics view on `/m`

> "Build `(app)/m/metrics/page.tsx` showing today's: signups, sends, replies, dollars. Pull-to-refresh. Tap a tile to drill into a 7-day chart. Apply ADR-029."

**Acceptance**: Metrics load on iPhone in <500ms. Numbers match a manual SQL query.

#### Commit 5.7 — Project tracking (Projects tab)

> "Build `(app)/projects/` (desktop) and `(app)/m/projects/` (mobile) showing kanban by status. Project detail page with brief, tasks, files, comm log. Maintenance plan view filters offerType='maintenance' showing recurring tasks. Implement read-only public share link `/share/projects/[id]?token=...` for clients."

**Acceptance**: Operator can move a project through statuses, add tasks, share a public read-only view with a client.

#### Commit 5.8 — Client schema + lead-to-client promotion logic

> "Add the customer relationship tables per the Customer Relationship Specification: `clients`, `communication_log`, `tickets`, `scheduled_touches` with all enums (`client_status`, `communication_direction`, `communication_channel`, `ticket_status`, `ticket_priority`, `scheduled_touch_type`, `scheduled_touch_status`). Generate migrations. Add `packages/config/sla-defaults.ts` with the SLA defaults table from the spec. Implement the `promoteLead(leadId, dealAmountCents, offerType)` function in `packages/db/clients.ts` that runs in a transaction: creates/updates clients row, creates projects row (existing), inserts initial communication_log entry, schedules appropriate touches via `computeInitialTouches(clientId, offerType)`, updates business.isClient, transitions lead to 'closed_won'. Add agent API endpoints: `POST /clients/promote-lead`, `POST /clients/:id/communication`, `POST /clients/:id/tickets`, `POST /clients/:id/touches`, `PATCH /tickets/:id/respond`, `PATCH /tickets/:id/resolve`."

**Acceptance**: All tables created. Manually transitioning a lead to closed_won via the API correctly creates client + project + communication_log + scheduled_touches rows in one transaction. Failure rolls back atomically.

#### Commit 5.9 — Client list and detail views (desktop)

> "Build `(app)/clients/page.tsx` (list view with filters per spec — status, products, last contact age, city, niche, has open tickets) and `(app)/clients/[id]/page.tsx` (detail view with all six tabs: Overview, Products, Communication, Tickets, Editorial, Activity). Header strip with status, LTV, last contact, next touch. Quick action row (Log a call, Send email, Open ticket, Schedule touch) using shadcn Sheet for modals. Use shadcn Tabs for tab navigation. Apply HIG patterns. Side panel on list view shows aggregate metrics for filtered set."

**Acceptance**: A test client with all 4 product types renders correctly across all 6 tabs. Filtering and sorting work. axe-core finds 0 violations.

#### Commit 5.10 — Client mobile views

> "Build `(app)/m/clients/page.tsx` (list, filters as collapsible sheet) and `(app)/m/clients/[id]/page.tsx` (detail with swipeable segmented control for tabs). Communication log uses iMessage-style chat bubbles per ADR-041 (you on right, client on left, internal notes centered with dotted border). Floating action button (FAB) opens sheet with quick actions. Pull-to-refresh on communication. Haptic feedback. Apply every ADR-029 spec."

**Acceptance**: Operator can navigate full client view from iPhone in <30s. iMessage-style log feels natural. axe-core passes.

#### Commit 5.11 — Communication log integration

> "Wire the communication channels per the spec: (1) Resend `email.sent` webhook → POST to internal endpoint that matches recipient and creates outbound communication_log entry. (2) Resend Inbound webhook (commit 5.1) — extend to: if sender matches existing client, route to client communication flow (auto-create ticket if new thread, append to existing thread otherwise) instead of outreach flow. (3) Twilio SMS webhook same pattern for SMS. (4) 'Log a call' modal sheet UI with duration, participants, summary, sentiment fields. (5) 'Add note' field on client view that creates internal_note entries. Sentiment classification via Haiku for inbound."

**Acceptance**: Outbound email to a client auto-logs. Inbound from a client creates a ticket and appends to communication thread. SMS works. Manual call logging works. Internal notes render distinctly in timeline.

#### Commit 5.12 — Tickets system + SLA monitoring

> "Build `(app)/tickets/page.tsx` (desktop) and `(app)/m/tickets/page.tsx` (mobile) per the spec — sorted by SLA-breach-soonest, color-coded green/yellow/red, filterable. Ticket detail page with conversation thread, status changes, related comm log entries. Implement Vercel cron at `*/30 9-18 * * 1-5` (every 30 min during business hours) at `/api/cron/sla-monitor` that scans open tickets, computes SLA elapsed %, sets slaWarning at 75% and slaBreach at 100% with Slack/SMS alert on breach. Auto-create tickets from inbound emails (handled in 5.11) using SLA defaults from `packages/config/sla-defaults.ts` based on highest-tier active product."

**Acceptance**: Manually creating a ticket sets correct SLA timestamps. SLA monitor cron correctly flags warning at 75% and breach at 100%. Slack alert fires on breach. Color coding visible in UI.

#### Commit 5.13 — Concierge agent

> "Write `agency/.claude/agents/concierge.md` (version 1) per the prompt skeleton in the Customer Relationship Specification. Create `agency/.claude/concierge-templates/` with template files for each scheduled_touch_type (maintenance_check_in.md, post_launch_30_day.md, post_launch_90_day.md, post_launch_180_day.md, featured_listing_review.md, nps_request.md, renewal_warning.md, renewal_final.md, sponsorship_pre_send.md, sponsorship_post_send.md, reactivation.md, birthday.md). Add Vercel crons: `/api/cron/concierge-daily` at `0 7 * * *`, `/api/cron/concierge-weekly` at `0 7 * * 1`, `/api/cron/concierge-monthly` at `0 7 1 * *`. Each runs the appropriate Concierge routine, drafts touches, surfaces in queue. Build `(app)/m/concierge/page.tsx` — daily approval queue with swipe gestures (per the spec's approval queue section). Run drafted touches through Copy Quality Rubric (ADR-034). Add slash command `/run-concierge` for manual invocation."

**Acceptance**: Concierge daily run produces drafted touches in queue. Operator can approve via swipe in <30s per touch. Approval rate >90% on first 20 drafts (target). Failed copy quality drafts retry once, mark 'skipped' with reason on second fail.

### Phase 5 quality gate (ADR-035)

- [ ] Inbound email webhook ingests replies and classifies sentiment.
- [ ] Mobile agent drafts response for a positive reply.
- [ ] Operator approves on iPhone `/m` → Calendly link sent.
- [ ] **End-to-end success**: one real prospect books a real call from this pipeline.
- [ ] All `/m` routes pass HIG checklist (44pt taps, safe area, dynamic type, dark mode, reduced motion, haptic feedback).
- [ ] VoiceOver tested through the full mobile flow without breaks.
- [ ] Projects tab works for tracking won deals through delivery.
- [ ] **First closed deal**: lead → closed_won correctly creates client + project + communication_log + scheduled_touches in atomic transaction.
- [ ] Client detail view renders all 6 tabs correctly for a test client with mixed products.
- [ ] iMessage-style communication log works on iPhone with all 8 channel types.
- [ ] Tickets auto-create from inbound emails matched to existing clients.
- [ ] SLA monitor cron correctly flags warning + breach with Slack alert.
- [ ] Concierge produces drafted touches for due scheduled_touches; operator approves >80% without significant edits.
- [ ] Pipeline signals being captured by Scout, Diagnoser, Pitcher, inbound webhook handlers, and Calendly webhook (the data Curator will need in Phase 6).

---

## Phase 6 — Editorial Automation + Growth Engine

**Goal**: Curator agent and brief queue UI fully live — editorial calendar generates itself with operator approving 14 briefs/week in 20 minutes. Growth agent producing weekly recommendations. Sponsorships product live, A/B testing operational, network effects compounding. By the end of Phase 6, both flywheels run with minimal operator overhead.

**Estimated time**: 5-7 weeks (was 3-4; expanded for ADR-040 editorial rotation).

### Phase 6 — Claude Code commits

#### Commit 6.1 — Growth agent

> "In `agency/.claude/agents/growth.md`, write Growth (version 1). Input: trailing 7-day metrics (PostHog + Postgres). Behavior: identify top-performing articles by signup conversion, lowest-performing categories, subject-line patterns that win, sponsorship slot inventory remaining, propose 3 specific actionable tweaks. Output: a Friday-morning report rendered in `(app)/metrics/growth-report` and emailed to operator. Slash command `/run-growth-report`."

**Acceptance**: Friday's report contains 3 specific, actionable, evidence-backed recommendations.

#### Commit 6.2 — Featured listings + sponsorship product

> "Build `(app)/sponsorships/` for inventory management: featured listings calendar by site, newsletter sponsorship slot calendar, contract value tracking. Auto-deduct newsletterMentionsRemaining when a featured listing appears in a newsletter. Render featured listings in editorial per ADR-025 (placement enum). Build a public-facing `/advertise/[siteSlug]` page with rate card. **Also**: when a featured_listing is created, auto-schedule renewal_warning + renewal_final touches per ADR-041."

**Acceptance**: Operator sells one real featured listing manually. Listing appears in correct placements. Newsletter mentions deduct correctly. Renewal touches scheduled.

#### Commit 6.3 — A/B testing infrastructure

> "Implement prompt A/B testing per ADR-019: prompt_variants table, weighted variant selection in orchestrator, comparative metrics in `(app)/metrics/prompts`. Subject line A/B testing in newsletter composer using PostHog feature flags."

**Acceptance**: Two Editor variants run head-to-head; metrics show comparative pass rate. Subject line A/B test runs on a real send.

#### Commit 6.4 — Audience segmentation for sends

> "Implement per-subscriber send targeting using interestedSiteIds and interestedCategories. The newsletter composer can target: all-active, by primarySite, by interestedCategory, by engagement tier (highly-engaged = opened ≥3 of last 5; dormant = no open in 60 days re-engagement campaign)."

**Acceptance**: A targeted send to "Pensacola subscribers interested in Eat & Drink" reaches only matching subscribers.

#### Commit 6.5 — Analytics dashboards (PostHog)

> "Build PostHog funnels and dashboards per ADR-011 event taxonomy: signup-to-confirmed funnel, article-to-signup funnel, outreach-click-to-reply funnel. Embed key dashboard tiles in `(app)/metrics/`. Export a weekly digest."

**Acceptance**: Funnels populate with real data. Dashboard tiles render in ops-console. Weekly digest emails to operator.

#### Commit 6.6 — Editorial scoring package

> "Create `packages/editorial-scoring/` implementing the scoring algorithm from the Editorial Rotation Specification. Functions: `scoreCandidate()`, `generateScoredCandidatesForWeek()`, `getEligibleNiches()`, `getPipelineSignalScore()`, `getSeasonalWeight()`, `getContentDebtScore()`, `getBusinessInventoryScore()`, `getContentTypeFit()`. All pure functions taking explicit DB inputs (testable). Add unit tests covering edge cases: low-inventory exclusion, recently-published exclusion, archetype-excluded niches, evergreen backfill ranking. Component weights and pipeline signal strengths per the spec tables."

**Acceptance**: Unit tests pass. Running against seeded test data produces deterministic candidate rankings. Edge cases (Premium archetype excluding HVAC, low inventory blocking listicles, etc.) verified.

#### Commit 6.7 — Briefs schema and agent API

> "Add `briefs` and `evergreen_brief_bank` tables (already in master schema; just generate migrations). Seed `evergreen_brief_bank` with ~30 cross-niche guide ideas per archetype (90 total — Curator drafts a starter set if operator doesn't author). Add agent-api endpoints per spec: `POST /briefs` (Curator creates), `PATCH /briefs/:id/approve`, `PATCH /briefs/:id/reject`, `PATCH /briefs/:id/edit`, `GET /briefs?status=proposed&weekStart=`. All approve/reject/edit endpoints write to brief status history."

**Acceptance**: Endpoints work via Postman. A brief moves through full lifecycle correctly. 90 evergreens seeded.

#### Commit 6.8 — Curator agent

> "Write `agency/.claude/agents/curator.md` (version 1) per the prompt skeleton in the Editorial Rotation Specification. Add slash command `/curate-week [weekStart]`. The agent reads scored candidates from `packages/editorial-scoring/`, applies diversification rules (max 2 listicles/site/week, no same niche twice in same week, at least 1 profile/site/week), generates briefs by calling Sonnet for headline/angle materialization, writes to DB. Hub gets the special-case logic per the spec (weekly aggregate, regional roundup, cross-niche guide). Backfill from evergreen_brief_bank when score ranks fall below threshold."

**Acceptance**: Running `/curate-week` produces 14-18 briefs across 8 sites. Each brief has plausible headline + angle. Diversification rules verified manually. Hub briefs follow special logic (no niche rotation).

#### Commit 6.9 — Sunday cron + Vercel Workflow integration

> "Add Vercel cron at `0 23 * * 0` invoking `/api/cron/curate-week`. The handler authenticates via CRON_SECRET (per ADR-038), runs the scoring algorithm to produce skeleton briefs (pure SQL/TS, fits in function timeout), then triggers a Vercel Workflow that runs Curator's headline/angle materialization in the background. On completion, fires a Slack/Telegram notification to operator. Also add cleanup cron at `0 6 * * 1` that marks unpublished approved briefs from prior weeks as `expired`."

**Acceptance**: Cron fires Sunday night. By Monday 8am, the queue is materially complete. Operator receives notification. Expired briefs cleaned up Monday morning.

#### Commit 6.10 — Editorial queue UI (desktop)

> "Build `apps/ops-console/(app)/editorial/queue/page.tsx` per the spec. 8-site grid, brief cards with score color-coding (green ≥70, yellow 50-70, red <50), one-tap approve/edit/reject, 'Why this score?' disclosure panel showing component scores as horizontal bar chart. Bulk-approve buttons. Edit modal sheet with editable headline (char counter, target ≤65), angle, business list (drag to reorder, search-and-add), keyword chips. Use shadcn primitives. Apply ADR-036 a11y throughout. Low-pipeline warnings visible per spec."

**Acceptance**: Operator can approve a full queue (~14 briefs) in <20 minutes from desktop. axe-core finds 0 violations. Score breakdown is auditable.

#### Commit 6.11 — Editorial queue UI (mobile)

> "Build `(app)/m/queue/page.tsx` and `(app)/m/queue/[id]/page.tsx` per the spec section. Stack layout, swipe-right approve, swipe-left edit, long-press reject with reason. Haptic feedback. Modal sheet for edits. Pull-to-refresh. Apply every ADR-029 spec. Bottom bar: 'X of 14 reviewed', 'Approve remaining above 70' shortcut button."

**Acceptance**: Operator can approve full queue from iPhone in <20 minutes. Swipe gestures feel right; haptic fires. Bulk actions work.

#### Commit 6.12 — Article publish loop integration

> "Update Editor's `/draft-article` slash command to pull from approved briefs (oldest first) instead of operator-supplied briefs. When Editor drafts, set `briefs.articleId` and `briefs.status = 'in_draft'`. When article publishes, set `briefs.status = 'published'`. Add the weekly cleanup cron's expiration logic so unpublished approved briefs from prior weeks become 'expired'. Update Editor's prompt to honor edited headline/angle when present (if operator edited the brief)."

**Acceptance**: Approving a brief and running Editor's draft command produces an article linked to that brief. Status transitions correctly. Edited briefs use operator's edits, not Curator's originals.

#### Commit 6.13 — Curator metrics dashboard

> "Build `(app)/metrics/curator/page.tsx` per the spec — queue size by week, approval rate, edit rate, reject rate, score distribution histogram, coverage heatmap (niche × week), coverage per site (vs min/max), pipeline-to-publish lag, backfill rate, brief expiration rate. Add slash command `/refine-curator` that runs after 4 weeks of data, comparing approved vs. rejected briefs and proposing weight adjustments to the scoring algorithm."

**Acceptance**: Metrics populate with real data after 2-4 weeks of Curator runs. `/refine-curator` produces sensible weight-adjustment suggestions.

#### Commit 6.14 — Curator proposal mode + auto-flow gate

> "Add a feature flag `CURATOR_AUTO_FLOW=false` (default). While off, briefs require operator approval before flowing to Editor (the queue *is* the gate). After 4 weeks of stable proposals (operator approves >80% without significant edits), flip to `true` to allow auto-flow of high-confidence briefs (score >85, no diversification overrides). Briefs below 85 still require approval."

**Acceptance**: Auto-flow gate works (toggleable via env var). When on, briefs >85 with clean diversification skip approval. When off, all briefs require approval. Manual override via `/curate-week` always available.

### Phase 6 quality gate (ADR-035)

- [ ] Growth agent proposes 3 newsletter optimizations weekly.
- [ ] One sponsored newsletter issue sent (paid by a real business).
- [ ] **External validation**: $1 of newsletter sponsorship revenue earned independent of any web build deal.
- [ ] One real featured listing sold and displayed.
- [ ] A/B testing harness produces statistically meaningful comparison after 100 runs/variant.
- [ ] **Curator generates 14-brief queue Sunday night**; operator approves in <20 minutes Monday morning.
- [ ] Editor pulls from approved briefs automatically.
- [ ] Curator approval rate ≥60% after 4 weeks stable.
- [ ] Curator backfill rate <20%.
- [ ] All editorial calendar slots filled per week (no empty slots due to algorithm failure).
- [ ] Hub publishes weekly aggregate + 1-2 regional roundups/month.
- [ ] Pipeline-to-publish lag (median days from pipeline signal to article on niche) ≤21 days.

---

## Operating Constraints & Guardrails

Per ADR-030, these are the operational parameters the system runs against. All numbers live in `packages/config/operational-params.ts` — agents read them at runtime.

| Parameter | Value | Notes |
|---|---|---|
| Scout daily cap (businesses scanned) | 150 | Hard cap; ramped only after Phase 4 |
| Scout daily cap (new leads added) | 30 | Even if 150 are scanned |
| Diagnoser daily cap | 30 | Matches Scout output |
| Builder daily cap (mockups) | 4 | Phase 4 ramp; Phase 5+ may reach 6-8 |
| Filmer daily cap | 4 | One per Builder mockup |
| Pitcher daily cap | 30 | Outreach sends/day across all channels |
| Checker daily cap | 60 | Up to 2 passes per message |
| Editor daily cap (drafts) | 2 | Phase 2-3; raised once feedback loop tunes |
| Curator weekly cap (briefs) | 14-18 | Sunday run only; ~2 per site per week |
| Concierge daily cap (touches) | 15 | Stays manageable for 5-10 min daily review |
| Approval threshold (deal value) | $3,000 | Quotes above require human approval |
| Reply rate floor (per niche) | 12% | 7-day rolling window |
| Newsletter sending volume cap | 5,000/day | SES warmup ramps over 30 days |
| Curator approval rate floor | 50% | Below this, run /refine-curator |
| Concierge approval rate floor | 80% | Below this, review touch templates |
| Open ticket SLA breach rate | 5% | Above this, audit SLA defaults |
| Active client lastContactedAt floor | 30 days | Active clients shouldn't go quiet |
| Agent daily $ cap (combined) | $35 | Per ADR-018; +$6 for Curator + Concierge |
| Agent monthly $ cap (combined) | $700 | Per ADR-018; updated for 11 agents |

### Per-agent budget defaults (ADR-018)

| Agent | Daily | Monthly |
|---|---|---|
| Scout | $5 | $100 |
| Diagnoser | $4 | $80 |
| Builder | $8 | $150 |
| Filmer | $3 | $60 |
| Checker | $1 | $20 |
| Pitcher | $1 | $20 |
| Mobile | $1 | $20 |
| Editor | $4 | $80 |
| Growth | $2 | $40 |
| **Curator** | **$3** | **$60** |
| **Concierge** | **$3** | **$70** |
| **Total** | **$35** | **$700** |

### Hard rails (cannot be bypassed without human approval in chat)

- No outreach to businesses with `riskFlag = 'high'`.
- No outreach to businesses with `doNotContact = true`.
- No outreach with Checker score < 9/12.
- No newsletter send without operator approval.
- No deal closed > $3,000 without operator approval on the call.
- No Postgres mutation from agents — all writes go through the API (ADR-003).
- No deletion of subscriber data — only status transitions to 'unsubscribed'.

### Red flags that pause the system

- Bounce rate > 3% on a send → pause newsletter sends, investigate.
- Complaint rate > 0.1% → pause sends, investigate.
- Reply rate < 12% over rolling 7 days for a niche → pause Pitcher for that niche, retune.
- Checker fail rate > 50% week-over-week → audit prompts.
- Daily agent budget burn at 80% by noon → alert + cap-down.

---

## Revenue Model

| Product | Price | Cadence | Notes |
|---|---|---|---|
| **Starter website** | $1,500 (one-time) | Per project | 5-page Lovable build, deployed to Vercel |
| **Standard website** | $3,500 (one-time) | Per project | 10-page custom, includes booking integration |
| **Growth website** | $7,500 (one-time) | Per project | Custom design, e-comm or advanced functionality |
| **Hosting & maintenance** | $200/month | Recurring | Domain + Vercel + monthly edits |
| **Featured listing** | $99-199/year | Recurring | Per ADR-025 placement variants |
| **Newsletter sponsorship** | $200-1,500/send | One-time | Per-issue inventory in ops-console |
| **Sponsored editorial** | $500-2,000/article | One-time | FTC-disclosed per ADR-015 |
| **Custom content packages** | $2,500-10,000/month | Recurring | Multi-piece editorial calendar for one business |

**Year-1 target mix** (illustrative, not commitment):
- 2 web builds/month × $3,500 avg = $7,000/month one-time
- 8 maintenance plans by month 12 × $200 = $1,600/month recurring
- 20 featured listings × $150 avg = $3,000/year recurring
- 4 newsletter sponsorships/month × $500 avg = $2,000/month recurring
- 2 sponsored articles/month × $750 avg = $1,500/month recurring

---

## Daily Operating Procedures

### Morning ops (8:00am–9:00am CT, Mac at desk)

1. Check Sentry for overnight errors (`#bec-alerts` Slack).
2. Check PostHog dashboard for yesterday's signups + opens.
3. **Check `/m/concierge`** — review drafted touches Concierge prepared overnight (~5-10 min, swipe-approve most). Skip or edit any that don't feel right.
4. **Check `/tickets`** — scan for red (SLA breached) or yellow (warning) tickets. Respond to red tickets first (these have already missed SLA).
5. Run `claude /run-orchestrator` which:
   - Reviews pending replies → Mobile drafts responses (routing client replies to client comm flow, prospect replies to outreach flow).
   - Runs Diagnoser on any leads from yesterday's Scout pass that are still 'new'.
   - Runs Builder on top 4 leads.
   - Runs Filmer on completed mockups.
   - Runs Checker on pending outreach.
   - Surfaces approval queue summary.
6. Open ops-console → review approval queue, approve/reject batch.
7. Open editorial composer → review Editor's drafts, edit, publish.

### Mobile triage throughout the day (`/m` from iPhone)

- Reply approvals as they come in (target: < 1 hour response time during business hours).
- Mockup approvals (target: < 4 hours during business hours).
- Article approvals (target: end of day).
- **Concierge touches** — quick approvals as drafts surface (target: same-day for any drafts marked `urgent`).
- **Tickets** — respond to red (breached) tickets immediately; address yellow (warning) within 2 hours.

### Evening review (8:00pm–9:00pm CT)

1. Run `/run-growth-report` (Fridays only).
2. Review tomorrow's editorial calendar — adjust briefs if needed (or wait for Curator's Sunday queue if mid-week).
3. **Check tickets** — final scan for end-of-day SLA risk; respond or set status to 'waiting_on_client' as appropriate.
4. **Check active clients** — any with `lastContactedAt > 30 days` and no scheduled touch upcoming? Schedule one via `/m/clients/[id]`.
5. Check daily agent spend vs. cap.
6. Skim `/metrics` for anomalies.

### Weekly cadence

| Day | Focus |
|---|---|
| Mon | **Approve Curator brief queue at `/m/queue` or `/editorial/queue` (~20 min)**; Scout new niche/city; Editor pulls top-priority briefs and drafts 2 articles |
| Tue | Outreach batch send (30); Editor 2 drafts from queue |
| Wed | Builder/Filmer batch; mockup-equipped outreach; **Concierge weekly run** drafts client check-ins |
| Thu | Reply triage day; deal calls; client tickets pass |
| Fri | Newsletter send; Growth report; planning |
| Sat | Light editorial publishing; client follow-up clean-up |
| Sun | **Curator cron runs at 11pm ET** — generates next week's brief queue (operator approves Monday morning); planning; off-time |

### Monthly cadence

- Restore drill (per ADR-006).
- Secret rotation review (per ADR-007).
- Budget review vs. actuals (all 11 agents).
- Editorial taxonomy review (categories adjusted as needed).
- Sponsorship inventory adjustment.
- **Concierge monthly run** — completed-projects-without-NPS scan, quarterly business review prep.
- **Client review** — list view filtered by lastContactedAt > 30 days; ensure no active clients are quiet without a scheduled touch.

### Quarterly cadence

- Restore drill execution + log.
- Lawyer review of legal pages if material changes happened.
- Prompt-refinement deep dive (Editor, Diagnoser, Pitcher, **Curator, Concierge**).
- Pricing review.
- Phase quality gate retrospective.
- **Curator weight tuning** — run `/refine-curator` against trailing 12 weeks of approval/edit/reject data; adjust scoring weights if approval rate <50% or backfill rate >40%.
- **Seasonal weight refresh** — review the season_weights table against year-over-year traffic data; tune for upcoming year.
- **Client churn analysis** — review churned cohort, identify patterns, adjust touch templates or SLA defaults if needed.

### Annual cadence

- **Editorial rotation full audit** — review all 10 priority niches, niche-category-archetype mappings, named season events. Drop niches with low commercial+editorial value, add new ones based on lead pipeline trends.
- **SLA defaults review** — adjust per-product response/resolution times based on actual operator capacity and client expectations.
- **Concierge template refresh** — review all touch templates; rewrite any that have produced low approval rates or feel stale.

---

*This MASTER project plan is the source-of-truth implementation guide. When decisions change, update both this document and the relevant ADR. Never silently drift — the documents are the spec.*

*Companion document: `bec-architecture-decisions.md` (39 ADRs).*

*Last updated: founding draft, alongside the ADR document.*
