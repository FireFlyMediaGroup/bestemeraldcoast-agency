// Sentry server-runtime init (ADR-012; closes the deferred half of Commit
// 0.4's prompt — "initialize Sentry in each Next.js app via @sentry/nextjs").
// DSN + environment come from @bec/config's validated serverEnv; this file
// only runs in the Node server runtime so importing @bec/config is safe.

import * as Sentry from "@sentry/nextjs";

import { currentEnv, serverEnv } from "@bec/config";

if (serverEnv.SENTRY_DSN) {
  Sentry.init({
    dsn: serverEnv.SENTRY_DSN,
    environment: currentEnv,
    // Internal control plane — capture errors, skip perf tracing to keep
    // the Sentry bill aligned with ADR-012's "errors first" posture.
    tracesSampleRate: 0,
  });
}
