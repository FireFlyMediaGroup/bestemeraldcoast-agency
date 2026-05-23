// Article data loaders for the city-site editorial surface.
// Article-level `'use cache'` is parked while cacheComponents is off.
//
// Three loaders here:
//   getArticle(siteId, categorySlug, slug)  — single article (Commit 2.3, /[cat]/[slug])
//   getArticlesByCategory(siteId, ...)       — category index list (Commit 2.11.7)
//   getRecentArticles(siteId, opts)          — homepage feed         (Commit 2.11.7)
//
// All three filter to `status = 'published'`. Drafts never render publicly.

export interface ArticleAuthorView {
  slug: string;
  displayName: string;
  bio: string | null;
  twitter: string | null;
  isAi: boolean;
  isHumanReviewer: boolean;
}

export interface ArticleBusinessView {
  slug: string;
  name: string;
  city: string | null;
  rating: number | null;
  reviewCount: number | null;
  rank: number | null;
}

export interface ArticleImageView {
  blobUrl: string;
  altText: string;
  width: number;
  height: number;
}

export interface ArticleView {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  bodyMdx: string;
  contentType: string;
  tags: string[] | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isSponsored: boolean;
  sponsorshipDisclosure: string | null;
  syndicatedToHub: boolean;
  hubCanonicalOverride: boolean;
  category: { slug: string; name: string };
  author: ArticleAuthorView | null;
  reviewer: ArticleAuthorView | null;
  heroImage: ArticleImageView | null;
  ogImage: ArticleImageView | null;
  businesses: ArticleBusinessView[];
}

export async function getArticle(
  siteId: string,
  categorySlug: string,
  slug: string,
): Promise<ArticleView | null> {
  const { getDb, schema, eq, and, inArray } = await import("@bec/db");
  const db = getDb();

  const [row] = await db
    .select({
      a: schema.articles,
      cSlug: schema.categories.slug,
      cName: schema.categories.name,
    })
    .from(schema.articles)
    .innerJoin(
      schema.categories,
      eq(schema.articles.categoryId, schema.categories.id),
    )
    .where(
      and(
        eq(schema.articles.siteId, siteId),
        eq(schema.articles.slug, slug),
        eq(schema.articles.status, "published"),
        eq(schema.categories.slug, categorySlug),
      ),
    );

  if (!row) return null;
  const a = row.a;

  // Authors (author + reviewer), images (hero + og) — gather by id sets.
  const authorIds = [a.authorId, a.reviewedById].filter(
    (x): x is string => Boolean(x),
  );
  const imageIds = [a.heroImageId, a.ogImageId].filter(
    (x): x is string => Boolean(x),
  );

  const authorRows = authorIds.length
    ? await db
        .select({
          id: schema.authors.id,
          slug: schema.authors.slug,
          displayName: schema.authors.displayName,
          bio: schema.authors.bio,
          twitter: schema.authors.twitter,
          isAi: schema.authors.isAi,
          isHumanReviewer: schema.authors.isHumanReviewer,
        })
        .from(schema.authors)
        .where(inArray(schema.authors.id, authorIds))
    : [];
  const imageRows = imageIds.length
    ? await db
        .select({
          id: schema.images.id,
          blobUrl: schema.images.blobUrl,
          altText: schema.images.altText,
          width: schema.images.width,
          height: schema.images.height,
        })
        .from(schema.images)
        .where(inArray(schema.images.id, imageIds))
    : [];

  const businessRows = await db
    .select({
      slug: schema.businesses.slug,
      name: schema.businesses.name,
      city: schema.businesses.city,
      rating: schema.businesses.rating,
      reviewCount: schema.businesses.reviewCount,
      rank: schema.articleBusinesses.rank,
    })
    .from(schema.articleBusinesses)
    .innerJoin(
      schema.businesses,
      eq(schema.articleBusinesses.businessId, schema.businesses.id),
    )
    .where(eq(schema.articleBusinesses.articleId, a.id));

  const mapAuthor = (id: string | null): ArticleAuthorView | null => {
    if (!id) return null;
    const r = authorRows.find((x) => x.id === id);
    return r
      ? {
          slug: r.slug,
          displayName: r.displayName,
          bio: r.bio,
          twitter: r.twitter,
          isAi: Boolean(r.isAi),
          isHumanReviewer: Boolean(r.isHumanReviewer),
        }
      : null;
  };
  const mapImage = (id: string | null): ArticleImageView | null => {
    if (!id) return null;
    const r = imageRows.find((x) => x.id === id);
    return r
      ? {
          blobUrl: r.blobUrl,
          altText: r.altText,
          width: r.width,
          height: r.height,
        }
      : null;
  };

  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    subtitle: a.subtitle,
    bodyMdx: a.bodyMdx,
    contentType: a.contentType,
    tags: a.tags ?? null,
    publishedAt: a.publishedAt,
    updatedAt: a.updatedAt,
    metaTitle: a.metaTitle,
    metaDescription: a.metaDescription,
    isSponsored: a.isSponsored,
    sponsorshipDisclosure: a.sponsorshipDisclosure,
    syndicatedToHub: Boolean(a.syndicatedToHub),
    hubCanonicalOverride: Boolean(a.hubCanonicalOverride),
    category: { slug: row.cSlug, name: row.cName },
    author: mapAuthor(a.authorId),
    reviewer: mapAuthor(a.reviewedById),
    heroImage: mapImage(a.heroImageId),
    ogImage: mapImage(a.ogImageId),
    businesses: businessRows
      .map((b) => ({
        slug: b.slug,
        name: b.name,
        city: b.city,
        rating: b.rating === null ? null : Number(b.rating),
        reviewCount: b.reviewCount,
        rank: b.rank,
      }))
      .sort((x, y) => (x.rank ?? 1e9) - (y.rank ?? 1e9)),
  };
}

