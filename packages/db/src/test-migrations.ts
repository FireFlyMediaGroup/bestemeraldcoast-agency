// Migration test (ADR-016 schema-migration tests slice; Phase 1 / Commit 1.3).
//
// Master plan acceptance: "Create scripts/test-migrations.ts that, in CI, runs
// every Drizzle migration forward, then rolls back, and verifies the schema
// returns to its prior state. Wire to the CI workflow."
//
// What the script does:
//
//   1. Forward — applies all drizzle migrations against DATABASE_URL, then
//      asserts the public schema contains the expected 23 tables + 8 enums.
//      A purposely-broken migration causes drizzle's migrator to throw; CI
//      sees the non-zero exit and fails the job (the master plan's
//      "purposely-broken migration fails CI" acceptance line).
//
//   2. Idempotency — re-runs migrations. Drizzle's migrator tracks applied
//      migrations in `drizzle.__drizzle_migrations`; the second run is a
//      no-op. Asserts the schema is unchanged.
//
//   3. Rollback — `DROP SCHEMA public CASCADE` then re-`CREATE SCHEMA public`.
//      This is the "rolls back" step. Drizzle doesn't ship down migrations,
//      so the practical inverse is "drop everything." Asserts the public
//      schema is empty after the drop.
//
// Run with:
//
//   pnpm --filter @bec/db db:test-migrations
//
// Env: DATABASE_URL is required. The script is destructive — it drops the
// public schema — so it's guarded by `assertProdDbAccessible()` (ADR-038).
// In CI the guard passes because the workflow sets `PROD_DB_ALLOWED=true` on
// the step (Neon ephemeral branches are per-PR throwaways; the guard's
// "don't write to prod from a dev machine" intent doesn't apply). Locally,
// the operator must explicitly opt in via env override before running.

import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NeonQueryFunction } from "@neondatabase/serverless";
import dotenv from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..");
dotenv.config({ path: path.join(repoRoot, ".env") });

// Dynamic imports so dotenv runs before @bec/config validates env. Same
// pattern as the seed script.
const { neon } = await import("@neondatabase/serverless");
const { drizzle } = await import("drizzle-orm/neon-http");
const { migrate } = await import("drizzle-orm/neon-http/migrator");
const { assertProdDbAccessible } = await import("@bec/config");

const MIGRATIONS_FOLDER = path.join(here, "..", "migrations");

// The full canonical set after applying 0000_worthless_falcon.sql. Future
// migrations should append to this list. If the migration adds a table that
// isn't listed here, this test fails — which is the correct loud failure
// (forces deliberate review of the canonical set).
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

// `neon()` returns `NeonQueryFunction<false, false>` (the default tagged-template
// mode where awaited results are arrays of row objects, not FullQueryResults).
// `ReturnType<typeof neon>` would broaden to `<boolean, boolean>` and fail to
// accept the concrete instance.
type NeonSql = NeonQueryFunction<false, false>;

async function listPublicTables(sql: NeonSql): Promise<string[]> {
  const rows = (await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `) as Array<{ table_name: string }>;
  return rows.map((r) => r.table_name);
}

async function listPublicEnums(sql: NeonSql): Promise<string[]> {
  const rows = (await sql`
    SELECT t.typname AS enum_name
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e'
    ORDER BY t.typname
  `) as Array<{ enum_name: string }>;
  return rows.map((r) => r.enum_name);
}

function diffSets(actual: readonly string[], expected: readonly string[]): {
  missing: string[];
  extra: string[];
} {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  return {
    missing: expected.filter((e) => !actualSet.has(e)),
    extra: actual.filter((a) => !expectedSet.has(a)),
  };
}

async function assertCanonicalSchema(sql: NeonSql, context: string): Promise<void> {
  const actualTables = await listPublicTables(sql);
  const tableDiff = diffSets(actualTables, EXPECTED_TABLES);
  if (tableDiff.missing.length > 0 || tableDiff.extra.length > 0) {
    throw new Error(
      `${context}: table set diverged from canonical 23.\n` +
        `  missing: ${tableDiff.missing.join(", ") || "(none)"}\n` +
        `  extra:   ${tableDiff.extra.join(", ") || "(none)"}\n` +
        `If a new migration intentionally added or removed a table, update EXPECTED_TABLES in ` +
        `packages/db/scripts/test-migrations.ts.`,
    );
  }

  const actualEnums = await listPublicEnums(sql);
  const enumDiff = diffSets(actualEnums, EXPECTED_ENUMS);
  if (enumDiff.missing.length > 0 || enumDiff.extra.length > 0) {
    throw new Error(
      `${context}: enum set diverged from canonical 8.\n` +
        `  missing: ${enumDiff.missing.join(", ") || "(none)"}\n` +
        `  extra:   ${enumDiff.extra.join(", ") || "(none)"}\n` +
        `If a new migration intentionally added or removed an enum, update EXPECTED_ENUMS.`,
    );
  }
}

async function assertPublicSchemaEmpty(sql: NeonSql): Promise<void> {
  const tables = await listPublicTables(sql);
  if (tables.length > 0) {
    throw new Error(
      `Expected public schema to be empty after DROP SCHEMA + CREATE SCHEMA, but ` +
        `found ${tables.length} tables: ${tables.join(", ")}`,
    );
  }
}

async function main(): Promise<void> {
  // ADR-038: refuse to run without explicit prod-write opt-in. Same guard the
  // seed uses. In CI the workflow step sets PROD_DB_ALLOWED=true (Neon
  // ephemeral branches are per-PR throwaways).
  assertProdDbAccessible();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    // eslint-disable-next-line no-console
    console.error("DATABASE_URL is required to run migration tests.");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  // eslint-disable-next-line no-console
  console.log("Running migration tests against DATABASE_URL\n");

  // ── Test 1: forward ─────────────────────────────────────────────
  // eslint-disable-next-line no-console
  console.log("→ [1/3] Apply all migrations forward");
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  await assertCanonicalSchema(sql, "after forward migrations");
  // eslint-disable-next-line no-console
  console.log(
    `  ✓ ${EXPECTED_TABLES.length} tables + ${EXPECTED_ENUMS.length} enums present in public schema`,
  );

  // ── Test 2: idempotency ─────────────────────────────────────────
  // eslint-disable-next-line no-console
  console.log("→ [2/3] Re-run migrations (idempotency check)");
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  await assertCanonicalSchema(sql, "after re-applying migrations");
  // eslint-disable-next-line no-console
  console.log("  ✓ Re-run completed without error; schema unchanged");

  // ── Test 3: rollback ────────────────────────────────────────────
  // eslint-disable-next-line no-console
  console.log("→ [3/3] Roll back — DROP SCHEMA public CASCADE");
  await sql`DROP SCHEMA public CASCADE`;
  await sql`CREATE SCHEMA public`;
  await assertPublicSchemaEmpty(sql);
  // eslint-disable-next-line no-console
  console.log("  ✓ Public schema is empty after rollback");

  // eslint-disable-next-line no-console
  console.log("\n✓ All migration tests passed");
  // Hard exit so the @neondatabase/serverless HTTP client's keep-alive socket
  // pool doesn't hold the event loop past the script's logical end.
  process.exit(0);
}

await main();
