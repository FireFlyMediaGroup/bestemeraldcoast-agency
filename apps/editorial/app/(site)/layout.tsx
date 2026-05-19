import { notFound } from "next/navigation";

import { getSiteContext } from "@/lib/site-context";

// Per-site chrome. This layout wraps only real, request-time routes — never
// Next's internal `_not-found` / `_global-error` (those use the minimal
// static root layout). It is therefore safe to be async and read the
// resolved site from request headers here.

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const site = await getSiteContext();
  // Fail closed: a (site) route reached without resolved site context means
  // proxy.ts didn't run / headers are absent — that's a misconfiguration,
  // not "render Best Emerald Coast". Never guess a tenant (host-routing
  // no-guessing contract); 404 instead.
  if (!site) notFound();
  const siteName = site.name;

  return (
    // `data-archetype` is the seam Commit 2.2 keys per-site theme-token
    // injection off of; the shell ships no hardcoded palette (globals.css
    // inherits @bec/ui's default Magazine variables).
    <div data-archetype={site.archetype}>
      <a href="#main" className="bec-skip-link">
        Skip to content
      </a>
      <header
        style={{
          borderBottom: "1px solid var(--bec-color-border)",
          padding: "1rem clamp(1rem, 4vw, 2rem)",
        }}
      >
        <nav aria-label="Primary">
          <a
            href="/"
            data-bec-tap
            style={{
              fontWeight: 700,
              fontSize: "1.125rem",
              color: "var(--bec-color-foreground)",
              textDecoration: "none",
            }}
          >
            {siteName}
          </a>
        </nav>
      </header>

      <main
        id="main"
        style={{
          maxInlineSize: "var(--bec-measure)",
          marginInline: "auto",
          padding: "clamp(1.5rem, 5vw, 3rem) clamp(1rem, 4vw, 2rem)",
        }}
      >
        {children}
      </main>

      <footer
        style={{
          borderTop: "1px solid var(--bec-color-border)",
          padding: "2rem clamp(1rem, 4vw, 2rem)",
          color: "var(--bec-color-muted-fg)",
          fontSize: "0.875rem",
        }}
      >
        <nav
          aria-label="Legal"
          style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}
        >
          <a data-bec-tap href="/privacy" style={{ color: "inherit" }}>Privacy</a>
          <a data-bec-tap href="/terms" style={{ color: "inherit" }}>Terms</a>
          <a data-bec-tap href="/disclosure" style={{ color: "inherit" }}>Disclosure</a>
          <a data-bec-tap href="/cookies" style={{ color: "inherit" }}>Cookies</a>
          <a data-bec-tap href="/editorial-standards" style={{ color: "inherit" }}>
            Editorial Standards
          </a>
        </nav>
        <p style={{ marginBlockStart: "1rem" }}>
          © {new Date().getFullYear()} {siteName}.
        </p>
      </footer>
    </div>
  );
}
