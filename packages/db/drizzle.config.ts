// drizzle-kit config (ADR-002, ADR-003).
//
// Read DATABASE_URL straight from process.env rather than going through
// @bec/config — drizzle-kit runs in tooling contexts (CI ephemeral branches,
// developer shells) where loading the whole env validator just to discover
// one URL is overkill. The validator still runs whenever app code imports
// @bec/db at runtime via src/client.ts.

import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load repo-root `.env` so `pnpm --filter @bec/db db:migrate` (and studio /
// push) pick up DATABASE_URL exactly like seed.ts / test-migrations.ts do —
// drizzle-kit itself doesn't auto-load a .env outside its own cwd, and the
// repo root is three levels up from this config. CI sets DATABASE_URL in the
// environment directly (Neon ephemeral-branch step), and dotenv never
// overrides an already-set process.env var, so this is safe in both contexts.
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "..", "..", ".env") });

// drizzle-kit `generate` only diffs schema files — no DB connection required.
// `migrate` / `push` / `studio` need DATABASE_URL; drizzle-kit errors loudly
// itself when the URL is required but missing, so we don't pre-throw.
// PROD_DB_ALLOWED=true + a vault pull is the path for ops work (ADR-038).
const databaseUrl = process.env.DATABASE_URL ?? "";

// drizzle-kit reads `dist/schema/index.js` (compiled) rather than the TS
// source. drizzle-kit's loader doesn't rewrite `.js` extensions on `.ts`
// source imports — pointing at compiled JS sidesteps that entirely. The
// `db:generate` script therefore depends on `build` running first.
export default defineConfig({
  schema: "./dist/schema/index.js",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
