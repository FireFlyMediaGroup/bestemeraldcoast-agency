// @bec/logger manual acceptance smoke (ADR-012; Phase 0 ADR-035 gate Box 5).
//
// Imports from the compiled `dist/` output rather than `src/` because tsx's
// loader hangs when its transformed entry imports @sentry/node v8 transitively
// (the @sentry/node OpenTelemetry auto-instrumentation interacts badly with
// tsx's dynamic-import path on at least Node 20/22). Plain `node` against
// compiled JS imports @sentry/node cleanly. The wrapper script in
// `packages/logger/package.json` runs `pnpm run build` first so a fresh dist
// is always present.
//
// Run via:
//
//   pnpm --filter @bec/logger test-emit
//
// Env: loads repo-root .env via dotenv. Env validation runs at @bec/config's
// first import, so any placeholder values in .env that fail Zod's shape checks
// (URL, length, prefix) will surface here as a clear "Environment validation
// failed" error before any logging happens.

import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));
// packages/logger/scripts → repo root
const repoRoot = path.resolve(here, "..", "..", "..");
dotenv.config({ path: path.join(repoRoot, ".env") });

const { logger, closeLogger } = await import("../dist/index.js");

const traceId = `test-emit-${Date.now()}`;

// eslint-disable-next-line no-console
console.log(`\nEmitting test logs (traceId=${traceId})…\n`);

logger.info({ traceId, agent: "test-emit" }, "info-level acceptance test");
logger.warn({ traceId, agent: "test-emit" }, "warn-level acceptance test");
logger.error(
  {
    traceId,
    agent: "test-emit",
    err: new Error("test error from packages/logger/scripts/test-emit.mjs"),
  },
  "error-level acceptance test",
);

// `closeLogger` flushes Sentry then closes its transport so the HTTP client
// doesn't keep the Node event loop alive after this script's logical end.
await closeLogger(3000);
// Give Axiom's fire-and-forget fetches one more tick to land. The Axiom
// transport doesn't expose a close hook; per-line POSTs may still be in
// flight when this resolves but their bodies have already left for the wire.
await new Promise((r) => setTimeout(r, 1000));

// eslint-disable-next-line no-console
console.log(`\n✓ emitted (traceId=${traceId})

Verify both transports:
  - Sentry:  https://sentry.io  → environment=${process.env.VERCEL_ENV || process.env.NODE_ENV || "development"}
             expect 2 events: 1 warning + 1 error tagged ${traceId}
  - Axiom:   https://app.axiom.co/  → dataset=${process.env.AXIOM_DATASET || "(unset)"}
             expect 3 events tagged ${traceId} (info/warn/error)
`);

// Belt-and-suspenders exit for the one-shot smoke script: even after
// `closeLogger()` and the 1-second Axiom wait, Node's undici keep-alive socket
// pool can hold the event loop alive for a few seconds. We want a deterministic
// exit time for CI / manual acceptance.
process.exit(0);
