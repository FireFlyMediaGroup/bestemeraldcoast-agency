// Pure JSON-LD builders (ADR-009 structured data). No React, no I/O — these
// are unit-testable and are the real local correctness gate for Commit 2.3
// (full render is deploy-gated; the shapes are not). Google Rich Results
// validates Article + BreadcrumbList + LocalBusiness.

import type { ArticleView } from "./article.js";

export interface SiteInfo {
  name: string;
  domain: string;
}

type JsonLd = Record<string, unknown>;

function abs(domain: string, path: string): string {
  return `https://${domain}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Canonical city URL for an article (ADR-010: the city site is canonical). */
export function articleUrl(
  domain: string,
  categorySlug: string,
  slug: string,
): string {
  return abs(domain, `/${categorySlug}/${slug}`);
}

export function articleJsonLd(a: ArticleView, site: SiteInfo): JsonLd {
  const url = articleUrl(site.domain, a.category.slug, a.slug);
  const ld: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.metaDescription ?? a.subtitle ?? a.title,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    isAccessibleForFree: true,
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: abs(site.domain, "/"),
    },
  };
  if (a.publishedAt) ld.datePublished = a.publishedAt.toISOString();
  if (a.updatedAt) ld.dateModified = a.updatedAt.toISOString();
  if (a.heroImage) ld.image = [a.heroImage.blobUrl];
  // ADR-027: the AI is the author; the human is the reviewer/editor. Both
  // are surfaced so the byline and the structured data agree.
  //
  // Google Rich Results requires Article.author. Schema.org accepts Person
  // OR Organization. If no specific author row is attached, fall back to
  // the publisher (the network Organization) — semantically: "this article
  // is by the publication itself." The visible byline (article-page.tsx)
  // is unaffected by this fallback; that still gates on `a.author` and
  // shows nothing when no Person is attached, which is correct for the
  // generic-byline case.
  if (a.author) {
    ld.author = {
      "@type": "Person",
      name: a.author.displayName,
      url: abs(site.domain, `/authors/${a.author.slug}`),
    };
  } else {
    ld.author = {
      "@type": "Organization",
      name: site.name,
      url: abs(site.domain, "/"),
    };
  }
  if (a.reviewer) {
    ld.editor = {
      "@type": "Person",
      name: a.reviewer.displayName,
      url: abs(site.domain, `/authors/${a.reviewer.slug}`),
    };
  }
  if (a.tags && a.tags.length) ld.keywords = a.tags.join(", ");
  return ld;
}

export interface Crumb {
  name: string;
  /** Absolute URL; omit on the current page. */
  url?: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.url ? { item: c.url } : {}),
    })),
  };
}

export function localBusinessJsonLd(
  b: ArticleView["businesses"][number],
  site: SiteInfo,
): JsonLd {
  const ld: JsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: b.name,
    url: abs(site.domain, `/businesses/${b.slug}`),
  };
  if (b.city) ld.address = { "@type": "PostalAddress", addressLocality: b.city };
  if (b.rating !== null) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: b.rating,
      ...(b.reviewCount !== null ? { reviewCount: b.reviewCount } : {}),
    };
  }
  return ld;
}

/**
 * Network-level Organization schema for the publisher. Identical across every
 * domain — Best Emerald Coast is the publisher behind all 8 sites. Per
 * ADR-031 / ADR-014 publisher disclosure: the brand is the network.
 */
export function organizationJsonLd(site: SiteInfo): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://bestemeraldcoast.com/#organization",
    name: "Best Emerald Coast",
    alternateName: site.name,
    url: "https://bestemeraldcoast.com/",
    logo: "https://bestemeraldcoast.com/opengraph-image",
  };
}

/**
 * Per-domain WebSite schema. Surfaces in Google Rich Results as a sitelinks
 * search box once the site has enough pages indexed. `potentialAction`
 * points at the per-domain (future) /search endpoint — when /search lands,
 * Google starts rendering an inline search box on SERP. Until then it is
 * harmless + forward-compatible. The `@id` is per-domain so Google can
 * disambiguate across the 8 sites.
 */
export function websiteJsonLd(site: SiteInfo): JsonLd {
  const url = abs(site.domain, "/");
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}#website`,
    name: site.name,
    url,
    publisher: { "@id": "https://bestemeraldcoast.com/#organization" },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: abs(site.domain, "/search?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Serialize a JSON-LD object for safe embedding inside a
 * `<script type="application/ld+json">`. `<` / `>` / `&` are unicode-escaped
 * so document-sourced strings can never break out of the script element or
 * inject markup (the standard JSON-LD hardening).
 */
export function jsonLdScript(data: JsonLd): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
