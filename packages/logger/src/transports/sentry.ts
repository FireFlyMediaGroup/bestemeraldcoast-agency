// Sentry transport for `warn+` log lines (ADR-012).
//
// Receives JSON-line writes from pino.multistream, parses them, and converts
// each into a Sentry capture call:
//   - log line carries `.err` (an Error or error-like object) → captureException
//   - otherwise                                                → captureMessage
//
// The Sentry SDK queues events and flushes asynchronously; use `flushSentry()`
// before process exit so test scripts don't drop events.

import * as Sentry from "@sentry/node";
import type { DestinationStream } from "pino";

export interface SentryStreamOptions {
  dsn: string;
  environment: string;
  release?: string;
  minLevel?: number;
}

const PINO_WARN = 40;

let initialized = false;

function ensureInit(opts: SentryStreamOptions): void {
  if (initialized) return;
  Sentry.init({
    dsn: opts.dsn,
    environment: opts.environment,
    release: opts.release,
    tracesSampleRate: 0,
  });
  initialized = true;
}

type LogLine = {
  level: number | string;
  msg?: string;
  time?: string | number;
  err?: unknown;
} & Record<string, unknown>;

function levelToNumber(level: number | string): number {
  if (typeof level === "number") return level;
  switch (level) {
    case "fatal": return 60;
    case "error": return 50;
    case "warn": return 40;
    case "info": return 30;
    case "debug": return 20;
    case "trace": return 10;
    default: return 30;
  }
}

function levelToSeverity(level: number): Sentry.SeverityLevel {
  if (level >= 60) return "fatal";
  if (level >= 50) return "error";
  if (level >= 40) return "warning";
  if (level >= 30) return "info";
  return "debug";
}

function buildError(line: LogLine): Error {
  const err = line.err as { message?: string; type?: string; stack?: string } | Error | undefined;
  if (err instanceof Error) return err;
  if (err && typeof err === "object" && typeof err.message === "string") {
    const out = new Error(err.message);
    out.name = err.type ?? "Error";
    if (err.stack) out.stack = err.stack;
    return out;
  }
  return new Error(typeof line.msg === "string" ? line.msg : "Unknown error");
}

function buildExtras(line: LogLine): Record<string, unknown> {
  const { level: _l, time: _t, msg: _m, err: _e, ...rest } = line;
  void _l;
  void _t;
  void _m;
  void _e;
  return rest;
}

export function buildSentryStream(opts: SentryStreamOptions): DestinationStream {
  ensureInit(opts);
  const minLevel = opts.minLevel ?? PINO_WARN;

  return {
    write(chunk: string): void {
      // Pino writes one JSON object per line. Multistream gates by min level,
      // but defend against unexpected upstream changes by re-checking.
      try {
        const line = JSON.parse(chunk) as LogLine;
        const levelNum = levelToNumber(line.level);
        if (levelNum < minLevel) return;

        const severity = levelToSeverity(levelNum);
        const extras = buildExtras(line);

        if (line.err) {
          Sentry.captureException(buildError(line), { level: severity, extra: extras });
        } else if (typeof line.msg === "string") {
          Sentry.captureMessage(line.msg, { level: severity, extra: extras });
        }
      } catch {
        // Never let a logger error crash the host process.
      }
    },
  };
}

export async function flushSentry(timeoutMs = 2000): Promise<void> {
  if (!initialized) return;
  await Sentry.flush(timeoutMs);
}
