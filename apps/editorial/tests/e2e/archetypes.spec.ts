// Archetype routing smoke test (ADR-001 host routing + ADR-032 archetype
// theming; Phase-2 quality-gate Box 8).
//
// One test per project: hit `/` on the archetype's home domain, confirm
// proxy.ts resolved the host and the rendered shell carries the right
// `data-archetype` + per-site header. This is the visual half of
// "Editorial app deployed at all 8 domains via proxy.ts" — three of the
// eight stand in for the matrix (one per archetype).

import { expect, test } from "@playwright/test";

import { fixtureFor } from "./fixtures";

test.describe.parallel("archetype routing + theme", () => {
  test("homepage renders with the correct archetype + site header", async ({ page }, testInfo) => {
    const fx = fixtureFor(testInfo.project.name);

    const response = await page.goto("/");
    expect(response?.status(), "homepage should respond 200").toBe(200);

    // ADR-032: the archetype class + data-attribute live on the root layout
    // wrapper. Either selector works — assert via data-attribute for clarity.
    const root = page.locator(`[data-archetype="${fx.archetype}"]`);
    await expect(root, "data-archetype attribute should match the live site's row").toBeVisible();

    // Per-site title — the proxy resolved this domain to the right site row
    // (e.g. `Best Pensacola` not the network-default `Best Emerald Coast`).
    await expect(page.locator("h1")).toContainText(fx.expectedHeader);
  });

  test("RateLimit-* headers expose the publicPages limiter state (ADR-017 + 2.11.3)", async ({
    page,
    request,
  }, testInfo) => {
    // Use the Playwright APIRequestContext (not the rendered page) so we get
    // the raw response headers — `page.goto` exposes only a subset.
    const response = await request.get(testInfo.project.use.baseURL ?? "/");
    expect(response.status()).toBe(200);

    // 2.11.3 attached the IETF RateLimit-* header set to every response from
    // proxy.ts when Upstash is configured. The values aren't asserted to
    // exact integers (other clients share the same IP bucket) — just that
    // the header set is present and the limit is the ADR-017 publicPages
    // value, 1000/min.
    //
    // When Upstash is NOT configured (e.g. a preview deploy without the env
    // var), rateLimitHeaders() returns {} and the test is silently skipped
    // — that's the documented fail-open behavior, not a real failure.
    const limit = response.headers()["ratelimit-limit"];
    test.skip(!limit, "Upstash unconfigured on this deploy — headers omitted (fail-open).");

    expect(limit, "RateLimit-Limit should equal ADR-017 publicPages: 1000/min").toBe("1000");
    expect(response.headers()["ratelimit-remaining"]).toBeDefined();
    expect(response.headers()["ratelimit-reset"]).toBeDefined();
    void page;
  });

  test("unknown host returns 404, not a guessed-site render (ADR-001 contract)", async ({
    request,
  }, testInfo) => {
    // proxy.ts rewrites unmapped hosts to `/__unknown_host__` → notFound(),
    // never a guessed site. The Host header is overridden via fetch options;
    // the same Vercel deployment serves both the valid and the synthetic host.
    const base = new URL(testInfo.project.use.baseURL ?? "https://bestpensacola.com");
    const response = await request.get(base.toString(), {
      headers: { Host: "definitely-not-mapped.invalid.example" },
      failOnStatusCode: false,
    });
    expect(response.status(), "unmapped host should 404, never 200").toBe(404);
  });
});
