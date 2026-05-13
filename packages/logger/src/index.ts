// @bec/logger — Pino-based structured logging (ADR-012).
//
// Public API:
//   import { logger, createLogger, flushLogger } from "@bec/logger";
//
//   logger.info({ traceId, agent: "scout" }, "starting run");
//   logger.error({ err }, "oh no");
//
// Transports vary by env:
//   - development: pino-pretty → stdout
//   - preview / production: JSON → stdout + Sentry (warn+) + Axiom (info+)
//   - test: stdout only (Sentry/Axiom disabled when their env vars are absent)

import pino, { type Logger, type LoggerOptions, type StreamEntry } from "pino";

import { currentEnv, serverEnv } from "@bec/config";

import { buildAxiomStream } from "./transports/axiom.js";
import { buildPrettyStream } from "./transports/pretty.js";
import { buildSentryStream, flushSentry } from "./transports/sentry.js";

export interface LoggerContext {
  service?: string;
  [key: string]: unknown;
}

const REDACT_PATHS = [
  // Common secret-bearing field names. `remove: true` deletes the key entirely
  // rather than emitting `[Redacted]` so we don't even hint at what's there.
  // Hyphenated keys MUST use bracket notation — fast-redact's bare-identifier
  // path syntax does not handle them.
  "password",
  "*.password",
  "apiKey",
  "*.apiKey",
  "api_key",
  "*.api_key",
  "authorization",
  "*.authorization",
  "token",
  "*.token",
  "secret",
  "*.secret",
  "cookie",
  "*.cookie",
  '["set-cookie"]',
  '*["set-cookie"]',
];

function baseOptions(context: LoggerContext): LoggerOptions {
  return {
    level: currentEnv === "production" ? "info" : "debug",
    base: { service: "bec", ...context },
    redact: { paths: REDACT_PATHS, remove: true },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      // Emit `"level":"info"` instead of `"level":30` — easier to read in Axiom
      // and to map back to Sentry severities in the sentry transport.
      level: (label) => ({ level: label }),
    },
  };
}

function buildStreams(): StreamEntry[] {
  const streams: StreamEntry[] = [];

  if (currentEnv === "development") {
    streams.push({ level: "debug", stream: buildPrettyStream() });
  } else {
    streams.push({ level: "info", stream: process.stdout });
  }

  if (serverEnv.SENTRY_DSN) {
    streams.push({
      level: "warn",
      stream: buildSentryStream({
        dsn: serverEnv.SENTRY_DSN,
        environment: currentEnv,
      }),
    });
  }

  if (serverEnv.AXIOM_TOKEN && serverEnv.AXIOM_DATASET) {
    streams.push({
      level: "info",
      stream: buildAxiomStream({
        token: serverEnv.AXIOM_TOKEN,
        dataset: serverEnv.AXIOM_DATASET,
      }),
    });
  }

  return streams;
}

export function createLogger(context: LoggerContext = {}): Logger {
  return pino(baseOptions(context), pino.multistream(buildStreams()));
}

export const logger = createLogger();

/**
 * Flush async transport queues before process exit. Sentry is the one that
 * matters — Axiom is fire-and-forget per-line, so its fetch promises may not
 * resolve before exit but the events have already been sent.
 */
export async function flushLogger(timeoutMs = 2000): Promise<void> {
  await flushSentry(timeoutMs);
}

export type { Logger } from "pino";
