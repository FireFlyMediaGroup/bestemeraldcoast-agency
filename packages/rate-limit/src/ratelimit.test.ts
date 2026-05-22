import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetLimiterCacheForTesting,
  checkRateLimit,
  tooManyRequests,
  type RateLimitResult,
} from "./ratelimit.js";

// @bec/config eagerly parses env at import time; mock it so we can flip
// UPSTASH_* values per-test without touching real env.
vi.mock("@bec/config", () => ({
  serverEnv: {
    UPSTASH_REDIS_REST_URL: undefined,
    UPSTASH_REDIS_REST_TOKEN: undefined,
  },
}));

// @bec/logger is only touched on the error path; provide a no-op so we
// don't pull in pino + transports for these tests.
vi.mock("@bec/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

beforeEach(() => {
  __resetLimiterCacheForTesting();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkRateLimit — fail-open when Upstash unconfigured", () => {
  it("returns success=true for every named limiter when no creds", async () => {
    const names = [
      "newsletterSignup",
      "contactForm",
      "magicLink",
      "outreachRedirect",
      "agentApi",
      "publicPages",
    ] as const;
    for (const name of names) {
      const result = await checkRateLimit(name, "test-key");
      expect(result.success).toBe(true);
    }
  });
});

describe("tooManyRequests", () => {
  it("returns a 429 with all four RateLimit-* headers and a JSON body", async () => {
    const reset = Date.now() + 60_000;
    const r: RateLimitResult = { success: false, limit: 3, remaining: 0, reset };
    const res = tooManyRequests(r);

    expect(res.status).toBe(429);
    expect(res.headers.get("RateLimit-Limit")).toBe("3");
    expect(res.headers.get("RateLimit-Remaining")).toBe("0");
    // Both Retry-After + RateLimit-Reset are the same seconds-until-reset.
    const retryAfter = Number(res.headers.get("Retry-After"));
    const rlReset = Number(res.headers.get("RateLimit-Reset"));
    expect(retryAfter).toBe(rlReset);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);

    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("rate_limited");
  });

  it("clamps Retry-After to a minimum of 1 second when the reset is in the past", () => {
    const r: RateLimitResult = { success: false, limit: 3, remaining: 0, reset: Date.now() - 5_000 };
    const res = tooManyRequests(r);
    expect(res.headers.get("Retry-After")).toBe("1");
  });
});
