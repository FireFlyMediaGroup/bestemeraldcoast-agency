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

// The Pool driver can speak WebSockets (session/interactive tx) or — when
// `poolQueryViaFetch` is true — send each `Pool.query()` over HTTP fetch.
//
// On Vercel serverless we reuse a module-scoped Pool across invocations;
// Neon tears down idle WebSocket legs, so the next Auth.js adapter query
// surfaces as "Connection terminated unexpectedly". Fetch-backed queries
// avoid long-lived WS state and match Neon's serverless guidance (see Neon
// serverless CONFIG.md: `poolQueryViaFetch`). Drizzle's neon-serverless
// session calls `pool.query(...)`, which honors this flag.
neonConfig.poolQueryViaFetch = true;
//
// Still set WebSocket for code paths that don't use fetch (e.g. tooling that
// attaches session listeners). Node 22+ has a global `WebSocket`; `ws` keeps
// behavior identical on Node 20 local, CI, and Vercel.
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
