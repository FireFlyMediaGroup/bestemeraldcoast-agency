import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { SiteHeader, SiteFooter, archetypes, themeToCssVars } from "@bec/ui";
import type { Archetype } from "@bec/ui";

import { CookieConsent } from "@/components/cookie-consent";
import { getSiteContext } from "@/lib/site-context";
import {
  jsonLdScript,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/structured-data";

// Per-site chrome. This layout wraps only real, request-time routes — never
// Next's internal `_not-found` / `_global-error` (those use the minimal
// static root layout). It is therefore safe to be async and read the
// resolved site from request headers here.
//
// Commit 2.2 theme wiring: ADR-032 says per-site tokens are injected inline
// for the request's site. The static root `<html>` can't do that (Commit
// 2.1: root must stay static so Next's internal pages build), so the
// resolved theme's `--bec-*` variables are injected on THIS (site) wrapper
// instead — same effect (per-request theming), required by 2.1's
// architecture, not an ADR change. Source of the SiteTheme is currently the
// canonical archetype set (== what seed.ts wrote to `sites.themeTokens`);
// when per-site token tuning lands, swap the source to the resolved DB row
// (it isn't carried on the proxy headers today — the full themeTokens JSON
// is too large for a request header).

function archetypeOf(value: string): Archetype {
  return value === "coastal" || value === "premium" ? value : "magazine";
}

/**
 * Per-domain default metadata for every (site) route. Child pages
 * (article, category, legal) `generateMetadata` overrides specific fields
 * (their own title / description / canonical / OG image). Setting the
 * defaults here covers the homepage and any future shell page without
 * each one repeating itself.
 *
 * ADR-009 / ADR-010 / Phase-2 gate Box 7 ("Sitemap, robots, OG, JSON-LD
 * all validate via Google Rich Results Test"). Until this commit (2.11.6)
 * the network shipped per-article metadata but no per-shell-page OG /
 * canonical — share previews were bare URLs and the homepage didn't
 * validate.
 */
export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContext();
  if (!site) {
    // Reaching the (site) layout without resolved context is a proxy
    // misconfiguration (defaulted in SiteLayout's notFound() below). Return
    // the safe-default network branding so any stray render still has
    // sane OG.
    return {
      title: "Best Emerald Coast",
      description: "Local guides and editorial across the Emerald Coast network.",
    };
  }
  const homeUrl = `https://${site.domain}/`;
  const description = site.tagline ?? `${site.name} — local guides + editorial for the Emerald Coast.`;
  return {
    metadataBase: new URL(homeUrl),
    title: {
      default: site.name,
      // Article pages set their own `title` which replaces this default.
      // The template wraps any other titled child (legal, business, etc.).
      template: `%s · ${site.name}`,
    },
    description,
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: site.name,
      description,
      url: homeUrl,
      // Resolves to /opengraph-image on the same origin (the root OG image
      // route below). `metadataBase` makes the relative URL absolute.
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: site.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: site.name,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const site = await getSiteContext();
  // Fail closed: a (site) route reached without resolved site context means
  // proxy.ts didn't run / headers are absent — that's a misconfiguration,
  // not "render Best Emerald Coast". Never guess a tenant; 404 instead.
  if (!site) notFound();

  const archetype = archetypeOf(site.archetype);
  // `--bec-*` custom properties for this site. React's CSSProperties type
  // doesn't model custom props; the cast is the standard escape hatch.
  const themeVars = themeToCssVars(archetypes[archetype]) as CSSProperties;

  const siteInfo = { name: site.name, domain: site.domain };

  return (
    <div
      className={`archetype-${archetype}`}
      style={themeVars}
      data-archetype={archetype}
    >
      {/*
        ADR-009 structured data — every (site) route emits the publisher
        Organization + the per-domain WebSite schemas. Article pages add
        Article + BreadcrumbList on top of these (Commit 2.3). Both are
        idempotent — Google de-duplicates by `@id`.
      */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd(siteInfo)) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLdScript(websiteJsonLd(siteInfo)) }}
      />

      <a href="#main" className="bec-skip-link">
        Skip to content
      </a>

      <SiteHeader siteName={site.name} />

      <main
        id="main"
        className="mx-auto"
        style={{
          maxInlineSize: "var(--bec-content-max-width)",
          padding: "clamp(1.5rem, 5vw, 3rem) clamp(1rem, 4vw, 2rem)",
        }}
      >
        {children}
      </main>

      <SiteFooter siteName={site.name} />

      <CookieConsent />
    </div>
  );
}
