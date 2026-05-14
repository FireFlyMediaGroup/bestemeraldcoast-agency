// Neon serverless Drizzle client (ADR-002, ADR-003, ADR-004, ADR-038).
//
// Single shared client for app code. Uses `@neondatabase/serverless`'s HTTP
// driver — works in Vercel functions, Edge runtime, and plain Node alike, no
// websocket setup required. For long-running agent processes the same client
// is fine; if connection-pooling semantics become a bottleneck we can swap to
// the `drizzle-orm/neon-serverless` Pool driver per-app.

import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import { serverEnv } from "@bec/config";

import * as schema from "./schema/index.js";

export type Database = NeonHttpDatabase<typeof schema>;

/**
 * Lazy db handle. Importing this module doesn't open a connection;
 * `getDb()` constructs the client on first call and reuses it after.
 * That keeps the import side-effect-free and avoids issues in scripts
 * that import `@bec/db` purely for its schema exports.
 */
let cached: Database | undefined;

export function getDb(): Database {
  if (cached) return cached;
  const sql = neon(serverEnv.DATABASE_URL);
  cached = drizzle(sql, { schema });
  return cached;
}

export { schema };
