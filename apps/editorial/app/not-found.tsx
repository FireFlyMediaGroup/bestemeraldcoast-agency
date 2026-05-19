// Renders for any unmatched route AND for the unmapped-host case (proxy.ts
// rewrites an unknown host to a no-route path → this, with HTTP 404). We
// never substitute a default site for an unknown host. Rendered through the
// minimal static root layout (no site chrome) — correct, since there is no
// site here.

import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <PageShell kicker="404" title="Page not found">
      <p>That page doesn’t exist, or this domain isn’t part of the network.</p>
      <p>
        <a data-bec-tap href="/" style={{ color: "var(--bec-color-primary)" }}>
          Go to the homepage
        </a>
      </p>
    </PageShell>
  );
}
