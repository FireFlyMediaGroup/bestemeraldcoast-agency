// @bec/rate-limit — ADR-017 anti-abuse primitives.
//
// Public API:
//   import { checkRateLimit, tooManyRequests } from "@bec/rate-limit";
//   import { verifyTurnstile } from "@bec/rate-limit";
//   import { validateEmail } from "@bec/rate-limit";
//
// All three modules are build-inert (dynamic @bec/config import) and
// fail-open on missing creds, mirroring the @bec/logger transport pattern —
// local dev + CI ephemeral envs have no Upstash/Turnstile credentials, and
// hard-failing there would block every PR.

export {
  checkRateLimit,
  rateLimitHeaders,
  tooManyRequests,
  __resetLimiterCacheForTesting,
  type LimiterName,
  type RateLimitResult,
} from "./ratelimit.js";

export { verifyTurnstile, type TurnstileResult } from "./turnstile.js";

export {
  validateEmail,
  __resetDisposableDomainCacheForTesting,
  type EmailReason,
  type EmailValidationResult,
} from "./email.js";
