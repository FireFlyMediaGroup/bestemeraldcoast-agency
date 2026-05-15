// Migration test (ADR-016 schema-migration tests slice; Phase 1 / Commit 1.3).
//
// Master plan acceptance: "Create scripts/test-migrations.ts that, in CI, runs
// every Drizzle migration forward, then rolls back, and verifies the schema
// returns to its prior state. Wire to the CI workflow."
//
// Driver choice — Pool, not the HTTP `sql` template:
//   @neondatabase/serverless 1.0.2+ restricts the `sql` tagged-template
//   function to template-literal call form only. drizzle-orm 0.39's
//   neon-http migrator (neon-http/session.ts) calls it in function-call
//   form for prepared statements, so the neon-http migrator path throws
//   "This function can now be called only as a tagged-template function".
//   The Pool-based `drizzle-orm/neon-serverless` driver uses the pg wire
//   protocol over a WebSocket and has no such restriction. We use it here
//   for the migrator + raw introspection queries (`pool.query(...)`).
//
//   Resolved (task/2026-05-15-db-pool-driver): `client.ts` now uses the
//   same Pool driver, so the whole `@bec/db` layer is consistent — this
//   script's local choice is no longer a one-off.
//
// What the script does:
//   1. Forward  — migrate(); assert canonical 23 tables + 8 enums.
//   2. Idempotency — re-run migrate(); assert unchanged.
//   3. Rollback — DROP SCHEMA public CASCADE; CREATE SCHEMA public; assert
//      empty (drizzle ships no down migrations, so the inverse is "drop all").
//
// Run with: pnpm --filter @bec/db db:test-migrations
//
// Env: DATABASE_URL required. Destructive (drops the public schema), so
// guarded by assertProdDbAccessible() (ADR-038). CI's workflow step sets
// PROD_DB_ALLOWED=true (per-PR Neon ephemeral branch — the guard's
// "don't write to prod from a dev machine" intent doesn't apply).

import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Pool as NeonPoolType } from "@neondatabase/serverless";
import dotenv from "dotenv";
import ws from "ws";

// packages/db/src/test-migrations.ts → repo root
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..");
dotenv.config({ path: path.join(repoRoot, ".env") });

// Dynamic imports so dotenv runs before @bec/config validates env.
const { Pool, neonConfig } = await import("@neondatabase/serverless");
const { drizzle } = await import("drizzle-orm/neon-serverless");
const { migrate } = await import("drizzle-orm/neon-serverless/migrator");
const { assertProdDbAccessible } = await import("@bec/config");

// The Pool driver connects to Neon's proxy over a WebSocket. Node 22+ has a
// global `WebSocket`, but set it explicitly with the `ws` package so this
// works the same on the operator's Node 20 local and on CI's Node 22.
neonConfig.webSocketConstructor = ws;

// packages/db/src/ → packages/db/migrations
const MIGRATIONS_FOLDER = path.join(here, "..", "migrations");

// The full canonical set after applying 0000_worthless_falcon.sql. Future
// migrations should append to this list. If a migration adds a table that
// isn't listed here, this test fails — the correct loud failure (forces
// deliberate review of the canonical set).
const EXPECTED_TABLES = [
  "agent_budgets",
  "agent_runs",
  "article_businesses",
  "article_images",
  "articles",
  "authors",
  "business_enrichment_log",
  "businesses",
  "categories",
  "editorial_feedback",
  "events",
  "featured_listings",
  "images",
  "lead_status_history",
  "leads",
  "newsletter_issues",
  "newsletter_sends",
  "outreach_messages",
  "project_tasks",
  "projects",
  "sites",
  "sponsorships",
  "subscribers",
] as const;

const EXPECTED_ENUMS = [
  "article_status",
  "content_type",
  "featured_placement",
  "image_provenance",
  "lead_status",
  "project_status",
  "reply_sentiment",
  "subscriber_status",
] as const;

type NeonPool = InstanceType<typeof NeonPoolType>;

async function listPublicTables(pool: NeonPool): Promise<string[]> {
  const res = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
  );
  return (res.rows as Array<{ table_name: string }>).map((r) => r.table_name);
}

async function listPublicEnums(pool: NeonPool): Promise<string[]> {
  const res = await pool.query(
    `SELECT t.typname AS enum_name
     FROM pg_type t
     JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public' AND t.typtype = 'e'
     ORDER BY t.typname`,
  );
  return (res.rows as Array<{ enum_name: string }>).map((r) => r.enum_name);
}

