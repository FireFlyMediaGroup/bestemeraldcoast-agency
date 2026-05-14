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
