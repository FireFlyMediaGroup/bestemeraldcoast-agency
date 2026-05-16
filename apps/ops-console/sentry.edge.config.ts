// Sentry edge-runtime init (middleware + edge routes). Same DSN/env source as
// the server config. @bec/config reads process.env which is available in the
// edge runtime; no DB or Node-only APIs are touched here.

import * as Sentry from "@sentry/nextjs";

import { currentEnv, serverEnv } from "@bec/config";

if (serverEnv.SENTRY_DSN) {
  Sentry.init({
    dsn: serverEnv.SENTRY_DSN,
    environment: currentEnv,
    tracesSampleRate: 0,
  });
}
