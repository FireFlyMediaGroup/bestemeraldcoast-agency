// Idempotent seed script for the BEC database (Phase 1 / Commit 1.2).
//
// Run with:
//
//   pnpm --filter @bec/db db:seed
//
// Acceptance (master plan § Commit 1.2): "Running seed against an empty DB
// populates it. Running it again is a no-op." Achieved here by targeting each
// table's unique constraint with Drizzle's `.onConflictDoNothing()`.
//
// What gets seeded:
//   - 8 sites (3 magazine + 2 coastal + 3 premium per ADR-032), each with a
//     placeholder SiteTheme matching the archetype tokens from ADR-032.
//   - 6 categories per archetype per ADR-021 (so 18 unique category templates
//     × 8 sites, but only the matching archetype's set is inserted per site).
//   - 2 authors: "BEC Editorial" (AI) and "Operator" (human reviewer).
//   - 9 agent budgets per ADR-018's table (scout/diagnoser/builder/filmer/
//     checker/pitcher/mobile/editor/growth).
//
// Env: DATABASE_URL is required (validated via @bec/config's serverEnv).
// A `.env` at the repo root is auto-loaded via dotenv before @bec/config
// resolves so the seed works locally without explicit env exports.

import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

// Schema imports have zero runtime side effects — they're table definitions
// and pure types. We can static-import them without triggering @bec/config's
// env validation. Only `client.ts` (which reads `serverEnv.DATABASE_URL`)
// must wait until after dotenv has populated process.env.
import * as schema from "./schema/index.js";
import type { SiteTheme } from "./schema/types.js";
import { computeSeasonalWeight } from "./season.js";

// Load `.env` from the repo root BEFORE importing @bec/db's client — it
// reaches into @bec/config's validated serverEnv at module load and would
// crash with "DATABASE_URL: Required" if dotenv hasn't run first.
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..");
dotenv.config({ path: path.join(repoRoot, ".env") });

const { getDb } = await import("./client.js");
const { assertProdDbAccessible } = await import("@bec/config");

type Archetype = "magazine" | "coastal" | "premium";

// ─────────────────────────────────────────────────────────────────────
// Placeholder theme tokens per archetype (ADR-032).
//
// Mirrors `@bec/ui/theme/archetypes/{magazine,coastal,premium}.ts`. Inlined
// here so @bec/db's seed has zero dependency on the UI package; if the two
// drift the contract violation surfaces in code review or via a future
// `@bec/types` consolidation. Initial token values are direct from ADR-032.
// ─────────────────────────────────────────────────────────────────────

