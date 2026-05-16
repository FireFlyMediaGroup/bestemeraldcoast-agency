// Public entry for @bec/db.
//
// Consumers:
//   import { getDb, schema } from "@bec/db";
//   import { sites, businesses, leads } from "@bec/db/schema";
//
// The `@bec/db/schema` subpath export is the canonical way to reach a single
// table without pulling the client. Both forms resolve to the same schema
// definitions at type-check time (via the package's `types` field pointing at
// source) and at runtime (via `default` pointing at compiled `dist/`).

export { getDb, schema, type Database } from "./client.js";

// Re-export the drizzle operators consumers need so they bind to @bec/db's
// own drizzle-orm instance. Importing `eq`/`and`/etc. from a consumer
// package's own drizzle-orm produces a structurally-incompatible `PgColumn`
// type vs. the schema's (TS2769 "no overload matches"); funnelling them
// through @bec/db guarantees a single drizzle-orm identity across the
// monorepo. Add more here as query needs grow.
export { and, asc, desc, eq, gt, gte, inArray, isNull, lt, lte, ne, or, sql } from "drizzle-orm";
