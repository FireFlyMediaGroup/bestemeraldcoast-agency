import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleLayout, BreadcrumbNav, BusinessCard } from "@bec/ui";

import { getArticle } from "@/lib/article";
import { getSiteContext } from "@/lib/site-context";
import {
  articleJsonLd,
  articleUrl,
  breadcrumbJsonLd,
  jsonLdScript,
  localBusinessJsonLd,
  type SiteInfo,
} from "@/lib/structured-data";

type Params = Promise<{ category: string; slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const site = await getSiteContext();
  const { category, slug } = await params;
  if (!site) return { title: "Not found", robots: { index: false, follow: false } };

  const article = await getArticle(site.id, category, slug);
  if (!article) {
    return { title: "Not found", robots: { index: false, follow: false } };
  }

  const canonical = articleUrl(site.domain, category, slug);
  const title = article.metaTitle ?? article.title;
  const description =
    article.metaDescription ?? article.subtitle ?? article.title;
  const ogImg = article.ogImage ?? article.heroImage;

  return {
    title,
    description,
    // ADR-010: the city site is always its own canonical. (Serving the hub
    // domain, a *syndicated* copy should point back to the origin city;
    // that needs the origin-city URL and is part of hub-syndication
    // rendering — tracked for when the hub ships. City sites — the 2.3
    // acceptance target — are correct here.)
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      siteName: site.name,
      ...(ogImg ? { images: [{ url: ogImg.blobUrl, alt: ogImg.altText }] } : {}),
      ...(article.publishedAt
        ? { publishedTime: article.publishedAt.toISOString() }
        : {}),
    },
    twitter: {
      card: ogImg ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImg ? { images: [ogImg.blobUrl] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const site = await getSiteContext();
  if (!site) notFound();
  const { category, slug } = await params;

  const article = await getArticle(site.id, category, slug);
  if (!article) notFound();

  const siteInfo: SiteInfo = { name: site.name, domain: site.domain };

  const crumbs = [
    { name: "Home", url: `https://${site.domain}/` },
    {
      name: article.category.name,
      url: `https://${site.domain}/${article.category.slug}`,
    },
    { name: article.title },
  ];

  // ADR-027 — AI authorship + human reviewer byline.
  const byline = (
    <span>
      {article.author?.isAi
        ? "Drafted with AI assistance"
        : article.author
          ? `By ${article.author.displayName}`
          : null}
      {article.reviewer ? (
        <>
          {article.author ? ", edited by " : "Edited by "}
          <a
            href={`/authors/${article.reviewer.slug}`}
            style={{ color: "var(--bec-color-primary)" }}
          >
            {article.reviewer.displayName}
          </a>
        </>
      ) : null}
      {article.publishedAt ? (
        <>
          {" · "}
          <time dateTime={article.publishedAt.toISOString()}>
            {article.publishedAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </>
      ) : null}
    </span>
  );

  const paragraphs = article.bodyMdx.split(/\n{2,}/).filter((p) => p.trim());

  return (
    <>
      {/* ADR-009 structured data — Article + BreadcrumbList + one
          LocalBusiness per referenced business. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(articleJsonLd(article, siteInfo)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(breadcrumbJsonLd(crumbs)),
        }}
      />
      {article.businesses.map((b) => (
        <script
          key={b.slug}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(localBusinessJsonLd(b, siteInfo)),
          }}
        />
      ))}

      <ArticleLayout
        kicker={article.category.name}
        title={article.title}
        breadcrumb={
          <BreadcrumbNav
            items={[
              { label: "Home", href: "/" },
              { label: article.category.name, href: `/${article.category.slug}` },
              { label: article.title },
            ]}
          />
        }
        byline={byline}
        hero={
          article.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- editorial supplies optimized blob URLs; ADR-022 guarantees altText.
            <img
              src={article.heroImage.blobUrl}
              alt={article.heroImage.altText}
              width={article.heroImage.width}
              height={article.heroImage.height}
              style={{ width: "100%", height: "auto", borderRadius: "var(--bec-radius-lg)" }}
            />
          ) : undefined
        }
      >
        {article.isSponsored ? (
          // ADR-015 — FTC sponsored disclosure, above the content.
          <aside
            role="note"
            style={{
              border: "1px solid var(--bec-color-border)",
              background: "var(--bec-color-muted)",
              color: "var(--bec-color-foreground)",
              borderRadius: "var(--bec-radius-md)",
              padding: "0.75rem 1rem",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
            }}
          >
            <strong>Sponsored.</strong>{" "}
            {article.sponsorshipDisclosure ??
              "This article is paid content. It was produced for an advertiser and may not reflect the views of the editorial team."}
          </aside>
        ) : null}

        {article.subtitle ? (
          <p style={{ fontSize: "1.125rem", color: "var(--bec-color-muted-fg)" }}>
            {article.subtitle}
          </p>
        ) : null}

        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}

        {article.businesses.length ? (
          <section style={{ marginBlockStart: "var(--bec-section-gap)" }}>
            <h2>Featured businesses</h2>
            <div style={{ display: "grid", gap: "1rem" }}>
              {article.businesses.map((b) => (
                <BusinessCard
                  key={b.slug}
                  name={b.name}
                  href={`/businesses/${b.slug}`}
                  rating={b.rating ?? undefined}
                  reviewCount={b.reviewCount ?? undefined}
                  address={b.city ?? undefined}
                  headingLevel={3}
                />
              ))}
            </div>
          </section>
        ) : null}
      </ArticleLayout>
    </>
  );
}
