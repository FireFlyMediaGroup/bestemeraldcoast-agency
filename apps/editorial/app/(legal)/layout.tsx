import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { SiteHeader, SiteFooter, archetypes, themeToCssVars } from "@bec/ui";
import type { Archetype } from "@bec/ui";

import { CookieConsent } from "@/components/cookie-consent";
import { getSiteContext } from "@/lib/site-context";

// (legal)/ route group — ADR-014 legal pages. Sibling to (site)/ so they
// share the same per-request proxy resolution (every legal URL is served
// on a real domain, picking up that domain's archetype theme) but
// deliberately minimal chrome: same SiteHeader + SiteFooter for nav
// continuity, narrow legal-prose measure for readability. The cookie-
// consent banner is mounted here too so a visitor reading the Cookie
// Policy can also re-open / change their consent choice.

function archetypeOf(value: string): Archetype {
  return value === "coastal" || value === "premium" ? value : "magazine";
}

export default async function LegalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const site = await getSiteContext();
  // Same fail-closed posture as (site)/layout — a (legal) request without
  // proxy-resolved site context is a misconfiguration, not "render BEC".
  if (!site) notFound();

  const archetype = archetypeOf(site.archetype);
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

      <main id="main" className="legal-prose">
        {children}
      </main>

      <SiteFooter siteName={site.name} />

      <CookieConsent />
    </div>
  );
}
