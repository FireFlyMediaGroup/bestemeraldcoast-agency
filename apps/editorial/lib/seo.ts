// Per-domain robots.txt + sitemap.xml builders (ADR-009). The robots text
// is pure (unit-testable — the real local gate). The sitemap reads the DB
// for the resolved site only; with no content seeded yet it still emits a
// valid sitemap of the known static + category routes (correct, not a
// failure — articles arrive from the Editor agent, Commit 2.6).

export interface SiteRef {
  id: string;
  domain: string;
}

// Slugs match the canonical ADR-014 page list in `@bec/content/legal` and
// the SiteFooter DEFAULT_LINKS order — keep these three lists aligned.
const STATIC_PATHS = [
  "/",
  "/events",
  "/privacy",
  "/terms",
  "/advertiser-disclosure",
  "/cookie-policy",
  "/editorial-standards",
];

/**
 * ADR-009 robots.txt — disallow the non-public surfaces, allow the rest,
 * reference this domain's sitemap. (ops-console's `Disallow: /` global is
 * that app's concern, not the editorial sites.)
 */
export function buildRobotsTxt(domain: string): string {
  return [
    "User-agent: *",
    "Disallow: /api/",
    "Disallow: /m/",
    "Disallow: /admin/",
    "Disallow: /preview/",
    "Allow: /",
    "",
    `Sitemap: https://${domain}/sitemap.xml`,
    "",
  ].join("\n");
}

interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderSitemapXml(domain: string, entries: SitemapEntry[]): string {
  const urls = entries
    .map((e) => {
      const loc = `<loc>${xmlEscape(`https://${domain}${e.loc}`)}</loc>`;
      const lm = e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : "";
      return `  <url>${loc}${lm}</url>`;
    })
    .join("\n");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>\n`
  );
}

/** Collect every public URL for one domain: static + categories + published
 *  articles + listable businesses + events. Absolute, deduped, stable order. */
export async function buildSitemapXml(site: SiteRef): Promise<string> {
  const { getDb, schema, eq, and } = await import("@bec/db");
  const db = getDb();

  const entries: SitemapEntry[] = STATIC_PATHS.map((p) => ({ loc: p }));

  // The four content reads are independent — run them concurrently so a
  // sitemap request is one round-trip's latency, not four serialized.
  const [cats, articleRows, bizRows, eventRows] = await Promise.all([
    db
      .select({ slug: schema.categories.slug })
      .from(schema.categories)
      .where(eq(schema.categories.siteId, site.id)),
    db
      .select({
        slug: schema.articles.slug,
        catSlug: schema.categories.slug,
        updatedAt: schema.articles.updatedAt,
        publishedAt: schema.articles.publishedAt,
      })
      .from(schema.articles)
      .innerJoin(
        schema.categories,
        eq(schema.articles.categoryId, schema.categories.id),
      )
      .where(
        and(
          eq(schema.articles.siteId, site.id),
          eq(schema.articles.status, "published"),
        ),
      ),
    db
      .select({ slug: schema.businesses.slug })
      .from(schema.businesses)
      .where(
        and(
          eq(schema.businesses.primarySiteId, site.id),
          eq(schema.businesses.delistedFromEditorial, false),
        ),
      ),
    db
      .select({
        slug: schema.events.slug,
        updatedAt: schema.events.updatedAt,
      })
      .from(schema.events)
      .where(eq(schema.events.siteId, site.id)),
  ]);

  for (const c of cats) entries.push({ loc: `/${c.slug}` });
  for (const a of articleRows) {
    const d = a.updatedAt ?? a.publishedAt;
    entries.push({
      loc: `/${a.catSlug}/${a.slug}`,
      lastmod: d ? d.toISOString() : undefined,
    });
  }
  for (const b of bizRows) entries.push({ loc: `/businesses/${b.slug}` });
  for (const ev of eventRows) {
    entries.push({
      loc: `/events/${ev.slug}`,
      lastmod: ev.updatedAt ? ev.updatedAt.toISOString() : undefined,
    });
  }

  // Dedupe by loc, stable insertion order.
  const seen = new Set<string>();
  const deduped = entries.filter((e) =>
    seen.has(e.loc) ? false : (seen.add(e.loc), true),
  );

  return renderSitemapXml(site.domain, deduped);
}
