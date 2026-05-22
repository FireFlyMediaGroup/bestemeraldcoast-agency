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
}

/**
 * Map a Playwright project name (set on `test.describe.parallel`) to its
 * expected archetype + header. Specs do `const fixture = byProject(test.info().project.name)`.
 */
export const FIXTURES: Record<string, ArchetypeFixture> = {
  magazine: { project: "magazine", archetype: "magazine", expectedHeader: "Best Pensacola" },
  "magazine-mobile": {
    project: "magazine",
    archetype: "magazine",
    expectedHeader: "Best Pensacola",
  },
  coastal: { project: "coastal", archetype: "coastal", expectedHeader: "Best Pensacola Beach" },
  premium: { project: "premium", archetype: "premium", expectedHeader: "Best South Walton" },
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
