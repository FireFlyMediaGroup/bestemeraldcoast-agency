// Shared rate limiter (ADR-017). Upstash Redis + @upstash/ratelimit.
//
// Two named limiters per ADR-017's table:
//   - agentApi: 60 requests / 1 min, keyed by API key  (agent endpoints)
//   - magicLink: 5 requests / 15 min, keyed by client   (login magic link)
//
// Build-inert: @bec/config is dynamically imported so this module doesn't
// trigger @bec/config's eager parseEnv() at `next build` (same lesson as
// auth.ts / the auth route).
//
// Graceful no-op when Upstash env is absent: mirrors how the @bec/logger
// Sentry/Axiom transports no-op without their DSN/token. Local dev and the
// CI ephemeral env have no Upstash creds; the limiter then allows all
// requests rather than hard-failing. Production MUST set
// UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (operator pre-flight) —
// without them anti-abuse is off, which is acceptable for an internal,
// AGENT_API_KEY-gated surface but not for public ones (Phase 3+).

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix ms when the window resets. */
  reset: number;
}

const ALLOW: RateLimitResult = { success: true, limit: 0, remaining: 0, reset: 0 };

type LimiterName = "agentApi" | "magicLink";

let cached: { agentApi: Ratelimit; magicLink: Ratelimit } | undefined;
let configured: boolean | undefined;

async function getLimiters(): Promise<typeof cached> {
  if (configured === false) return undefined;
  if (cached) return cached;

  const { serverEnv } = await import("@bec/config");
  const url = serverEnv.UPSTASH_REDIS_REST_URL;
  const token = serverEnv.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    configured = false;
    return undefined;
  }

  const redis = new Redis({ url, token });
  cached = {
    // ADR-017: API (agent endpoints) — 60 per key / 1 min.
    agentApi: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      prefix: "rl:agent",
      analytics: false,
    }),
    // ADR-017: Login (magic link) — 5 per client / 15 min.
    magicLink: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "rl:magiclink",
      analytics: false,
    }),
  };
  configured = true;
  return cached;
}

/**
 * Check a rate limit. `identifier` is the key the window is scoped to
 * (an API key for agentApi, a client IP/email for magicLink).
 *
 * Fail-open by design — returns `success: true` (allow) both when Upstash
 * is unconfigured AND when the limiter call itself errors (Redis slow /
 * unavailable / transient). Anti-abuse must never take down a legitimate
 * agent because the limiter's backing store hiccuped; an unprotected
 * window during an Upstash outage is the lesser evil for these
 * internal/keyed surfaces. The error is logged so outages are visible.
 */
export async function checkRateLimit(
  name: LimiterName,
  identifier: string,
): Promise<RateLimitResult> {
  const limiters = await getLimiters();
  if (!limiters) return ALLOW;
  try {
    const { success, limit, remaining, reset } = await limiters[name].limit(identifier);
    return { success, limit, remaining, reset };
  } catch (err) {
    const { logger } = await import("@bec/logger");
    logger.error({ err, limiter: name }, "rate limiter unavailable — failing open");
    return ALLOW;
  }
}

/** Build a standard 429 with rate-limit headers. */
export function tooManyRequests(r: RateLimitResult): Response {
  // Compute the delta once so the two headers are always consistent.
  const retryAfter = Math.max(1, Math.ceil((r.reset - Date.now()) / 1000));
  return Response.json(
    { error: "rate_limited" },
    {
      status: 429,
      headers: {
        "RateLimit-Limit": String(r.limit),
        "RateLimit-Remaining": String(r.remaining),
        "RateLimit-Reset": String(retryAfter),
        "Retry-After": String(retryAfter),
      },
    },
  );
}
