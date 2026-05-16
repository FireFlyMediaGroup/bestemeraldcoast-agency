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
// - ⤵ Rate-limit (ADR-017) + per-route Zod: scoped exemption recorded in
//   `docs/dev/adr-log.md` (2026-05-16). The Upstash limiter ADR-017 mandates
//   does not exist until Commit 1.5 ("Internal agent API … Rate-limit per
//   ADR-017"), which builds the shared limiter applied uniformly across the
//   agent API and this route. Per-route Zod is inapplicable to NextAuth's
//   framework-owned catch-all (one schema can't span signin/callback/csrf/
//   session/providers without breaking the framework); the real
//   authorization gate is the single-email allow-list in auth.ts's signIn
//   callback. Not dismissed — escalated via the adr-log per CLAUDE.md.

import { handlers } from "@/auth";

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

export const GET = withErrorCapture(handlers.GET, "GET");
export const POST = withErrorCapture(handlers.POST, "POST");
