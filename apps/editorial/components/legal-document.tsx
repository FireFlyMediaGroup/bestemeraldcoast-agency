import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getEditorialLegalPage } from "@/lib/legal";
import { renderMarkdown } from "@/lib/markdown";
import { getSiteContext } from "@/lib/site-context";

export async function legalMetadata(slug: string): Promise<Metadata> {
  const site = await getSiteContext();
  const legal = getEditorialLegalPage(slug);
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

export async function LegalDocument({ slug }: { slug: string }) {
  const legal = getEditorialLegalPage(slug);
  if (!legal) notFound();

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
