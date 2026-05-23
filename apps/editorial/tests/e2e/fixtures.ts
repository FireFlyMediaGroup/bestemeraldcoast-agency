// Shared E2E fixtures: domain → archetype → expected-header map.
//
// Source of truth for the Playwright project matrix in `playwright.config.ts`.
// Spec files reference these to assert archetype routing + per-site naming
// without hard-coding URLs.

export interface ArchetypeFixture {
  /** Project name in playwright.config.ts. */
  project: "magazine" | "coastal" | "premium";
  /** The expected `data-archetype="..."` attribute on the rendered root. */
  archetype: "magazine" | "coastal" | "premium";
  /** Substring expected in the rendered <h1>. */
  expectedHeader: string;
  /**
   * One category slug known to exist on this archetype's site. Each
   * archetype seeds a different taxonomy (magazine uses things-to-do +
   * local-business; coastal uses beaches-water + charters-boats; premium
   * uses restaurants-bars + towns-of-30a). The category-index spec uses
   * this to navigate to a real URL — hard-coding `/things-to-do` would
   * 404 on coastal + premium.
   */
  categorySlug: string;
  /** Resolved category H1 — matches the `categories.name` row. */
  categoryName: string;
}

/**
 * Map a Playwright project name (set on `test.describe.parallel`) to its
 * expected archetype + header. Spec files reference these to keep URLs +
 * archetype-specific expectations consistent.
 */
export const FIXTURES: Record<string, ArchetypeFixture> = {
  magazine: {
    project: "magazine",
    archetype: "magazine",
    expectedHeader: "Best Pensacola",
    categorySlug: "things-to-do",
    categoryName: "Things to Do",
  },
  "magazine-mobile": {
    project: "magazine",
    archetype: "magazine",
    expectedHeader: "Best Pensacola",
    categorySlug: "things-to-do",
    categoryName: "Things to Do",
  },
  coastal: {
    project: "coastal",
    archetype: "coastal",
    expectedHeader: "Best Pensacola Beach",
    categorySlug: "beaches-water",
    categoryName: "Beaches & Water",
  },
  premium: {
    project: "premium",
    archetype: "premium",
    expectedHeader: "Best South Walton",
    categorySlug: "restaurants-bars",
    categoryName: "Restaurants & Bars",
  },
};

export function fixtureFor(projectName: string): ArchetypeFixture {
  const f = FIXTURES[projectName];
  if (!f) {
    throw new Error(
      `Unknown playwright project "${projectName}". ` +
        `Update tests/e2e/fixtures.ts FIXTURES map.`,
    );
  }
  return f;
}
