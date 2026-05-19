// Article data loader for the city-site article route (Commit 2.3).
//
// Cache Components: this is a `'use cache'` function keyed purely by its
// args (siteId, categorySlug, slug) — it reads NO request APIs, so it is
// safely cacheable. `cacheTag` lets the Editor/composer revalidate a single
// article on publish (`revalidateTag('article:<siteId>:<slug>')`, Commit
// 2.7). Only `published` articles are ever returned (drafts/scheduled are
// invisible to the public site). A URL whose `category` segment doesn't
// match the article's real category resolves to null → the page 404s
// (no soft-canonical guessing).

import { cacheLife, cacheTag } from "next/cache";

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
  "use cache";
  cacheTag(`article:${siteId}:${slug}`);
  cacheLife("hours");

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
