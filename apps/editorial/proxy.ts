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

import { checkRateLimit, rateLimitHeaders, tooManyRequests } from "@bec/rate-limit";

import type { RateLimitResult } from "@bec/rate-limit";

import { resolveSiteByHost, SITE_HEADERS } from "@/lib/site-context";

const UNKNOWN_HOST = "/__unknown_host__";

/**
 * Best-effort client IP from forwarding headers. Vercel sets
 * `x-forwarded-for` to a comma-separated client→proxy chain; the first
 * entry is the original client. Falls back to a sentinel when neither
 * header is present (proxy.ts always runs on the Node runtime, so there
 * is no socket-level remote address to recover here).
 */
function clientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Attach the IETF `RateLimit-*` header set to a response so clients (and
 * synthetic monitors) can see the limiter's state on every request, not
 * only on a 429. No-op when the limiter is unconfigured (rateLimitHeaders
 * returns `{}`), so dev/CI responses stay header-clean.
 */
function withRateLimitHeaders<T extends NextResponse | Response>(
  response: T,
  rl: RateLimitResult,
): T {
  for (const [k, v] of Object.entries(rateLimitHeaders(rl))) {
    response.headers.set(k, v);
  }
  return response;
}

function isSkippable(pathname: string): boolean {
  if (pathname.startsWith("/_next/")) return true;
  // NOTE: `/robots.txt`, `/sitemap.xml`, AND `/opengraph-image` are
  // intentionally NOT skipped. They are per-domain (ADR-009) and their
  // route handlers need the proxy-resolved site context, so the
  // host→site headers must be injected. The resolve is Upstash-cached, so
  // crawler hits stay cheap. Only truly site-agnostic static endpoints are
  // skipped.
  //
  // History: 2.4 added the robots/sitemap routes and removed them from the
  // skip set; 2.11.6 added the root opengraph-image route and removed
  // `/opengraph-image*` from the skip set (the route now generates a
  // per-domain card via `getSiteContext()` — Satori-rendered, ADR-009
  // 1200×630).
  return pathname === "/favicon.ico";
}

export default async function proxy(request: NextRequest): Promise<NextResponse | Response> {
  if (isSkippable(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // ADR-017 publicPages DDoS guard — 1000 req/IP/min across every domain.
  // Fail-open if Upstash is unset (local dev / CI ephemeral env) or if the
  // backing Redis hiccups; checkRateLimit handles both internally.
  const rl = await checkRateLimit("publicPages", clientIp(request));
  if (!rl.success) {
    return tooManyRequests(rl);
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
    return withRateLimitHeaders(NextResponse.rewrite(new URL(UNKNOWN_HOST, request.url)), rl);
  }

  if (!site) {
    // `/__unknown_host__` is an explicit STATIC route (app/__unknown_host__/
    // page.tsx) that calls notFound(). A static segment outranks the dynamic
    // `(site)/[category]` route, so an unmapped host reliably 404s instead
    // of rendering a category page.
    return withRateLimitHeaders(NextResponse.rewrite(new URL(UNKNOWN_HOST, request.url)), rl);
  }

  // Forward the resolved site on request headers for the render pass.
  const headers = new Headers(request.headers);
  headers.set(SITE_HEADERS.id, site.id);
  headers.set(SITE_HEADERS.slug, site.slug);
  headers.set(SITE_HEADERS.name, site.name);
  headers.set(SITE_HEADERS.archetype, site.archetype);
  headers.set(SITE_HEADERS.domain, site.domain);
  headers.set(SITE_HEADERS.tagline, site.tagline ?? "");

  return withRateLimitHeaders(NextResponse.next({ request: { headers } }), rl);
}
