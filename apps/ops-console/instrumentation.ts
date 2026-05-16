// Next.js instrumentation hook — wires per-runtime Sentry init + the
// request-error capture hook. Loaded once per server/edge runtime at boot
// (ADR-012). The client runtime is initialized separately via
// `instrumentation-client.ts`.

import * as Sentry from "@sentry/nextjs";

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures errors thrown in nested React Server Components, route handlers,
// and middleware that Next surfaces through this hook.
export const onRequestError = Sentry.captureRequestError;
