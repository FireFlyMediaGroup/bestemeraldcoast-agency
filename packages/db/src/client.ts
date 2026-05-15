// Neon serverless Drizzle client (ADR-002, ADR-003, ADR-004, ADR-038).
//
// Single shared client for app code. Uses the Pool-based
// `drizzle-orm/neon-serverless` driver (pg wire protocol over a WebSocket).
//
// Why Pool, not the HTTP `neon()` driver: @neondatabase/serverless 1.x
// restricts its `sql` tagged-template function to template-literal call form
// only. drizzle-orm 0.39's neon-http session calls it in function-call form
// for prepared statements, so the entire neon-http codepath throws
// "This function can now be called only as a tagged-template function" at
// query time. The Pool driver uses the pg wire protocol and has no such
// restriction. (Discovered via the Commit 1.3 migration-test CI saga; this
// is the whole-layer fix that the test-migrations script's local fix
// pointed at.) Revisit if drizzle-orm ships a neon-http path compatible with
// @neondatabase/serverless 1.x and the HTTP driver's lower per-query latency
// becomes worth it.

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";

import { serverEnv } from "@bec/config";

import * as schema from "./schema/index.js";

// The Pool driver connects to Neon's proxy over a WebSocket. Node 22+ has a
// global `WebSocket`, but set it explicitly via the `ws` package so behavior
// is identical on the operator's Node 20 local, CI's Node 22, and the Vercel
// runtime. Module-scope assignment is safe — it's a config write, not a
// connection (those are still deferred to the first `getDb()` call).
neonConfig.webSocketConstructor = ws;

export type Database = NeonDatabase<typeof schema>;

/**
 * Lazy db handle. Importing this module doesn't open a connection;
 * `getDb()` constructs the pool + client on first call and reuses it after.
 * That keeps the import side-effect-free and avoids opening a pool in
 * scripts that import `@bec/db` purely for its schema exports.
 */
let cached: Database | undefined;

export function getDb(): Database {
  if (cached) return cached;
  const pool = new Pool({ connectionString: serverEnv.DATABASE_URL });
  cached = drizzle(pool, { schema });
  return cached;
}

export { schema };
