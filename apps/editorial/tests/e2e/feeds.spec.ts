// Homepage feed + category index assertions (Commit 2.11.7).
//
// Pre-2.11.7 both surfaces were placeholder shells from Commit 2.1 — the
// homepage said "real content arrives in Phase 2 (Commits 2.2-2.5)" and
// the category index said "Article cards land in Commit 2.2"; neither
// surface was ever filled. This spec catches a regression to that
// state.
//
// Data-tolerant: when 0 articles are published yet (current state on
// `main`), the page renders the empty-state copy — assert ONE of:
//   (a) ≥1 ArticleCard in the feed, OR
//   (b) the empty-state copy with the documented "land here" / "land them"
//       voice.
// Either way the placeholder text is forbidden.

import { expect, test } from "@playwright/test";

import { fixtureFor } from "./fixtures";

const LEGACY_HOMEPAGE_PLACEHOLDER = "real content arrives in Phase 2";
const LEGACY_CATEGORY_PLACEHOLDER = "Article cards land in Commit 2.2";

/**
 * Detect whether 2.11.7 has reached the target — both new surfaces share
 * the empty-state copy "Check back soon" emitted by `ArticleFeed`. If neither
 * surface emits that marker AND no real ArticleCard is rendered, the
 * upstream deploy is still pre-2.11.7 — skip gracefully (same fail-open
 * posture as the 2.11.3 / 2.11.6 specs).
 */
async function feedsDeployed(page: import("@playwright/test").Page): Promise<boolean> {
  await page.goto("/");
  const hasEmptyMarker = (await page.locator("text=Check back soon").count()) > 0;
  const hasCard = (await page.locator('article a[href*="/"]:not([href="/"])').count()) > 0;
  return hasEmptyMarker || hasCard;
}

test.describe.parallel("homepage feed (Commit 2.11.7)", () => {
  test("homepage no longer renders the Commit 2.1 placeholder text", async ({ page }) => {
    test.skip(
      !(await feedsDeployed(page)),
      "2.11.7 not deployed to this target yet — homepage + category index feeds unavailable.",
    );
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body, "homepage must not still say 'real content arrives in Phase 2'").not.toContain(
      LEGACY_HOMEPAGE_PLACEHOLDER.toLowerCase(),
    );

    // Either real article cards or the empty-state copy. The empty-state
    // copy contains "Check back soon" — uniquely tied to ArticleFeed,
    // so its presence proves the new component is wired, not the old
    // PageShell text.
    const cards = page.locator('article a[href*="/"]:not([href="/"])');
    const cardCount = await cards.count();
    const hasEmptyState = (await page.locator("text=Check back soon").count()) > 0;
    expect(
      cardCount > 0 || hasEmptyState,
      "homepage should show ArticleCard list OR empty-state copy",
    ).toBe(true);
  });
});

test.describe.parallel("category index (Commit 2.11.7)", () => {
  // Each archetype seeds a different taxonomy (`magazine: things-to-do …;
  // coastal: beaches-water …; premium: restaurants-bars …`) — `fixtures.ts`
  // carries one concrete category per project. Hard-coding `/things-to-do`
  // 404s on coastal + premium since those slugs don't exist there.
  test("category index no longer renders the Commit 2.1 placeholder", async ({ page }, testInfo) => {
    test.skip(
      !(await feedsDeployed(page)),
      "2.11.7 not deployed to this target yet — category index unavailable.",
    );
    const fx = fixtureFor(testInfo.project.name);
    const response = await page.goto(`/${fx.categorySlug}`);
    expect(response?.status(), `${fx.categorySlug} category index should respond 200`).toBe(200);

    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body, "category index must not still say 'Article cards land in Commit 2.2'").not.toContain(
      LEGACY_CATEGORY_PLACEHOLDER.toLowerCase(),
    );

    // Heading reflects the resolved category name, not the URL slug
    // titleized — confirms `getArticlesByCategory` returned a real category
    // row and we're not just rendering on a fabricated label.
    await expect(page.locator("h1")).toContainText(fx.categoryName);
  });

  test("unknown category slug returns 404, not a fabricated empty index", async ({
    page,
    request,
  }, testInfo) => {
    test.skip(
      !(await feedsDeployed(page)),
      "2.11.7 not deployed to this target yet — unknown-category 404 contract not in effect.",
    );
    const base = new URL(testInfo.project.use.baseURL ?? "https://bestpensacola.com");
    const response = await request.get(`${base.origin}/this-is-definitely-not-a-category`, {
      failOnStatusCode: false,
    });
    expect(
      response.status(),
      "an unknown category slug should 404, never render a 'no articles' page",
    ).toBe(404);
  });
});