const themeTokens: Record<Archetype, SiteTheme> = {
  magazine: {
    archetype: "magazine",
    colors: {
      background: "oklch(0.98 0.01 80)",
      foreground: "oklch(0.18 0 0)",
      primary: "oklch(0.30 0.06 240)",
      primaryFg: "oklch(0.98 0.01 80)",
      accent: "oklch(0.75 0.13 70)",
      accentFg: "oklch(0.18 0 0)",
      muted: "oklch(0.94 0.01 80)",
      mutedFg: "oklch(0.45 0.02 80)",
      border: "oklch(0.88 0.01 80)",
      success: "oklch(0.55 0.13 145)",
      warning: "oklch(0.72 0.14 70)",
      danger: "oklch(0.58 0.17 25)",
    },
    fonts: {
      heading: "Fraunces, Georgia, serif",
      body: "Inter, system-ui, sans-serif",
      weights: { heading: [400, 600, 700], body: [400, 500, 700] },
    },
    radius: { sm: "4px", md: "6px", lg: "8px", xl: "12px" },
    spacing: { contentMaxWidth: "720px", sectionGap: "4rem" },
    imagery: { style: "editorial", heroAspect: "3/2", treatment: "natural" },
    voice: {
      tagline: "Stories from your corner of the coast.",
      tone: "casual",
      sampleHeadlinePattern: "The {Adjective} {Noun} {Locals} {Verb}",
    },
  },
  coastal: {
    archetype: "coastal",
    colors: {
      background: "oklch(1.00 0 0)",
      foreground: "oklch(0.20 0.02 220)",
      primary: "oklch(0.55 0.12 220)",
      primaryFg: "oklch(1.00 0 0)",
      accent: "oklch(0.72 0.14 30)",
      accentFg: "oklch(0.20 0.02 220)",
      muted: "oklch(0.96 0.02 220)",
      mutedFg: "oklch(0.45 0.03 220)",
      border: "oklch(0.88 0.02 220)",
      success: "oklch(0.62 0.15 160)",
      warning: "oklch(0.78 0.14 70)",
      danger: "oklch(0.62 0.18 25)",
    },
    fonts: {
      heading: '"General Sans", Inter, system-ui, sans-serif',
      body: "Inter, system-ui, sans-serif",
      weights: { heading: [500, 600, 700], body: [400, 500, 600] },
    },
    radius: { sm: "8px", md: "10px", lg: "12px", xl: "16px" },
    spacing: { contentMaxWidth: "800px", sectionGap: "5rem" },
    imagery: { style: "lifestyle", heroAspect: "16/9", treatment: "natural" },
    voice: {
      tagline: "Where the locals go.",
      tone: "punchy",
      sampleHeadlinePattern: "{Number} {Things} You {Must} {Verb} in {Place}",
    },
  },
  premium: {
    archetype: "premium",
    colors: {
      background: "oklch(0.97 0.01 90)",
      foreground: "oklch(0.20 0.01 90)",
      primary: "oklch(0.20 0.01 90)",
      primaryFg: "oklch(0.97 0.01 90)",
      accent: "oklch(0.65 0.05 140)",
      accentFg: "oklch(0.20 0.01 90)",
      muted: "oklch(0.93 0.01 90)",
      mutedFg: "oklch(0.50 0.01 90)",
      border: "oklch(0.85 0.01 90)",
      success: "oklch(0.55 0.10 145)",
      warning: "oklch(0.72 0.12 70)",
      danger: "oklch(0.55 0.16 25)",
    },
    fonts: {
      heading: '"Editorial New", Fraunces, Georgia, serif',
      body: '"Söhne", "Inter Tight", Inter, system-ui, sans-serif',
      weights: { heading: [300, 400, 500], body: [400, 500] },
    },
    radius: { sm: "2px", md: "3px", lg: "4px", xl: "6px" },
    spacing: { contentMaxWidth: "900px", sectionGap: "6rem" },
    imagery: { style: "minimal", heroAspect: "21/9", treatment: "desaturated" },
    voice: {
      tagline: "A measured look at the coast.",
      tone: "refined",
      sampleHeadlinePattern: "On {Noun}: a {Field} {Practitioner} reflects",
    },
  },
};

// ─────────────────────────────────────────────────────────────────────
// Sites — 8 rows per ADR-032's archetype table.
// ─────────────────────────────────────────────────────────────────────

interface SiteSeed {
  slug: string;
  domain: string;
  name: string;
  tagline: string;
  archetype: Archetype;
  isHub: boolean;
  sendingFromName: string;
}

