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

// Load `.env` from the repo root BEFORE importing @bec/db's client — it
// reaches into @bec/config's validated serverEnv at module load and would
// crash with "DATABASE_URL: Required" if dotenv hasn't run first.
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..");
dotenv.config({ path: path.join(repoRoot, ".env") });

const { getDb } = await import("./client.js");

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
// Seed orchestration.
// ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
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
  // already existed). Slug is the natural key.
  const persistedSites = await db
    .select({ id: schema.sites.id, slug: schema.sites.slug, archetype: schema.sites.archetype })
    .from(schema.sites);
  const siteIdBySlug = new Map(persistedSites.map((row) => [row.slug, row]));

  let categoryRowCount = 0;
  const categoryRows: Array<{
    siteId: string;
    slug: string;
    name: string;
    description: string;
    sortOrder: number;
  }> = [];
  for (const site of persistedSites) {
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
    `  ✓ categories: ${categoryRowCount} rows attempted across ${persistedSites.length} sites`,
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

  // eslint-disable-next-line no-console
  console.log("\nSeed complete. Re-running this script is a no-op (idempotent).");
  // Hard exit so any background HTTP client handles from @neondatabase/serverless
  // don't keep the Node event loop alive past the script's logical end.
  process.exit(0);
}

await main();
