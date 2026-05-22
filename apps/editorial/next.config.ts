import path from "node:path";

import type { NextConfig } from "next";

// Monorepo root (apps/editorial → ../../). Next 16 + Turbopack otherwise
// infers the root from the nearest lockfile and warns; pin it explicitly.
const workspaceRoot = path.resolve(import.meta.dirname, "..", "..");

const nextConfig: NextConfig = {
  // Commit 2.3: Cache Components + `'use cache'` on the article loader
  // (lib/article.ts). Disabled until every (site) route that reads proxy
  // headers is wrapped for Cache Components' Suspense contract — the
  // multi-tenant host router needs request-time site context on every page
  // (see (site)/layout.tsx). Re-enable in a dedicated commit once the
  // PPR/Suspense split is wired (2.11.2+).
  cacheComponents: false,
  // 2.11.5 — preserve the old /cookies + /disclosure URLs (Commit 2.1
  // placeholders) after the 2.11.4 restructure aligned the routes with the
  // canonical ADR-014 slugs in @bec/content/legal. Without these the old
  // URLs fall through to the `(site)/[category]` dynamic route and render a
  // bogus "Category: Cookies" / "Category: Disclosure" page — confusing for
  // anyone with bookmarks and a search-result regression on already-indexed
  // pages. 301 permanent: tells crawlers + browsers the canonical URL moved.
  async redirects() {
    return [
      { source: "/cookies", destination: "/cookie-policy", permanent: true },
      { source: "/disclosure", destination: "/advertiser-disclosure", permanent: true },
    ];
  },
  // Transpile the workspace TS packages we import JS from. @bec/ui is back
  // (Commit 2.2): editorial now imports its Magazine components, not just
  // its CSS. (The Commit 2.1 `_not-found` build crash was later proven to
  // be a sandbox-only env limit — clean `main` fails identically — not
  // caused by transpiling @bec/ui; the lockfile pins react 19.1.1.)
  transpilePackages: [
    "@bec/ui",
    "@bec/db",
    "@bec/logger",
    "@bec/config",
    "@bec/content",
  ],
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
