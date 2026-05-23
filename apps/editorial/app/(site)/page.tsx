// Per-site homepage (Commit 2.11.7).
//
// Renders the site dek + a recent-articles feed (newest first, all
// categories). Pre-2.11.7 this was a placeholder shell that hard-coded
// "real content arrives in Phase 2 (Commits 2.2-2.5)" — Commit 2.2 only
// shipped the theme tokens, not the content surface, so the homepage was
// dead until now.
//
// Empty state copy carries the editorial voice for the site (the
// `(site)/layout.tsx` SiteLayout already 404s if no site context is
// resolved, so we can rely on `site` being truthy here).

import { ArticleFeed } from "@/components/article-feed";
import { PageShell } from "@/components/page-shell";
import { getRecentArticles } from "@/lib/article";
import { getSiteContext } from "@/lib/site-context";

export default async function HomePage() {
  const site = await getSiteContext();
  // SiteLayout 404s if !site; this branch is for the type narrow.
  if (!site) {
    return (
      <PageShell kicker="Local guide" title="Best Emerald Coast">
        <p>Loading…</p>
      </PageShell>
    );
  }

  const articles = await getRecentArticles(site.id, { limit: 12 });

  return (
    <PageShell kicker={site.tagline ?? "Local guide"} title={site.name}>
      <ArticleFeed
        articles={articles}
        headingLevel={2}
        emptyCopy={`Articles for ${site.name} are being lined up. Check back soon — local guides and editorial land here as our writers and editors finish them.`}
      />
    </PageShell>
  );
}
