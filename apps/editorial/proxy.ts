// Host-based routing for the editorial network (ADR-001).
//
// Next 16 renamed `middleware.ts` → `proxy.ts`. Every request to any of the
// 8 domains hits this: we resolve the request host to a site row, write the
// site context onto the forwarded request headers (so server components read
// it via `getSiteContext()` with no extra DB hit), and let the request
// proceed. An unmapped host is rewritten to a path with no route, which
// renders the app's `not-found.tsx` with a 404 — we never guess a site.
//
// Next 16 contract: `proxy.ts` ALWAYS runs on the Node.js runtime and does
// NOT accept a route-segment `config` export. Path filtering is therefore
// done in-function: skip Next internals + static assets so the host→site
// resolver isn't invoked for chunks/images/favicon/sitemap/robots. The Node
// runtime is also why the resolver can import @bec/db (Neon serverless),
// externalized in next.config.ts.

import { NextResponse, type NextRequest } from "next/server";

import { resolveSiteByHost, SITE_HEADERS } from "@/lib/site-context";

const SKIP =
  /^\/(?:_next\/static|_next\/image|favicon\.ico|robots\.txt|sitemap\.xml|opengraph-image)|\.(?:svg|png|jpe?g|gif|webp|avif|ico|css|js|woff2?)$/;

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  if (SKIP.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Vercel sets x-forwarded-host to the real domain; `host` is the fallback
  // for local / direct requests.
  const rawHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  const site = await resolveSiteByHost(rawHost);

  if (!site) {
    // No route exists at this path → Next renders not-found.tsx (HTTP 404).
    // We do NOT fall back to a default site: an unmapped host is an error,
    // not "show Pensacola".
    return NextResponse.rewrite(new URL("/__unknown_host__", request.url));
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
