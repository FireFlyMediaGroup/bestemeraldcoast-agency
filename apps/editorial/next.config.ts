import path from "node:path";

import type { NextConfig } from "next";

// Monorepo root (apps/editorial → ../../). Next 16 + Turbopack otherwise
// infers the root from the nearest lockfile and warns; pin it explicitly.
const workspaceRoot = path.resolve(import.meta.dirname, "..", "..");

const nextConfig: NextConfig = {
  // Transpile the workspace packages we import JS from. NOTE: `@bec/ui` is
  // deliberately NOT here. The 2.1 shell consumes only
  // `@bec/ui/styles/globals.css` (resolved by Tailwind v4 / PostCSS, not
  // Next's JS transpile); listing @bec/ui made Next compile the package and
  // pull its hard `react` dependency into the build worker. Add @bec/ui back
  // in Commit 2.2 when its components are actually imported.
  transpilePackages: ["@bec/db", "@bec/logger", "@bec/config"],
  // @bec/db's Neon serverless driver + its ws transport must load as native
  // Node modules, not get bundled (proxy.ts runs on the Node runtime and
  // resolves host→site via @bec/db). Same externalization ops-console uses.
  serverExternalPackages: ["@neondatabase/serverless", "ws"],
  turbopack: {
    root: workspaceRoot,
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
  webpack(config) {
    // `next build --webpack`: map `.js` requests onto `.ts`/`.tsx` source
    // for the workspace packages.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
