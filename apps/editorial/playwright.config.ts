// Playwright config for @bec/editorial (ADR-016 E2E + visual-regression
// surface; Phase 2 quality-gate Box 8).
//
// Targets the live editorial deploys by default (PROD_BASE_URL maps each
// archetype to the live domain in `tests/e2e/fixtures.ts`). The Phase-2
// gate's "Playwright tests pass" line is satisfied when these run green
// against the deployed editorial. CI does NOT yet run this on every PR —
// burning function invocations on every push is wasteful when the unit
// surface already gates merge. Operator triggers it on-demand via
// `pnpm --filter @bec/editorial test:e2e`.
//
// Override `PLAYWRIGHT_BASE_URL` to point at a Vercel preview deployment
// or a local `next dev` when iterating on the archetype theming itself
// (host-header injection happens per-project via `extraHTTPHeaders`).

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // Visual-regression baselines live next to the specs; ADR-016 calls for
  // archetype-homepage screenshots, but the first run needs a baseline.
  // We commit them under tests/e2e/__screenshots__/ — Playwright's default.
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  // Fail the run on accidental .only — gate runs must be exhaustive.
  forbidOnly: !!process.env.CI,
  // E2E is intentionally serial-friendly: archetypes don't interact, but
  // some tests share an Upstash rate-limit bucket (same client IP).
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  // No webServer — we target live URLs (or a per-archetype baseURL passed
  // via env). Spinning `next dev` locally would still need a DB connection
  // for the proxy.ts host-resolve, which isn't worth wiring for a sanity
  // surface that runs ~weekly.
  use: {
    // Each project below overrides this with its archetype's live host.
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    ignoreHTTPSErrors: false,
    // axe-core a11y assertions in a11y.spec.ts run with this user agent —
    // they look like a normal browser, not a synthetic bot, so the proxy's
    // limiter buckets them per-IP like any visitor.
    userAgent: "playwright-bec-editorial-e2e",
  },
  projects: [
    {
      name: "magazine",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.PLAYWRIGHT_BASE_URL_MAGAZINE ?? "https://bestpensacola.com",
      },
    },
    {
      name: "coastal",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.PLAYWRIGHT_BASE_URL_COASTAL ?? "https://bestpensacolabeach.com",
      },
    },
    {
      name: "premium",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.PLAYWRIGHT_BASE_URL_PREMIUM ?? "https://bestsouthwalton.com",
      },
    },
    // Mobile sanity — single archetype × the iPhone 14 device matrix.
    // ADR-006 / ADR-024 / ADR-029 mandate iPhone Safari is the primary
    // editorial reading surface; smoke against it on every gate run.
    {
      name: "magazine-mobile",
      use: {
        ...devices["iPhone 14"],
        baseURL: process.env.PLAYWRIGHT_BASE_URL_MAGAZINE ?? "https://bestpensacola.com",
      },
    },
  ],
});
