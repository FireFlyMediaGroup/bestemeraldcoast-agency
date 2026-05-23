// Category index (Commit 2.11.7). Replaces the 2.1 placeholder
// ("Category index shell. Article cards land in Commit 2.2." — a TODO
// 2.2 never actually got to; 2.2 shipped theme tokens, not the content
// surface).
//
// Lists published articles in the resolved category, newest first.
// 404 when the category slug doesn't exist on this site (no fabricated
// titles, no soft-canonical guessing — same posture as the article-detail
// page). Legal-slug guard kept from the placeholder so a URL like
// `/privacy` doesn't fall into this dynamic route.

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleFeed } from "@/components/article-feed";
import { PageShell } from "@/components/page-shell";
import { getArticlesByCategory } from "@/lib/article";
import { isLegalSlug } from "@/lib/legal";
import { getSiteContext } from "@/lib/site-context";

type Params = Promise<{ category: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const site = await getSiteContext();
  const { category } = await params;
  if (!site || isLegalSlug(category)) {
    return { title: "Not found", robots: { index: false, follow: false } };
  }
  const data = await getArticlesByCategory(site.id, category, { limit: 1 });
  if (!data) {
    return { title: "Not found", robots: { index: false, follow: false } };
  }
  return {
    title: data.category.name,
    description: `${data.category.name} stories from ${site.name}.`,
    alternates: { canonical: `/${data.category.slug}` },
    openGraph: {
      type: "website",
      title: data.category.name,
      url: `https://${site.domain}/${data.category.slug}`,
      siteName: site.name,
    },
  };
}

export default async function CategoryIndexPage({ params }: { params: Params }) {
  const site = await getSiteContext();
  if (!site) notFound();
  const { category } = await params;
  if (isLegalSlug(category)) notFound();

  const data = await getArticlesByCategory(site.id, category, { limit: 24 });
  if (!data) notFound();

  return (
    <PageShell kicker="Category" title={data.category.name}>
      <ArticleFeed
        articles={data.articles}
        headingLevel={2}
        emptyCopy={`No ${data.category.name.toLowerCase()} stories yet. Our editors are working on them — check back soon.`}
      />
    </PageShell>
  );
}
