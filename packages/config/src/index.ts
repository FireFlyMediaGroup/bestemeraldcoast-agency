// Public entry point. Triggers env validation on first import.
//
// Consumers:
//   import { serverEnv, clientEnv, currentEnv } from "@bec/config";
//   import { assertProdDbAccessible, shouldSendRealEmail } from "@bec/config";

import { parseEnv } from "./env.js";

const parsed = parseEnv();

export const serverEnv = parsed.server;
export const clientEnv = parsed.client;
export const currentEnv = parsed.env;

export type { AppEnv, ServerEnv, ClientEnv, ParseResult } from "./env.js";
export { parseEnv, resolveAppEnv, EnvValidationError } from "./env.js";

// ───────────────────────────────────────────────────────────────────────
// ADR-038 safety rails
// ───────────────────────────────────────────────────────────────────────

/**
 * Guard prod-DB connections from anywhere outside production.
 *
 * Use at every prod-DB connection point. Throws unless we are running in
 * production OR the operator has explicitly opted in with
 * PROD_DB_ALLOWED=true (e.g., a one-off local migration).
 */
export function assertProdDbAccessible(): void {
  if (parsed.env === "production") return;
  if (parsed.server.PROD_DB_ALLOWED === true) return;
  throw new Error(
    "Refusing to connect to production database from a non-production env. " +
      "Set PROD_DB_ALLOWED=true to override (ADR-038).",
  );
}

/**
 * Returns true when the calling code should send real email.
 *
 * In production this is always true. Outside production, the operator
 * must explicitly enable real sending via EMAIL_REAL_SEND_ENABLED=true
 * — otherwise email goes to Mailhog/Resend test mode.
 */
export function shouldSendRealEmail(): boolean {
  if (parsed.env === "production") return true;
  return parsed.server.EMAIL_REAL_SEND_ENABLED === true;
}
