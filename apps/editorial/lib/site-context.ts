// Host → site resolution for the editorial network (ADR-001 host routing,
// ADR-010 per-site canonical, ADR-032 archetype theming).
//
// `proxy.ts` calls `resolveSiteByHost()` on every request and writes the
// resolved context onto request headers; server components read it back via
// `getSiteContext()` (no second DB hit per render). The host→site map is
// cached in Upstash Redis with a 60s TTL so a hot domain costs one Redis
// GET, not a Postgres round-trip, per request.
//
// Build-inert + graceful-degradation, mirroring apps/ops-console/lib/
// ratelimit.ts: @bec/config / @bec/db / @upstash are dynamically imported so
// importing this module doesn't trigger @bec/config's eager parseEnv() at
// `next build`, and a missing Upstash config falls back to a direct DB
// lookup rather than hard-failing (local dev + CI have no Upstash creds).

export interface SiteContext {
  id: string;
  slug: string;
  name: string;
  /** 'magazine' | 'coastal' | 'premium' (ADR-032). */
  archetype: string;
  domain: string;
  tagline: string | null;
}

/** Request-header names proxy.ts writes and server components read back. */
export const SITE_HEADERS = {
  id: "x-bec-site-id",
  slug: "x-bec-site-slug",
  name: "x-bec-site-name",
  archetype: "x-bec-archetype",
  domain: "x-bec-site-domain",
  tagline: "x-bec-site-tagline",
} as const;

const CACHE_PREFIX = "site:host:";
const CACHE_TTL_SECONDS = 60;

/**
 * Normalize a Host / X-Forwarded-Host value to a bare registrable host:
 * lowercase, strip any `:port`, strip a leading `www.`. Returns "" for an
 * empty/garbage input so the caller can 404 deterministically.
 */
export function normalizeHost(raw: string | null | undefined): string {
  if (!raw) return "";
  // X-Forwarded-Host can be a comma list (proxies); take the first.
  const first = raw.split(",")[0]?.trim() ?? "";
  const noPort = first.split(":")[0]?.trim().toLowerCase() ?? "";
  return noPort.startsWith("www.") ? noPort.slice(4) : noPort;
}

let redisCached: import("@upstash/redis").Redis | undefined;
let redisConfigured: boolean | undefined;

async function getRedis(): Promise<import("@upstash/redis").Redis | undefined> {
  if (redisConfigured === false) return undefined;
  if (redisCached) return redisCached;
  const { serverEnv } = await import("@bec/config");
  const url = serverEnv.UPSTASH_REDIS_REST_URL;
  const token = serverEnv.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisConfigured = false;
    return undefined;
  }
  const { Redis } = await import("@upstash/redis");
  redisCached = new Redis({ url, token });
  redisConfigured = true;
  return redisCached;
}

async function lookupSiteInDb(host: string): Promise<SiteContext | null> {
  const { getDb, schema, eq } = await import("@bec/db");
  const db = getDb();
  // Single SELECT — fetch-transport safe (no interactive tx; see PR #36).
  const [row] = await db
    .select({
      id: schema.sites.id,
      slug: schema.sites.slug,
      name: schema.sites.name,
      archetype: schema.sites.archetype,
      domain: schema.sites.domain,
      tagline: schema.sites.tagline,
    })
    .from(schema.sites)
    .where(eq(schema.sites.domain, host));
  return row ?? null;
}

/**
 * Resolve a request host to its site. Upstash cache (60s TTL) in front of a
 * single Postgres SELECT. A negative result is cached too so a flood of
 * requests to an unmapped host can't hammer Postgres.
 *
 * Fail-safe: any Redis error falls through to the DB (logged); a DB error
 * propagates (proxy.ts turns it into a 404 rather than guessing a site).
 */
export async function resolveSiteByHost(
  rawHost: string | null | undefined,
): Promise<SiteContext | null> {
  const host = normalizeHost(rawHost);
  if (!host) return null;

  const redis = await getRedis();
  const cacheKey = CACHE_PREFIX + host;

  if (redis) {
    try {
      const hit = await redis.get<SiteContext | "null">(cacheKey);
      if (hit === "null") return null;
      if (hit) return hit;
    } catch (err) {
      const { logger } = await import("@bec/logger");
      logger.warn({ err, host }, "site-context: Redis GET failed — DB fallback");
    }
  }

  const site = await lookupSiteInDb(host);

  if (redis) {
    try {
      // Cache the negative as the sentinel string "null" (Upstash's get
      // returns null for a missing key, so we can't store JS null directly).
      await redis.set(cacheKey, site ?? "null", { ex: CACHE_TTL_SECONDS });
    } catch (err) {
      const { logger } = await import("@bec/logger");
      logger.warn({ err, host }, "site-context: Redis SET failed — non-fatal");
    }
  }

  return site;
}

/**
 * Read the site context proxy.ts wrote onto the request headers. Server
 * components / layout call this — it never touches the DB or Redis.
 * Returns null if the header is absent (e.g. a route reached without proxy,
 * which should not happen in production but must not throw).
 */
export async function getSiteContext(): Promise<SiteContext | null> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const id = h.get(SITE_HEADERS.id);
  const slug = h.get(SITE_HEADERS.slug);
  if (!id || !slug) return null;
  return {
    id,
    slug,
    name: h.get(SITE_HEADERS.name) ?? slug,
    archetype: h.get(SITE_HEADERS.archetype) ?? "magazine",
    domain: h.get(SITE_HEADERS.domain) ?? "",
    tagline: h.get(SITE_HEADERS.tagline) || null,
  };
}
