import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getEditorialLegalPage, listLegalPages } from "@/lib/legal";
import { renderMarkdown } from "@/lib/markdown";
import { getSiteContext } from "@/lib/site-context";

type Params = Promise<{ page: string }>;

// ADR-014 legal pages render statically at build for the 5 known slugs.
// An unknown slug falls through to notFound() (Next will not serve a
// static path for it; dynamic routing returns 404).
export function generateStaticParams() {
  return listLegalPages().map((p) => ({ page: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { page } = await params;
  const site = await getSiteContext();
  const legal = getEditorialLegalPage(page);
  if (!legal || !site) {
    return { title: "Not found", robots: { index: false, follow: false } };
  }
  const canonical = `https://${site.domain}/${legal.slug}`;
  return {
    title: legal.title,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      title: legal.title,
      url: canonical,
      siteName: site.name,
    },
  };
}

export default async function LegalPage({ params }: { params: Params }) {
  const { page } = await params;
  const legal = getEditorialLegalPage(page);
  if (!legal) notFound();

  // The markdown content already starts with an `# Heading` line; the
  // renderer outputs the page <h1> so we don't double-render the title.
  return (
    <article>
      {renderMarkdown(legal.content)}
      <hr />
      <p className="legal-meta">
        Last updated:{" "}
        <time dateTime={legal.updatedAt}>
          {new Date(legal.updatedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </p>
    </article>
  );
}
