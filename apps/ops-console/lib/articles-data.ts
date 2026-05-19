// Server-only reads for the operator editorial composer (Commit 2.7).
// Authenticated operator surface — reads via @bec/db directly (Server
// Components / server actions), NOT the Bearer agent API. @bec/db is
// dynamically imported so `next build` never triggers @bec/config's eager
// parseEnv() (the Commit-1.4 build-inertness lesson).

import type { ArticleStatus } from "./article-transitions.js";

export interface ArticleListRow {
  id: string;
  title: string;
  siteName: string;
  categoryName: string | null;
  status: ArticleStatus;
  isSponsored: boolean;
  updatedAt: Date | null;
}

export interface ComposerBusiness {
  id: string;
  name: string;
  city: string | null;
  /** Present + ordered when the business is linked to this article. */
  rank: number | null;
  linked: boolean;
}

export interface ComposerImage {
  id: string;
  altText: string;
  blobUrl: string;
}

export interface ComposerCategory {
  id: string;
  name: string;
}

export interface ArticleForEdit {
  id: string;
  siteId: string;
  siteName: string;
  slug: string;
  title: string;
  subtitle: string | null;
  bodyMdx: string;
  status: ArticleStatus;
  isSponsored: boolean;
  categoryId: string | null;
  heroImageId: string | null;
  categories: ComposerCategory[];
  images: ComposerImage[];
  /** All site businesses, with linked ones flagged + ranked (the linker). */
  businesses: ComposerBusiness[];
}

export async function listArticles(
  status?: ArticleStatus,
): Promise<ArticleListRow[]> {
  const { getDb, schema, eq, desc } = await import("@bec/db");
  const db = getDb();
  const rows = await db
    .select({
      id: schema.articles.id,
      title: schema.articles.title,
      siteName: schema.sites.name,
      categoryName: schema.categories.name,
      status: schema.articles.status,
      isSponsored: schema.articles.isSponsored,
      updatedAt: schema.articles.updatedAt,
    })
    .from(schema.articles)
    .innerJoin(schema.sites, eq(schema.articles.siteId, schema.sites.id))
    .leftJoin(
      schema.categories,
      eq(schema.articles.categoryId, schema.categories.id),
    )
    .where(status ? eq(schema.articles.status, status) : undefined)
    .orderBy(desc(schema.articles.updatedAt));
  return rows.map((r) => ({
    ...r,
    status: r.status as ArticleStatus,
    isSponsored: Boolean(r.isSponsored),
  }));
}

export async function getArticleForEdit(
  id: string,
): Promise<ArticleForEdit | null> {
  const { getDb, schema, eq, and } = await import("@bec/db");
  const db = getDb();

  const [a] = await db
    .select({
      id: schema.articles.id,
      siteId: schema.articles.siteId,
      siteName: schema.sites.name,
      slug: schema.articles.slug,
      title: schema.articles.title,
      subtitle: schema.articles.subtitle,
      bodyMdx: schema.articles.bodyMdx,
      status: schema.articles.status,
      isSponsored: schema.articles.isSponsored,
      categoryId: schema.articles.categoryId,
      heroImageId: schema.articles.heroImageId,
    })
    .from(schema.articles)
    .innerJoin(schema.sites, eq(schema.articles.siteId, schema.sites.id))
    .where(eq(schema.articles.id, id));
  if (!a) return null;

  const [cats, imgs, linked, siteBiz] = await Promise.all([
    db
      .select({ id: schema.categories.id, name: schema.categories.name })
      .from(schema.categories)
      .where(eq(schema.categories.siteId, a.siteId)),
    db
      .select({
        id: schema.images.id,
        altText: schema.images.altText,
        blobUrl: schema.images.blobUrl,
      })
      .from(schema.images),
    db
      .select({
        businessId: schema.articleBusinesses.businessId,
        rank: schema.articleBusinesses.rank,
      })
      .from(schema.articleBusinesses)
      .where(eq(schema.articleBusinesses.articleId, id)),
    db
      .select({
        id: schema.businesses.id,
        name: schema.businesses.name,
        city: schema.businesses.city,
      })
      .from(schema.businesses)
      .where(
        and(
          eq(schema.businesses.primarySiteId, a.siteId),
          eq(schema.businesses.delistedFromEditorial, false),
        ),
      ),
  ]);

  const linkRank = new Map(linked.map((l) => [l.businessId, l.rank]));
  const businesses: ComposerBusiness[] = siteBiz
    .map((b) => ({
      id: b.id,
      name: b.name,
      city: b.city,
      rank: linkRank.get(b.id) ?? null,
      linked: linkRank.has(b.id),
    }))
    .sort((x, y) => {
      if (x.linked !== y.linked) return x.linked ? -1 : 1;
      return (x.rank ?? 1e9) - (y.rank ?? 1e9);
    });

  return {
    id: a.id,
    siteId: a.siteId,
    siteName: a.siteName,
    slug: a.slug,
    title: a.title,
    subtitle: a.subtitle,
    bodyMdx: a.bodyMdx,
    status: a.status as ArticleStatus,
    isSponsored: Boolean(a.isSponsored),
    categoryId: a.categoryId,
    heroImageId: a.heroImageId,
    categories: cats,
    images: imgs,
    businesses,
  };
}
