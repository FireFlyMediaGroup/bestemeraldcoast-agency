// Shell-page SEO assertions (ADR-009 structured data + OG + canonical;
// Phase-2 quality-gate Box 7 — "Sitemap, robots, OG, JSON-LD all validate
// via Google Rich Results Test").
//
// The article-page equivalent of these assertions is covered by
// `article.spec.ts` (data-gated). This file covers the shell pages
// (homepage / future legal / category index) — the surface that ships in
// Commit 2.11.6.

import { expect, test } from "@playwright/test";

import { fixtureFor } from "./fixtures";

/**
 * Detect whether 2.11.6 has deployed to the target environment by probing
 * for a marker the commit unambiguously adds (the shell-page `<link
 * rel="canonical">` tag inside (site)/layout.tsx's `generateMetadata`).
 * Mirrors the ratelimit-headers test's fail-open posture: if the upstream
 * deploy hasn't caught up yet, the whole suite skips gracefully instead of
 * failing red on what is a deploy-timing artifact.
 */
async function shellSeoDeployed(page: import("@playwright/test").Page): Promise<boolean> {
  await page.goto("/");
  return (await page.locator('link[rel="canonical"]').count()) > 0;
}

test.describe.parallel("shell-page SEO surface", () => {
  test("homepage emits WebSite + Organization JSON-LD", async ({ page }, testInfo) => {
    test.skip(
      !(await shellSeoDeployed(page)),
      "2.11.6 not deployed to this target yet — shell-page SEO surface unavailable.",
    );

    // Two <script type="application/ld+json"> on every shell page (Org +
    // WebSite). Article pages add Article + Breadcrumb on top, so the
    // article-page count is ≥4 — this test scopes to the homepage to avoid
    // the data-gated path.
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    expect(count, "homepage should emit at least Org + WebSite JSON-LD").toBeGreaterThanOrEqual(2);

    const contents = await scripts.allTextContents();
    const parsed = contents.map((s) => JSON.parse(s) as Record<string, unknown>);

    // Network-level Organization — identical across all 8 domains.
    const org = parsed.find((p) => p["@type"] === "Organization");
    expect(org, "Organization schema should be present").toBeDefined();
    expect(org!.name).toBe("Best Emerald Coast");

    // Per-domain WebSite — alternateName / url should match this domain.
    const ws = parsed.find((p) => p["@type"] === "WebSite");
    expect(ws, "WebSite schema should be present").toBeDefined();
    const fx = fixtureFor(testInfo.project.name);
    expect(ws!.name).toContain(fx.expectedHeader);
    expect((ws!.url as string).startsWith("https://")).toBe(true);
  });

  test("homepage emits canonical + og:* meta tags", async ({ page }) => {
    test.skip(
      !(await shellSeoDeployed(page)),
      "2.11.6 not deployed to this target yet — shell-page SEO surface unavailable.",
    );

    // Next 16 may normalize the canonical href with or without a trailing
    // slash — accept both forms; the absolute origin is what matters.
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", /^https:\/\/[^/]+\/?$/);

    // og:type=website for shell pages (article pages override to og:type=article).
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");

    // og:url should be the same absolute URL as the canonical.
    const canonicalHref = await canonical.getAttribute("href");
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      canonicalHref!,
    );

    // og:image points to the per-domain opengraph-image route (2.11.6).
    // Next 16 emits hashed URLs (`/opengraph-image-{hash}?{contentDigest}`)
    // for cache-busting — match the path prefix, not exact equality.
    const ogImage = page.locator('meta[property="og:image"]');
    const ogImageHref = await ogImage.getAttribute("content");
    expect(ogImageHref).toMatch(/\/opengraph-image(-[a-z0-9]+(\?.*)?)?$/);
  });

  test("opengraph-image responds 200 with image content (per-domain Satori render)", async ({
    page,
    request,
  }) => {
    test.skip(
      !(await shellSeoDeployed(page)),
      "2.11.6 not deployed to this target yet — root opengraph-image route unavailable.",
    );

    // Next 16 emits the OG image at a hashed URL for cache-busting
    // (`/opengraph-image-{hash}?{contentDigest}`); the og:image meta tag
    // carries the canonical URL clients actually request. Read it from
    // the page rather than assuming a path shape.
    const ogImageUrl = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(ogImageUrl, "og:image meta should resolve to the OG image route").toBeTruthy();

    const response = await request.get(ogImageUrl!);
    expect(response.status(), "OG image should respond 200").toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^image\//);
    // Satori renders to PNG (1200×630 per ADR-009).
    const body = await response.body();
    expect(body.length, "OG image should have non-zero bytes").toBeGreaterThan(1000);
  });
});