const sitesSeed: SiteSeed[] = [
  // Magazine — Pensacola, Fort Walton Beach, Emerald Coast hub.
  {
    slug: "bestpensacola",
    domain: "bestpensacola.com",
    name: "Best Pensacola",
    tagline: "Stories from Pensacola's corner of the coast.",
    archetype: "magazine",
    isHub: false,
    sendingFromName: "Pensacola Weekly",
  },
  {
    slug: "bestfortwaltonbeach",
    domain: "bestfortwaltonbeach.com",
    name: "Best Fort Walton Beach",
    tagline: "Local stories from Fort Walton Beach.",
    archetype: "magazine",
    isHub: false,
    sendingFromName: "Fort Walton Beach Weekly",
  },
  {
    slug: "bestemeraldcoast",
    domain: "bestemeraldcoast.com",
    name: "Best Emerald Coast",
    tagline: "The hub for the Emerald Coast network.",
    archetype: "magazine",
    isHub: true,
    sendingFromName: "Emerald Coast Weekly",
  },
  // Coastal — Pensacola Beach, Destin.
  {
    slug: "bestpensacolabeach",
    domain: "bestpensacolabeach.com",
    name: "Best Pensacola Beach",
    tagline: "Sun, surf, and locals' picks for Pensacola Beach.",
    archetype: "coastal",
    isHub: false,
    sendingFromName: "Pensacola Beach Weekly",
  },
  {
    slug: "bestdestinfl",
    domain: "bestdestinfl.com",
    name: "Best Destin FL",
    tagline: "Where to go and what to do in Destin.",
    archetype: "coastal",
    isHub: false,
    sendingFromName: "Destin Weekly",
  },
  // Premium — South Walton, CR 30A, 30A Life.
  {
    slug: "bestsouthwalton",
    domain: "bestsouthwalton.com",
    name: "Best South Walton",
    tagline: "A measured look at South Walton.",
    archetype: "premium",
    isHub: false,
    sendingFromName: "South Walton",
  },
  {
    slug: "bestcr30a",
    domain: "bestcr30a.com",
    name: "Best CR 30A",
    tagline: "The road through 30A's towns.",
    archetype: "premium",
    isHub: false,
    sendingFromName: "CR 30A",
  },
  {
    slug: "best30alife",
    domain: "best30a.life",
    name: "30A Life",
    tagline: "Coastal living, refined.",
    archetype: "premium",
    isHub: false,
    sendingFromName: "30A Life",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Categories — 6 per archetype per ADR-021.
//
// The master plan's Commit 1.2 prompt says "3-5 categories per site"; ADR-021
// is the authoritative source and lists 6 per archetype. We follow the ADR.
// Each category is seeded for every site that matches the archetype.
// ─────────────────────────────────────────────────────────────────────

interface CategorySeed {
  slug: string;
  name: string;
  description: string;
}

const categoriesByArchetype: Record<Archetype, CategorySeed[]> = {
  magazine: [
    { slug: "eat-drink", name: "Eat & Drink", description: "Restaurants, bars, coffee, markets." },
    { slug: "things-to-do", name: "Things to Do", description: "Beaches, outdoors, family, nightlife." },
    { slug: "stay", name: "Stay", description: "Hotels, vacation rentals, B&Bs." },
    { slug: "events", name: "Events", description: "What's happening this week and beyond." },
    { slug: "local-business", name: "Local Business", description: "Services, shops, wellness." },
    { slug: "city-life", name: "City Life", description: "Real estate, moving guide, schools." },
  ],
  coastal: [
    { slug: "beaches-water", name: "Beaches & Water", description: "Where to swim, surf, and play." },
    { slug: "charters-boats", name: "Charters & Boats", description: "Fishing, sunset cruises, rentals." },
    { slug: "eat-drink", name: "Eat & Drink", description: "Restaurants, bars, coffee, markets." },
    { slug: "stay", name: "Stay", description: "Hotels, vacation rentals, condos." },
    { slug: "events", name: "Events", description: "What's happening this week and beyond." },
    { slug: "lifestyle", name: "Lifestyle", description: "Local culture, wellness, shops." },
  ],
  premium: [
    { slug: "towns-of-30a", name: "Towns of 30A", description: "Seaside, Rosemary, Alys, and more." },
    { slug: "stays-homes", name: "Stays & Homes", description: "Vacation rentals and architecture." },
    { slug: "restaurants-bars", name: "Restaurants & Bars", description: "Where to eat and drink along 30A." },
    { slug: "wellness-beauty", name: "Wellness & Beauty", description: "Studios, spas, and self-care." },
    { slug: "weddings-events", name: "Weddings & Events", description: "Venues, planners, and inspiration." },
    { slug: "style-design", name: "Style & Design", description: "Boutique shops and home goods." },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// Authors — 2 rows (ADR-027).
// ─────────────────────────────────────────────────────────────────────

const authorsSeed = [
  {
    slug: "bec-editorial",
    displayName: "BEC Editorial",
    bio: "The editorial voice of the Best Emerald Coast network. Drafts produced by AI agents, reviewed by a human editor.",
    isAi: true,
    isHumanReviewer: false,
    email: null,
    twitter: null,
  },
  {
    slug: "operator",
    displayName: "Operator",
    bio: "Human reviewer who approves and finalizes AI-drafted editorial.",
    isAi: false,
    isHumanReviewer: true,
    email: null,
    twitter: null,
  },
];

// ─────────────────────────────────────────────────────────────────────
// Agent budgets — 9 rows from ADR-018's table (USD).
// ─────────────────────────────────────────────────────────────────────

const agentBudgetsSeed = [
  { agentName: "scout", dailyBudgetUsd: "5.00", monthlyBudgetUsd: "100.00", hardStop: true },
  { agentName: "diagnoser", dailyBudgetUsd: "4.00", monthlyBudgetUsd: "80.00", hardStop: true },
  { agentName: "builder", dailyBudgetUsd: "8.00", monthlyBudgetUsd: "150.00", hardStop: true },
  { agentName: "filmer", dailyBudgetUsd: "3.00", monthlyBudgetUsd: "60.00", hardStop: true },
  { agentName: "checker", dailyBudgetUsd: "1.00", monthlyBudgetUsd: "20.00", hardStop: true },
  { agentName: "pitcher", dailyBudgetUsd: "1.00", monthlyBudgetUsd: "20.00", hardStop: true },
  { agentName: "mobile", dailyBudgetUsd: "1.00", monthlyBudgetUsd: "20.00", hardStop: true },
  { agentName: "editor", dailyBudgetUsd: "4.00", monthlyBudgetUsd: "80.00", hardStop: true },
  { agentName: "growth", dailyBudgetUsd: "2.00", monthlyBudgetUsd: "40.00", hardStop: true },
];

// ─────────────────────────────────────────────────────────────────────
// Editorial rotation (ADR-040) — Commit 1.10.
//
// All values transcribed from the master plan's Editorial Rotation
// Specification (priority-niche profile table, niche-category-archetype
// mapping, seasonal weight table, named seasonal events). Qualitative
// commercial/editorial labels map to a 0-100 scale:
//   Very high 90 · High 80 · Medium-high 65 · Medium 50 · Low-medium 35 · Low 20
// ─────────────────────────────────────────────────────────────────────

interface NicheSeed {
  id: string;
  displayName: string;
  commercialValue: number;
  editorialValue: number;
  primaryArchetypes: Archetype[];
  excludedArchetypes: Archetype[];
  notes: string;
}

const nichesSeed: NicheSeed[] = [
  { id: "charter_fishing", displayName: "Charter fishing", commercialValue: 80, editorialValue: 65, primaryArchetypes: ["coastal"], excludedArchetypes: [], notes: "Peak May-Sep; bookings-driven" },
  { id: "wedding_venues", displayName: "Wedding venues", commercialValue: 80, editorialValue: 80, primaryArchetypes: ["premium", "coastal"], excludedArchetypes: [], notes: "Peak Apr-Jun + Oct; high LTV" },
  { id: "vacation_rental_managers", displayName: "Vacation rental managers", commercialValue: 80, editorialValue: 50, primaryArchetypes: ["magazine", "coastal", "premium"], excludedArchetypes: [], notes: "Year-round; multi-property accounts" },
  { id: "boutique_hotels", displayName: "Boutique hotels", commercialValue: 80, editorialValue: 65, primaryArchetypes: ["premium", "coastal"], excludedArchetypes: [], notes: "Year-round; high touch" },
  { id: "seafood_restaurants", displayName: "Seafood restaurants", commercialValue: 50, editorialValue: 90, primaryArchetypes: ["magazine", "coastal", "premium"], excludedArchetypes: [], notes: "Year-round; biggest traffic driver" },
  { id: "dental_practices", displayName: "Dental practices", commercialValue: 80, editorialValue: 35, primaryArchetypes: ["magazine"], excludedArchetypes: [], notes: "Year-round; family-focused content" },
  { id: "hvac_contractors", displayName: "HVAC / contractors", commercialValue: 65, editorialValue: 20, primaryArchetypes: ["magazine"], excludedArchetypes: ["premium"], notes: "Seasonal demand; service-emergency content" },
  { id: "salon_spa", displayName: "Salon / spa", commercialValue: 50, editorialValue: 50, primaryArchetypes: ["premium", "coastal"], excludedArchetypes: [], notes: "Wedding tie-in; lifestyle content" },
  { id: "landscaping", displayName: "Landscaping", commercialValue: 50, editorialValue: 20, primaryArchetypes: ["magazine"], excludedArchetypes: [], notes: "Spring peak; visual-friendly" },
  { id: "auto_detailing", displayName: "Auto detailing", commercialValue: 35, editorialValue: 20, primaryArchetypes: ["magazine"], excludedArchetypes: ["premium"], notes: "Year-round; underserved niche" },
];

// niche → category slug per archetype (spec § Niche-category-archetype
// mapping). Premium excludes HVAC + auto detailing entirely (wrong voice
// fit); excluded rows still need a notNull primaryCategorySlug, so they
// carry a placeholder + isExcluded=true (readers gate on isExcluded).
interface NCMEntry {
  primary: string;
  secondary?: string;
  excluded?: boolean;
}
const nicheCategoryByArchetype: Record<Archetype, Record<string, NCMEntry>> = {
  magazine: {
    charter_fishing: { primary: "things-to-do" },
    wedding_venues: { primary: "local-business" },
    vacation_rental_managers: { primary: "stay" },
    boutique_hotels: { primary: "stay" },
    seafood_restaurants: { primary: "eat-drink" },
    dental_practices: { primary: "local-business" },
    hvac_contractors: { primary: "local-business" },
    salon_spa: { primary: "local-business" },
    landscaping: { primary: "local-business" },
    auto_detailing: { primary: "local-business" },
  },
  coastal: {
    charter_fishing: { primary: "charters-boats" },
    wedding_venues: { primary: "events" },
    vacation_rental_managers: { primary: "stay" },
    boutique_hotels: { primary: "stay" },
    seafood_restaurants: { primary: "eat-drink" },
    dental_practices: { primary: "lifestyle" },
    hvac_contractors: { primary: "lifestyle" },
    salon_spa: { primary: "lifestyle" },
    landscaping: { primary: "lifestyle" },
    auto_detailing: { primary: "lifestyle" },
  },
  premium: {
    charter_fishing: { primary: "restaurants-bars", secondary: "stays-homes" },
    wedding_venues: { primary: "weddings-events" },
    vacation_rental_managers: { primary: "stays-homes" },
    boutique_hotels: { primary: "stays-homes" },
    seafood_restaurants: { primary: "restaurants-bars" },
    dental_practices: { primary: "wellness-beauty" },
    hvac_contractors: { primary: "style-design", excluded: true },
    salon_spa: { primary: "wellness-beauty" },
    landscaping: { primary: "style-design" },
    auto_detailing: { primary: "style-design", excluded: true },
  },
};

// Seasonal weight table — 12 monthly multipliers per niche (Jan→Dec).
const seasonWeightByNiche: Record<string, number[]> = {
  charter_fishing: [0.6, 0.7, 1.0, 1.3, 1.5, 1.5, 1.5, 1.4, 1.3, 1.1, 0.7, 0.6],
  wedding_venues: [0.8, 0.9, 1.2, 1.5, 1.5, 1.4, 0.9, 0.9, 1.0, 1.4, 1.0, 0.8],
  vacation_rental_managers: [1.2, 1.3, 1.4, 1.2, 1.0, 1.1, 1.2, 1.1, 0.9, 0.9, 1.0, 1.3],
  boutique_hotels: [1.0, 1.1, 1.3, 1.2, 1.1, 1.1, 1.2, 1.1, 0.9, 1.0, 0.9, 1.0],
  seafood_restaurants: [0.9, 0.9, 1.2, 1.3, 1.2, 1.2, 1.3, 1.2, 1.0, 1.2, 1.0, 1.0],
  dental_practices: [1.1, 1.0, 1.0, 1.0, 0.9, 0.9, 1.0, 1.1, 1.1, 1.0, 1.0, 1.1],
  hvac_contractors: [1.2, 1.1, 1.0, 0.9, 1.0, 1.3, 1.4, 1.3, 1.0, 0.9, 1.0, 1.1],
  salon_spa: [1.0, 1.1, 1.3, 1.4, 1.3, 1.2, 1.0, 1.0, 1.0, 1.2, 1.1, 1.1],
  landscaping: [0.7, 0.8, 1.4, 1.5, 1.4, 1.2, 1.0, 1.0, 1.0, 1.1, 0.9, 0.7],
  auto_detailing: [0.9, 0.9, 1.1, 1.2, 1.1, 1.0, 1.0, 1.0, 1.0, 1.0, 0.9, 0.9],
};

// "All tourism niches" set (Memorial Day weekend boost) — the visitor-facing
// niches, per the spec's intent.
const TOURISM_NICHES = [
  "charter_fishing",
  "wedding_venues",
  "vacation_rental_managers",
  "boutique_hotels",
  "seafood_restaurants",
  "salon_spa",
];

// Named season events. Stored with representative 2026 dates; the resolver
// (`computeSeasonalWeight`) compares month/day year-agnostically.
interface SeasonEventSeed {
  name: string;
  startDate: string;
  endDate: string;
  boostedNicheIds: string[];
  multiplier: string;
  notes: string;
}
const seasonEventsSeed: SeasonEventSeed[] = [
  { name: "Spring break", startDate: "2026-03-01", endDate: "2026-04-15", boostedNicheIds: ["seafood_restaurants", "charter_fishing", "vacation_rental_managers"], multiplier: "1.6", notes: "Restaurants, Charters, VRMs" },
  { name: "Wedding peak", startDate: "2026-04-15", endDate: "2026-06-15", boostedNicheIds: ["wedding_venues", "salon_spa", "boutique_hotels"], multiplier: "1.8", notes: "Wedding venues, Salon/spa, Hotels" },
  { name: "Memorial Day weekend", startDate: "2026-05-23", endDate: "2026-05-27", boostedNicheIds: TOURISM_NICHES, multiplier: "1.4", notes: "All tourism niches" },
  { name: "July 4 week", startDate: "2026-06-30", endDate: "2026-07-07", boostedNicheIds: ["seafood_restaurants", "charter_fishing"], multiplier: "1.5", notes: "Restaurants, Charters" },
  { name: "Destin Seafood Festival", startDate: "2026-10-10", endDate: "2026-10-20", boostedNicheIds: ["seafood_restaurants", "charter_fishing"], multiplier: "1.7", notes: "Mid-October; Restaurants, Charters" },
  { name: "Fall wedding", startDate: "2026-09-15", endDate: "2026-11-01", boostedNicheIds: ["wedding_venues"], multiplier: "1.5", notes: "Wedding venues" },
  { name: "Snowbird arrival", startDate: "2026-11-01", endDate: "2026-12-15", boostedNicheIds: ["vacation_rental_managers", "seafood_restaurants", "dental_practices"], multiplier: "1.4", notes: "VRMs, Restaurants, Dental" },
  { name: "Pensacola Beach Air Show", startDate: "2026-07-10", endDate: "2026-07-20", boostedNicheIds: ["seafood_restaurants", "boutique_hotels"], multiplier: "1.3", notes: "Mid-July; Restaurants, Hotels" },
];

// ─────────────────────────────────────────────────────────────────────
// Seed orchestration.
// ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // ADR-038 prod-write guard. If `.env` accidentally has a production
  // DATABASE_URL but NODE_ENV isn't 'production' (and PROD_DB_ALLOWED isn't
  // set), this throws before any insert touches the wire. Belt against the
  // common "wrong .env in this shell" footgun.
  assertProdDbAccessible();

  const db = getDb();
  // eslint-disable-next-line no-console
  console.log("Seeding BEC database…");

  // ── Sites ────────────────────────────────────────────────────────
  const siteRows = sitesSeed.map((s) => ({
    slug: s.slug,
    domain: s.domain,
    name: s.name,
    tagline: s.tagline,
    archetype: s.archetype,
    themeTokens: themeTokens[s.archetype],
    isHub: s.isHub,
    sendingFromName: s.sendingFromName,
  }));
  await db.insert(schema.sites).values(siteRows).onConflictDoNothing({ target: schema.sites.slug });
  // eslint-disable-next-line no-console
  console.log(`  ✓ sites: ${siteRows.length} rows attempted (existing rows preserved)`);

  // ── Categories ───────────────────────────────────────────────────
  // Re-select sites to resolve siteIds (whether they were just inserted or
  // already existed). Slug is the natural key. Filter the result down to
  // the 8 seed slugs so this script only ever touches sites it owns —
  // running against a multi-tenant DB with unrelated sites won't fabricate
  // categories on them.
  const seededSiteSlugs = new Set(sitesSeed.map((s) => s.slug));
  const allPersistedSites = await db
    .select({ id: schema.sites.id, slug: schema.sites.slug, archetype: schema.sites.archetype })
    .from(schema.sites);
  const seededPersistedSites = allPersistedSites.filter((s) => seededSiteSlugs.has(s.slug));
  const siteIdBySlug = new Map(seededPersistedSites.map((row) => [row.slug, row]));

  let categoryRowCount = 0;
  const categoryRows: Array<{
    siteId: string;
    slug: string;
    name: string;
    description: string;
    sortOrder: number;
  }> = [];
  for (const site of seededPersistedSites) {
    const archetypeCats = categoriesByArchetype[site.archetype as Archetype];
    if (!archetypeCats) continue;
    archetypeCats.forEach((cat, index) => {
      categoryRows.push({
        siteId: site.id,
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        sortOrder: index,
      });
      categoryRowCount += 1;
    });
  }
  if (categoryRows.length > 0) {
    await db
      .insert(schema.categories)
      .values(categoryRows)
      .onConflictDoNothing({ target: [schema.categories.siteId, schema.categories.slug] });
  }
  // eslint-disable-next-line no-console
  console.log(
    `  ✓ categories: ${categoryRowCount} rows attempted across ${seededPersistedSites.length} of ${allPersistedSites.length} sites (filtered to seed-managed slugs)`,
  );
  void siteIdBySlug; // (held only for future child seeds that need slug → id resolution)

  // ── Authors ──────────────────────────────────────────────────────
  await db.insert(schema.authors).values(authorsSeed).onConflictDoNothing({ target: schema.authors.slug });
  // eslint-disable-next-line no-console
  console.log(`  ✓ authors: ${authorsSeed.length} rows attempted`);

  // ── Agent budgets ────────────────────────────────────────────────
  await db
    .insert(schema.agentBudgets)
    .values(agentBudgetsSeed)
    .onConflictDoNothing({ target: schema.agentBudgets.agentName });
  // eslint-disable-next-line no-console
  console.log(`  ✓ agent_budgets: ${agentBudgetsSeed.length} rows attempted`);

  // ── Editorial rotation: niches (ADR-040) ─────────────────────────
  await db
    .insert(schema.niches)
    .values(
      nichesSeed.map((n) => ({
        id: n.id,
        displayName: n.displayName,
        commercialValue: n.commercialValue,
        editorialValue: n.editorialValue,
        primaryArchetypes: n.primaryArchetypes,
        excludedArchetypes: n.excludedArchetypes,
        notes: n.notes,
      })),
    )
    .onConflictDoNothing({ target: schema.niches.id });
  // eslint-disable-next-line no-console
  console.log(`  ✓ niches: ${nichesSeed.length} rows attempted`);

  // ── niche_category_map (3 archetypes × 10 niches = 30) ───────────
  const ncmRows: Array<{
    nicheId: string;
    archetype: string;
    primaryCategorySlug: string;
    secondaryCategorySlug: string | null;
    isExcluded: boolean;
  }> = [];
  for (const archetype of ["magazine", "coastal", "premium"] as Archetype[]) {
    const map = nicheCategoryByArchetype[archetype];
    for (const niche of nichesSeed) {
      const entry = map[niche.id];
      if (!entry) continue;
      ncmRows.push({
        nicheId: niche.id,
        archetype,
        primaryCategorySlug: entry.primary,
        secondaryCategorySlug: entry.secondary ?? null,
        isExcluded: entry.excluded ?? false,
      });
    }
  }
  await db
    .insert(schema.nicheCategoryMap)
    .values(ncmRows)
    .onConflictDoNothing({
      target: [
        schema.nicheCategoryMap.nicheId,
        schema.nicheCategoryMap.archetype,
      ],
    });
  // eslint-disable-next-line no-console
  console.log(`  ✓ niche_category_map: ${ncmRows.length} rows attempted`);

  // ── season_weights (10 niches × 12 months = 120) ─────────────────
  const swRows: Array<{
    nicheId: string;
    month: number;
    multiplier: string;
  }> = [];
  for (const [nicheId, months] of Object.entries(seasonWeightByNiche)) {
    months.forEach((mult, i) => {
      swRows.push({ nicheId, month: i + 1, multiplier: String(mult) });
    });
  }
  await db
    .insert(schema.seasonWeights)
    .values(swRows)
    .onConflictDoNothing({
      target: [schema.seasonWeights.nicheId, schema.seasonWeights.month],
    });
  // eslint-disable-next-line no-console
  console.log(`  ✓ season_weights: ${swRows.length} rows attempted`);

  // ── season_events (8) ────────────────────────────────────────────
  await db
    .insert(schema.seasonEvents)
    .values(
      seasonEventsSeed.map((e) => ({
        name: e.name,
        startDate: e.startDate,
        endDate: e.endDate,
        boostedNicheIds: e.boostedNicheIds,
        multiplier: e.multiplier,
        notes: e.notes,
      })),
    )
    .onConflictDoNothing({ target: schema.seasonEvents.name });
  // eslint-disable-next-line no-console
  console.log(`  ✓ season_events: ${seasonEventsSeed.length} rows attempted`);

  // ── Acceptance check (master plan § Commit 1.10) ─────────────────
  // getSeasonalWeight('charter_fishing', 2026-06-15) must return 1.5:
  // June base for charter_fishing is 1.5; the only event active on Jun 15
  // is "Wedding peak" (Apr 15–Jun 15), which boosts wedding/salon/hotels
  // — NOT charter — so the base is returned unchanged.
  const verifyDate = new Date("2026-06-15T00:00:00Z");
  const swForVerify = await db
    .select({
      nicheId: schema.seasonWeights.nicheId,
      month: schema.seasonWeights.month,
      multiplier: schema.seasonWeights.multiplier,
    })
    .from(schema.seasonWeights);
  const seForVerify = await db
    .select({
      boostedNicheIds: schema.seasonEvents.boostedNicheIds,
      startDate: schema.seasonEvents.startDate,
      endDate: schema.seasonEvents.endDate,
      multiplier: schema.seasonEvents.multiplier,
    })
    .from(schema.seasonEvents);
  const w = computeSeasonalWeight(
    swForVerify,
    seForVerify,
    "charter_fishing",
    verifyDate,
  );
  if (w !== 1.5) {
    throw new Error(
      `Commit 1.10 acceptance FAILED: getSeasonalWeight('charter_fishing', ` +
        `2026-06-15) = ${w}, expected 1.5. Seed data or resolver is wrong.`,
    );
  }
  // eslint-disable-next-line no-console
  console.log(
    `  ✓ acceptance: getSeasonalWeight('charter_fishing', 2026-06-15) = ${w}`,
  );

  // eslint-disable-next-line no-console
  console.log("\nSeed complete. Re-running this script is a no-op (idempotent).");
  // Hard exit so any background HTTP client handles from @neondatabase/serverless
  // don't keep the Node event loop alive past the script's logical end.
  process.exit(0);
}

await main();
