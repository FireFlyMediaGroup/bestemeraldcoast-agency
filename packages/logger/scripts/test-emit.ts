// Manual acceptance script for Commit 0.4 (ADR-012).
//
// Loads .env from the repo root, emits one log line at each of info / warn /
// error level, flushes Sentry, and reports back what should be visible in
// each transport's UI. Run with:
//
//   pnpm --filter @bec/logger test-emit

import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));
// packages/logger/scripts → repo root
const repoRoot = path.resolve(here, "..", "..", "..");
dotenv.config({ path: path.join(repoRoot, ".env") });

const { logger, flushLogger } = await import("../src/index.js");

const traceId = `test-emit-${Date.now()}`;

// eslint-disable-next-line no-console
console.log(`\nEmitting test logs (traceId=${traceId})…\n`);

logger.info({ traceId, agent: "test-emit" }, "info-level acceptance test");
logger.warn({ traceId, agent: "test-emit" }, "warn-level acceptance test");
logger.error(
  { traceId, agent: "test-emit", err: new Error("test error from packages/logger/scripts/test-emit.ts") },
  "error-level acceptance test",
);

await flushLogger(3000);
// Give Axiom's fire-and-forget fetches one more tick to land.
await new Promise((r) => setTimeout(r, 1000));

// eslint-disable-next-line no-console
console.log(`\n✓ emitted (traceId=${traceId})

Verify both transports:
  - Sentry:  https://sentry.io  → environment=${process.env.VERCEL_ENV || process.env.NODE_ENV || "development"}
             expect 2 events: 1 warning + 1 error tagged ${traceId}
  - Axiom:   https://app.axiom.co/  → dataset=${process.env.AXIOM_DATASET || "(unset)"}
             expect 3 events tagged ${traceId} (info/warn/error)
`);
