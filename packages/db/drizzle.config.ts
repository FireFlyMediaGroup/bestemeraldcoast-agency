// drizzle-kit config (ADR-002, ADR-003).
//
// Read DATABASE_URL straight from process.env rather than going through
// @bec/config — drizzle-kit runs in tooling contexts (CI ephemeral branches,
// developer shells) where loading the whole env validator just to discover
// one URL is overkill. The validator still runs whenever app code imports
// @bec/db at runtime via src/client.ts.

import { defineConfig } from "drizzle-kit";

// drizzle-kit `generate` only diffs schema files — no DB connection required.
// `migrate` / `push` / `studio` need DATABASE_URL; drizzle-kit will error
// loudly itself when the URL is required but missing, so we don't pre-throw
// here. Source DATABASE_URL via `.env` (dotenv), Neon's CI ephemeral-branch
// step, or PROD_DB_ALLOWED=true + a vault pull for ops work (ADR-038).
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
