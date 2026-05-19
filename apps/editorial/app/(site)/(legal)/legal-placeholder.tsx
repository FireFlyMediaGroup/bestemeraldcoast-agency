// Legal pages are placeholders in the Commit 2.1 shell. The prompt specifies
// MDX pages sourced from `packages/content/legal/` per ADR-014 — that
// package + the real five documents (Privacy, Terms, Disclosure, Cookie
// Policy, Editorial Standards) and the cookie-consent banner are Commit
// 2.10. These routes exist now so the footer nav, sitemap surface, and the
// (legal) route group are real for the 8-domain shell; 2.10 swaps the body
// for MDX without changing the routes.

import { PageShell } from "@/components/page-shell";

export function LegalPlaceholder({ title }: { title: string }) {
  return (
    <PageShell kicker="Legal" title={title}>
      <p>
        The full {title} document is published in Commit 2.10 (ADR-014). This
        route is part of the editorial shell so the legal section, footer
        navigation, and sitemap are correct across all 8 domains today.
      </p>
    </PageShell>
  );
}
