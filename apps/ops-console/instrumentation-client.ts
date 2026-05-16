// Client-runtime Sentry init. The browser bundle can't import @bec/config
// (server-only — it reads process.env and would leak the server schema), so
// the client DSN comes from the build-inlined NEXT_PUBLIC_SENTRY_DSN. It's
// optional: ops-console is an internal, noindex, single-operator tool, so
// server/edge capture (the deferred Commit 0.4 requirement) is the load-
// bearing part; client capture is a nice-to-have that no-ops when the public
// DSN isn't configured. No @bec/config client-schema change needed.

import * as Sentry from "@sentry/nextjs";

const clientDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (clientDsn) {
  Sentry.init({
    dsn: clientDsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
    tracesSampleRate: 0,
  });
}

// Required by @sentry/nextjs for client-side navigation instrumentation;
// harmless when Sentry wasn't initialized above.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
