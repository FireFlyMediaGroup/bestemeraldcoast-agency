// Thin re-export shim — the real implementation lives in @bec/rate-limit
// (Commit 2.11 / ADR-017). Kept as a local module so callers in this app
// don't need to rewrite their imports.
//
// Behavior is identical to the prior inline implementation: same six
// limiter names, same fail-open semantics, same `tooManyRequests` shape.
// The shared package adds four more limiter names (publicPages,
// newsletterSignup, contactForm, outreachRedirect) that ops-console
// doesn't use yet; importing only the two it needs is a no-op cost.

export {
  checkRateLimit,
  tooManyRequests,
  type LimiterName,
  type RateLimitResult,
} from "@bec/rate-limit";
