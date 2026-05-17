// Next.js instrumentation hook — wires per-runtime Sentry init + the
// request-error capture hook. Loaded once per server/edge runtime at boot
// (ADR-012). The client runtime is initialized separately via
// `instrumentation-client.ts`.

import * as Sentry from "@sentry/nextjs";

export async function register(): Promise<void> {
  // Telemetry init must never take down the control plane. If Sentry's
  // server/edge bootstrap throws (e.g. an ESM/`__dirname` bundling quirk in
  // its OpenTelemetry stack), degrade to no server-side Sentry rather than
  // 500-ing every request at function boot. The error is logged so the
  // regression is still visible.
  try {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      await import("./sentry.server.config");
    }
    if (process.env.NEXT_RUNTIME === "edge") {
      await import("./sentry.edge.config");
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[instrumentation] Sentry init failed; continuing without it", err);
  }
}

// Captures errors thrown in nested React Server Components, route handlers,
// and middleware that Next surfaces through this hook.
export const onRequestError = Sentry.captureRequestError;
