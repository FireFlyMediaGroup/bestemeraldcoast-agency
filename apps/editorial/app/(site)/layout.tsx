import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { SiteHeader, SiteFooter, archetypes, themeToCssVars } from "@bec/ui";
import type { Archetype } from "@bec/ui";

import { CookieConsent } from "@/components/cookie-consent";
import { getSiteContext } from "@/lib/site-context";

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

  return (
    <div
      className={`archetype-${archetype}`}
      style={themeVars}
      data-archetype={archetype}
    >
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