function diffSets(
  actual: readonly string[],
  expected: readonly string[],
): { missing: string[]; extra: string[] } {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  return {
    missing: expected.filter((e) => !actualSet.has(e)),
    extra: actual.filter((a) => !expectedSet.has(a)),
  };
}

async function assertCanonicalSchema(pool: NeonPool, context: string): Promise<void> {
  const tableDiff = diffSets(await listPublicTables(pool), EXPECTED_TABLES);
  if (tableDiff.missing.length > 0 || tableDiff.extra.length > 0) {
    throw new Error(
      `${context}: table set diverged from canonical 23.\n` +
        `  missing: ${tableDiff.missing.join(", ") || "(none)"}\n` +
        `  extra:   ${tableDiff.extra.join(", ") || "(none)"}\n` +
        `If a migration intentionally added/removed a table, update EXPECTED_TABLES in ` +
        `packages/db/src/test-migrations.ts.`,
    );
  }

  const enumDiff = diffSets(await listPublicEnums(pool), EXPECTED_ENUMS);
  if (enumDiff.missing.length > 0 || enumDiff.extra.length > 0) {
    throw new Error(
      `${context}: enum set diverged from canonical 8.\n` +
        `  missing: ${enumDiff.missing.join(", ") || "(none)"}\n` +
        `  extra:   ${enumDiff.extra.join(", ") || "(none)"}\n` +
        `If a migration intentionally added/removed an enum, update EXPECTED_ENUMS.`,
    );
  }
}

async function assertPublicSchemaEmpty(pool: NeonPool): Promise<void> {
  const tables = await listPublicTables(pool);
  if (tables.length > 0) {
    throw new Error(
      `Expected public schema to be empty after the rollback DROP SCHEMA + ` +
        `CREATE SCHEMA, but found ${tables.length} tables: ${tables.join(", ")}`,
    );
  }
}

async function main(): Promise<void> {
  // ADR-038: refuse to run without explicit prod-write opt-in. CI's workflow
  // step sets PROD_DB_ALLOWED=true (Neon ephemeral branches are per-PR
  // throwaways).
  assertProdDbAccessible();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    // eslint-disable-next-line no-console
    console.error("DATABASE_URL is required to run migration tests.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    // eslint-disable-next-line no-console
    console.log("Running migration tests against DATABASE_URL\n");

    // ── Test 1: forward ───────────────────────────────────────────
    // eslint-disable-next-line no-console
    console.log("→ [1/3] Apply all migrations forward");
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    await assertCanonicalSchema(pool, "after forward migrations");
    // eslint-disable-next-line no-console
    console.log(
      `  ✓ ${EXPECTED_TABLES.length} tables + ${EXPECTED_ENUMS.length} enums present`,
    );

    // ── Test 2: idempotency ───────────────────────────────────────
    // eslint-disable-next-line no-console
    console.log("→ [2/3] Re-run migrations (idempotency check)");
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    await assertCanonicalSchema(pool, "after re-applying migrations");
    // eslint-disable-next-line no-console
    console.log("  ✓ Re-run completed without error; schema unchanged");

    // ── Test 3: rollback ──────────────────────────────────────────
    // Drop BOTH `public` (the schema migrations create tables in) AND
    // `drizzle` (where drizzle's migrator records applied migrations in
    // `__drizzle_migrations`). Dropping only `public` would leave the
    // migration bookkeeping behind, so a second run of this script on the
    // same database would see migrations as "already applied", skip them,
    // and fail the canonical-schema assertion. Dropping both returns the
    // database to its true prior (empty) state and keeps the script
    // re-runnable — which matters for local iteration even though CI uses
    // a fresh ephemeral branch each run.
    // eslint-disable-next-line no-console
    console.log("→ [3/3] Roll back — DROP SCHEMA public + drizzle CASCADE");
    await pool.query("DROP SCHEMA IF EXISTS drizzle CASCADE");
    await pool.query("DROP SCHEMA public CASCADE");
    await pool.query("CREATE SCHEMA public");
    await assertPublicSchemaEmpty(pool);
    // eslint-disable-next-line no-console
    console.log("  ✓ Public schema is empty after rollback");

    // eslint-disable-next-line no-console
    console.log("\n✓ All migration tests passed");
  } finally {
    await pool.end();
  }

  process.exit(0);
}

await main();
