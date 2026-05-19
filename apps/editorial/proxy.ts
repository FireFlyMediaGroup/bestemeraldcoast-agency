// Host-based routing for the editorial network (ADR-001).
//
// Next 16 renamed `middleware.ts` → `proxy.ts`. Every request to any of the
// 8 domains hits this: we resolve the request host to a site row, write the
// site context onto the forwarded request headers (so server components read
// it via `getSiteContext()` with no extra DB hit), and let the request
// proceed. An unmapped host is rewritten to `/__unknown_host__` — an
// explicit static route that calls `notFound()` (HTTP 404). We never guess
// a site.
//
// Next 16 contract: `proxy.ts` ALWAYS runs on the Node.js runtime and does
// NOT accept a route-segment `config` export. Path filtering is therefore
// done in-function. The skip set is restricted to Next internals + the
// known root static endpoints ONLY — NOT "any path ending in .ext", which
// would let a dynamic slug containing a dot (e.g. /businesses/foo.css)
// bypass host validation and defeat the unknown-host → 404 contract.

import { NextResponse, type NextRequest } from "next/server";

import { resolveSiteByHost, SITE_HEADERS } from "@/lib/site-context";

const UNKNOWN_HOST = "/__unknown_host__";

function isSkippable(pathname: string): boolean {
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/opengraph-image")) return true;
  return (
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  if (isSkippable(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Vercel sets x-forwarded-host to the real domain; `host` is the fallback
  // for local / direct requests.
  const rawHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  let site;
  try {
    site = await resolveSiteByHost(rawHost);
  } catch (err) {
    // Resolver failure (DB/Redis down) must degrade deterministically to a
    // 404, never a 500 — and never guess a site. Logged for visibility.
    const { logger } = await import("@bec/logger");
    logger.error({ err, host: rawHost }, "proxy: host resolve failed → 404");
    return NextResponse.rewrite(new URL(UNKNOWN_HOST, request.url));
  }

  if (!site) {
    // `/__unknown_host__` is an explicit STATIC route (app/__unknown_host__/
    // page.tsx) that calls notFound(). A static segment outranks the dynamic
    // `(site)/[category]` route, so an unmapped host reliably 404s instead
    // of rendering a category page.
    return NextResponse.rewrite(new URL(UNKNOWN_HOST, request.url));
  }

  // Forward the resolved site on request headers for the render pass.
  const headers = new Headers(request.headers);
  headers.set(SITE_HEADERS.id, site.id);
  headers.set(SITE_HEADERS.slug, site.slug);
  headers.set(SITE_HEADERS.name, site.name);
  headers.set(SITE_HEADERS.archetype, site.archetype);
  headers.set(SITE_HEADERS.domain, site.domain);
  headers.set(SITE_HEADERS.tagline, site.tagline ?? "");

  return NextResponse.next({ request: { headers } });
}
