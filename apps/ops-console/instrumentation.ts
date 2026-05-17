// Next.js instrumentation hook — wires per-runtime Sentry init + the
// request-error capture hook. Loaded once per server/edge runtime at boot
// (ADR-012). The client runtime is initialized separately via
// `instrumentation-client.ts`.
//
// IMPORTANT: there is no top-level `import … from "@sentry/nextjs"` here.
// Loading this module must not pull Sentry (and its OpenTelemetry
// `*-in-the-middle` deps that reference the CJS-only `__dirname`) at module
// scope — a top-level import is evaluated when Next loads instrumentation,
// outside any try/catch, and previously crashed function boot with
// `ReferenceError: __dirname is not defined`, 500-ing every route. All
// Sentry access is deferred to dynamic imports inside guarded functions.
// (Paired with `serverExternalPackages` in next.config.ts.)

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
// and middleware that Next surfaces through this hook. Sentry is imported
// lazily + guarded so neither loading this module nor an error path can
// crash the runtime if Sentry itself is unavailable.
export async function onRequestError(
  ...args: Parameters<
    typeof import("@sentry/nextjs").captureRequestError
  >
): Promise<void> {
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureRequestError(...args);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[instrumentation] onRequestError: Sentry capture failed", err);
  }
}