// ───────────────────────────────────────────────────────────────────────
// Article-card list views (Commit 2.11.7 — homepage feed + category index)
// ───────────────────────────────────────────────────────────────────────

/**
 * Compact teaser for ArticleCard. The full ArticleView is heavy (joins
 * authors + images + businesses); list surfaces only need the four
 * fields the card actually renders plus the URL parts (`category.slug`
 * + article `slug`) to build `href`.
 */
export interface ArticleTeaser {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  category: { slug: string; name: string };
  heroImage: { blobUrl: string; altText: string } | null;
}

interface ListOptions {
  /** Hard cap; default 12. Pagination lands later if we ever exceed it. */
  limit?: number;
}

/**
 * Recent published articles across every category on the site —
 * powers the homepage feed (`(site)/page.tsx`). Newest first.
 */
export async function getRecentArticles(
  siteId: string,
  opts: ListOptions = {},
): Promise<ArticleTeaser[]> {
  return queryArticleTeasers(siteId, { ...opts, limit: opts.limit ?? 12 });
}

/**
 * Published articles within a single category — powers the category index
 * (`(site)/[category]/page.tsx`). Returns `null` when the category slug
 * doesn't exist for the site (caller can `notFound()`); otherwise returns
 * an array (possibly empty if no articles yet).
 */
export async function getArticlesByCategory(
  siteId: string,
  categorySlug: string,
  opts: ListOptions = {},
): Promise<{ category: { slug: string; name: string }; articles: ArticleTeaser[] } | null> {
  const { getDb, schema, eq, and } = await import("@bec/db");
  const db = getDb();

  // Confirm the category exists on this site first — a typo in the URL
  // should 404, not render an empty list under a fabricated title.
  const [cat] = await db
    .select({ id: schema.categories.id, slug: schema.categories.slug, name: schema.categories.name })
    .from(schema.categories)
    .where(and(eq(schema.categories.siteId, siteId), eq(schema.categories.slug, categorySlug)));
  if (!cat) return null;

  const articles = await queryArticleTeasers(siteId, {
    limit: opts.limit ?? 24,
    categoryId: cat.id,
  });
  return { category: { slug: cat.slug, name: cat.name }, articles };
}

interface QueryOptions {
  limit: number;
  categoryId?: string;
}

async function queryArticleTeasers(
  siteId: string,
  { limit, categoryId }: QueryOptions,
): Promise<ArticleTeaser[]> {
  const { getDb, schema, eq, and, desc, inArray } = await import("@bec/db");
  const db = getDb();

  const whereClauses = [
    eq(schema.articles.siteId, siteId),
    eq(schema.articles.status, "published"),
  ];
  if (categoryId) whereClauses.push(eq(schema.articles.categoryId, categoryId));

  const rows = await db
    .select({
      id: schema.articles.id,
      slug: schema.articles.slug,
      title: schema.articles.title,
      subtitle: schema.articles.subtitle,
      metaDescription: schema.articles.metaDescription,
      publishedAt: schema.articles.publishedAt,
      heroImageId: schema.articles.heroImageId,
      cSlug: schema.categories.slug,
      cName: schema.categories.name,
    })
    .from(schema.articles)
    .innerJoin(
      schema.categories,
      eq(schema.articles.categoryId, schema.categories.id),
    )
    .where(and(...whereClauses))
    .orderBy(desc(schema.articles.publishedAt))
    .limit(limit);

  // Hydrate hero images in a single batch (avoids N+1).
  const heroIds = rows.map((r) => r.heroImageId).filter((x): x is string => Boolean(x));
  const heroes = heroIds.length
    ? await db
        .select({
          id: schema.images.id,
          blobUrl: schema.images.blobUrl,
          altText: schema.images.altText,
        })
        .from(schema.images)
        .where(inArray(schema.images.id, heroIds))
    : [];

  return rows.map((r) => {
    const hero = r.heroImageId ? heroes.find((h) => h.id === r.heroImageId) : undefined;
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      // Card excerpt prefers the subtitle (the article's own "dek"); falls
      // back to metaDescription. Drop trailing whitespace; cap to ~220 chars
      // so cards stay visually consistent.
      excerpt: truncate(r.subtitle ?? r.metaDescription, 220),
      publishedAt: r.publishedAt,
      category: { slug: r.cSlug, name: r.cName },
      heroImage: hero ? { blobUrl: hero.blobUrl, altText: hero.altText } : null,
    };
  });
}

function truncate(s: string | null, max: number): string | null {
  if (!s) return null;
  const t = s.trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}
