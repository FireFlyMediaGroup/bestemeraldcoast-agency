import path from "node:path";

import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

// Monorepo root (apps/ops-console → ../../). Next 16 + Turbopack otherwise
// infers the root from the nearest lockfile and warns; pin it explicitly.
const workspaceRoot = path.resolve(import.meta.dirname, "..", "..");

const nextConfig: NextConfig = {
  // Workspace packages ship TS/TSX source (dual-entry: `types` → src,
  // `default` → dist). Transpile them through Next so the app imports
  // @bec/ui's TSX + @bec/db / @bec/logger / @bec/config without each
  // shipping a separate browser build.
  transpilePackages: ["@bec/ui", "@bec/db", "@bec/logger", "@bec/config"],
  // Keep these out of the server bundle (run as native Node CJS):
  // - @neondatabase/serverless + ws: @bec/db's ws transport.
  // - @sentry/nextjs + its OpenTelemetry instrumentation deps
  //   `import-in-the-middle` / `require-in-the-middle`: these reference the
  //   CJS-only `__dirname`. This app is `"type": "module"`, so Next bundles
  //   the server as ESM where `__dirname` is undefined — bundling them made
  //   loading `instrumentation.ts` (which imports @sentry/nextjs) throw
  //   `ReferenceError: __dirname is not defined` at function boot, 500-ing
  //   every route. Externalizing @sentry/nextjs alone is NOT enough — Next
  //   still bundles the nested `*-in-the-middle` packages; they must be
  //   externalized by name (per Sentry's Next.js troubleshooting guide) so
  //   they load as native CJS where `__dirname` exists.
  // (Stable key in Next 16 — formerly experimental.serverComponentsExternalPackages.)
  serverExternalPackages: [
    "@neondatabase/serverless",
    "ws",
    "@sentry/nextjs",
    "import-in-the-middle",
    "require-in-the-middle",
  ],
  turbopack: {
    root: workspaceRoot,
    // @bec/ui's internal imports use `.js` specifiers against `.ts`/`.tsx`
    // source (NodeNext/verbatimModuleSyntax). Turbopack resolves TS `.js`
    // specifiers natively; listing the source extensions first keeps that
    // deterministic across the transpiled workspace packages.
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
  webpack(config) {
    // Fallback path when built with `next build --webpack`: webpack won't
    // map a `.js` request onto a `.ts` file without this.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

// withSentryConfig injects source-map upload + tunneling. Upload only runs
// when SENTRY_AUTH_TOKEN is present (CI / Vercel prod); local builds skip it
// silently. Org/project come from SENTRY_* env at build time.
export default withSentryConfig(nextConfig, {
  silent: true,
  // Same-origin tunnel so browser → Sentry isn't ad-blocked. Harmless for
  // an internal tool but standard hardening.
  tunnelRoute: "/monitoring",
});
