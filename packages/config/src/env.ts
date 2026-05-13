// Per-environment configuration (ADR-038).
//
// `parseEnv()` takes a raw env (defaults to `process.env`), determines the
// current environment from VERCEL_ENV / NODE_ENV, applies the right Zod
// schema (production strict-merges in `productionRequired`), and returns
// the typed result. Boot-fails loud with a formatted error when a required
// var is missing.
//
// This module does NOT auto-parse at load. Call `parseEnv()` explicitly
// (see `index.ts` for the default singleton + safety rails).

import { z } from "zod";

// ───────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────

/** Env vars are always strings. Parse "true"/"false" into booleans. */
const stringBool = z.enum(["true", "false"]).transform((v) => v === "true");

export type AppEnv = "development" | "preview" | "production";

/** Resolve the current environment from VERCEL_ENV → NODE_ENV. */
export function resolveAppEnv(raw: NodeJS.ProcessEnv = process.env): AppEnv {
  const ve = raw.VERCEL_ENV;
  if (ve === "production" || ve === "preview" || ve === "development") return ve;
  return raw.NODE_ENV === "production" ? "production" : "development";
}

// ───────────────────────────────────────────────────────────────────────
// Server-side schema (everything readable from server code)
// ───────────────────────────────────────────────────────────────────────
//
// Most vars are optional in dev/preview. `productionRequired` below
// upgrades the critical ones to required when the env is "production".

const serverSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),

  // Database — Neon Postgres (ADR-002).
  DATABASE_URL: z.string().url(),
  DATABASE_URL_UNPOOLED: z.string().url().optional(),

  // ADR-038 safety rails.
  PROD_DB_ALLOWED: stringBool.optional(),
  EMAIL_REAL_SEND_ENABLED: stringBool.optional(),

  // Internal API auth (ADR-003).
  AGENT_API_KEY: z.string().min(1).optional(),

  // Operator auth — NextAuth (Phase 1).
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),

  // Anthropic — agent runtime (ADR-004, ADR-018).
  ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-").optional(),

  // Email — Resend + AWS SES (ADR-013).
  RESEND_API_KEY: z.string().startsWith("re_").optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),

  // Object storage — Vercel Blob + Backblaze B2 (ADR-005).
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  B2_KEY_ID: z.string().optional(),
  B2_APPLICATION_KEY: z.string().optional(),
  B2_BUCKET: z.string().optional(),
  B2_ENDPOINT: z.string().url().optional(),

  // Observability — Sentry + Axiom (ADR-012).
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  AXIOM_TOKEN: z.string().optional(),
  AXIOM_DATASET: z.string().optional(),

  // Analytics — PostHog server-side (ADR-011).
  POSTHOG_API_KEY: z.string().optional(),

  // Rate limiting + bot defense (ADR-017).
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),

  // Vercel cron (Phase 6) — signed by header.
  CRON_SECRET: z.string().min(16).optional(),

  // Scout — Google Maps Places (Phase 1).
  GOOGLE_MAPS_API_KEY: z.string().optional(),
});

// ───────────────────────────────────────────────────────────────────────
// Client-side schema (NEXT_PUBLIC_* only — bundled into the browser)
// ───────────────────────────────────────────────────────────────────────

const clientSchema = z.object({
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
});

// ───────────────────────────────────────────────────────────────────────
// Production strictness — these vars become required when env=production
// ───────────────────────────────────────────────────────────────────────

const productionRequired = z.object({
  DATABASE_URL: z.string().url(),
  AGENT_API_KEY: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-"),
  RESEND_API_KEY: z.string().startsWith("re_"),
  SENTRY_DSN: z.string().url(),
  CRON_SECRET: z.string().min(16),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

export class EnvValidationError extends Error {
  constructor(
    public readonly env: AppEnv,
    public readonly fieldErrors: Record<string, string[] | undefined>,
  ) {
    const lines = Object.entries(fieldErrors)
      .filter(([, v]) => v && v.length > 0)
      .map(([k, v]) => `  • ${k}: ${v?.join(", ")}`)
      .join("\n");
    super(`Environment validation failed (env=${env}):\n${lines}`);
    this.name = "EnvValidationError";
  }
}

export interface ParseResult {
  env: AppEnv;
  server: ServerEnv;
  client: ClientEnv;
}

/**
 * In a real shell `.env`, an empty assignment (`FOO=`) produces an empty
 * string in `process.env`. Zod's `.optional()` accepts `undefined` but not
 * `""`, so we normalize before validating.
 */
function normalizeEnv(raw: NodeJS.ProcessEnv): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(raw)) {
    out[k] = v === "" ? undefined : v;
  }
  return out;
}

/**
 * Validate and return the typed env. Throws `EnvValidationError` with a
 * formatted multi-line message when validation fails.
 */
export function parseEnv(raw: NodeJS.ProcessEnv = process.env): ParseResult {
  const normalized = normalizeEnv(raw);
  const env = resolveAppEnv(normalized as NodeJS.ProcessEnv);
  const schema = env === "production" ? serverSchema.merge(productionRequired) : serverSchema;

  const serverResult = schema.safeParse(normalized);
  if (!serverResult.success) {
    throw new EnvValidationError(env, serverResult.error.flatten().fieldErrors);
  }

  // Client schema is permissive in dev/preview, strict in production.
  const clientResult = clientSchema.safeParse(normalized);
  if (!clientResult.success && env === "production") {
    throw new EnvValidationError(env, clientResult.error.flatten().fieldErrors);
  }

  return {
    env,
    server: serverResult.data,
    client: clientResult.success ? clientResult.data : ({} as ClientEnv),
  };
}
