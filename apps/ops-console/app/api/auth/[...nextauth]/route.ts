// Auth.js v5 route handlers for the entire /api/auth/* surface (sign-in,
// callback, magic-link verification, sign-out, session, csrf, providers).
//
// API-control posture for this route, per the `apps/**/api/**` coding
// guideline (rate-limit ADR-017 / Zod / logger ADR-012):
//
// - ✅ Error capture (ADR-012): every request is wrapped so a throw is
//   logged via @bec/logger (Sentry + Axiom) before it propagates. The
//   logger is dynamically imported inside the wrapper so this module stays
//   build-time inert (@bec/logger → @bec/config eager parseEnv; same reason
//   auth.ts defers its imports).
// - ✅ Rate-limit (ADR-017): the POST surface (sign-in / magic-link request)
//   is rate-limited via the shared @upstash limiter ("magicLink": 5 / 15 min
//   per ADR-017's table). Keyed by client IP — NextAuth's catch-all owns the
//   request body, so per-email keying would require consuming the stream
//   NextAuth needs; IP is the faithful, framework-safe enforcement point for
//   this surface. GET (callback/session/csrf/providers) is not abuse-bearing
//   and is not limited. This closes the docs/dev/adr-log.md 2026-05-16
//   ADR-017 scoped exemption (lapsed by Commit 1.5 as that entry specified).
// - Per-route Zod remains inapplicable to NextAuth's framework-owned
//   catch-all (one schema can't span signin/callback/csrf/session/providers
//   without breaking the framework); the real authorization gate is the
//   single-email allow-list in auth.ts's signIn callback.

import { handlers } from "@/auth";

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return (xff.split(",")[0] ?? xff).trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// Generic over the handler's own signature so the wrapper inherits NextAuth's
// exact param type (NextRequest) and return type rather than imposing a
// narrower `Request` that wouldn't be assignable.
function withErrorCapture<A extends unknown[], R>(
  fn: (...args: A) => R | Promise<R>,
  method: string,
): (...args: A) => Promise<R> {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (err) {
      // Dynamic import keeps this module build-inert (see header comment).
      const { logger } = await import("@bec/logger");
      logger.error(
        { err, route: "/api/auth", method },
        "ops-console auth route handler threw",
      );
      throw err;
    }
  };
}

// Wrap POST with the ADR-017 magic-link limiter before error capture. The
// limiter no-ops when Upstash isn't configured (dev/CI) — see lib/ratelimit.
function withMagicLinkRateLimit<A extends unknown[], R extends Response>(
  fn: (...args: A) => Promise<R>,
): (...args: A) => Promise<R | Response> {
  return async (...args: A) => {
    const req = args[0] as Request;
    const { checkRateLimit, tooManyRequests } = await import("@/lib/ratelimit");
    const rl = await checkRateLimit("magicLink", `ip:${clientIp(req)}`);
    if (!rl.success) return tooManyRequests(rl);
    return fn(...args);
  };
}

export const GET = withErrorCapture(handlers.GET, "GET");
export const POST = withErrorCapture(
  withMagicLinkRateLimit(handlers.POST),
  "POST",
);
