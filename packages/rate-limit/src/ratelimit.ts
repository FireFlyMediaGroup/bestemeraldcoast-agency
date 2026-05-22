// Shared rate limiter (ADR-017). Upstash Redis + @upstash/ratelimit.
//
// Six named limiters per ADR-017's surface table:
//   - newsletterSignup: 3 / 1h  (per IP)        — public signup forms
//   - contactForm:      5 / 24h (per IP)        — contact forms
//   - magicLink:        5 / 15m (per email)     — login magic link
//   - outreachRedirect: 100 / 1m (per IP)       — outreach tracking redirects
//   - agentApi:         60 / 1m (per API key)   — agent endpoints
//   - publicPages:      1000 / 1m (per IP)      — global DDoS guard
//
// Build-inert: @bec/config is dynamically imported so this module doesn't
// trigger @bec/config's eager parseEnv() at `next build` (same lesson as
// ops-console's auth.ts).
//
// Graceful no-op when Upstash env is absent: mirrors how the @bec/logger
// Sentry/Axiom transports no-op without their DSN/token. Local dev and the
// CI ephemeral env have no Upstash creds; the limiter then allows all
// requests rather than hard-failing. Production MUST set
// UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.

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

export type LimiterName =
  | "newsletterSignup"
  | "contactForm"
  | "magicLink"
  | "outreachRedirect"
  | "agentApi"
  | "publicPages";

type LimiterMap = Record<LimiterName, Ratelimit>;

let cached: LimiterMap | undefined;
let configured: boolean | undefined;

async function getLimiters(): Promise<LimiterMap | undefined> {
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
    newsletterSignup: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 h"),
      prefix: "rl:newsletter",
      analytics: false,
    }),
    contactForm: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "24 h"),
      prefix: "rl:contact",
      analytics: false,
    }),
    magicLink: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "rl:magiclink",
      analytics: false,
    }),
    outreachRedirect: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      prefix: "rl:outreach",
      analytics: false,
    }),
    agentApi: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      prefix: "rl:agent",
      analytics: false,
    }),
    publicPages: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000, "1 m"),
      prefix: "rl:public",
      analytics: false,
    }),
  };
  configured = true;
  return cached;
}

/**
 * Check a rate limit. `identifier` is the key the window is scoped to —
 * an API key for agentApi, an email for magicLink, an IP for the rest.
 *
 * Fail-open by design — returns `success: true` (allow) both when Upstash
 * is unconfigured AND when the limiter call itself errors (Redis slow /
 * unavailable / transient). Anti-abuse must never take down a legitimate
 * request because the limiter's backing store hiccuped; an unprotected
 * window during an Upstash outage is the lesser evil. Errors are logged
 * so outages are visible.
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

/**
 * Build the standard `RateLimit-*` response header set for a given check
 * result. Spec: IETF draft-ietf-httpapi-ratelimit-headers — `RateLimit-Limit`,
 * `RateLimit-Remaining`, `RateLimit-Reset` (seconds-until-reset, not unix-ms).
 *
 * Returns an empty object when the result is the ALLOW sentinel
 * (`limit === 0`) — i.e. when no limiter was configured at all. Emitting
 * `RateLimit-Limit: 0 / Remaining: 0` for the no-limiter case is misleading
 * (clients would think they're already rate-limited); silence is correct.
 *
 * Caller attaches these to whatever response shape the surface uses:
 *   - Editorial `proxy.ts` allow-path: `NextResponse.next({ request: { headers } })`
 *     plus `for (const [k, v] of Object.entries(rateLimitHeaders(r))) res.headers.set(k, v)`.
 *   - 429 path: `tooManyRequests(r)` packages them into a JSON 429 (below).
 */
export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  // The ALLOW sentinel has limit=0 — no limiter configured. Emit nothing.
  if (r.limit === 0) return {};
  const retryAfter = Math.max(1, Math.ceil((r.reset - Date.now()) / 1000));
  return {
    "RateLimit-Limit": String(r.limit),
    "RateLimit-Remaining": String(r.remaining),
    "RateLimit-Reset": String(retryAfter),
  };
}

/** Build a standard 429 with rate-limit + Retry-After headers. */
export function tooManyRequests(r: RateLimitResult): Response {
  const retryAfter = Math.max(1, Math.ceil((r.reset - Date.now()) / 1000));
  return Response.json(
    { error: "rate_limited" },
    {
      status: 429,
      headers: {
        ...rateLimitHeaders(r),
        // RFC 6585: Retry-After is the canonical 429 header.
        "Retry-After": String(retryAfter),
      },
    },
  );
}

/** Test-only: clear the module-level limiter cache so a new env can take effect. */
export function __resetLimiterCacheForTesting(): void {
  cached = undefined;
  configured = undefined;
}
