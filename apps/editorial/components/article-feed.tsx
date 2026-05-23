// Article-card grid used by the homepage feed + the category index
// (Commit 2.11.7). One component so both surfaces share spacing + heading
// hierarchy + empty-state copy.

import { ArticleCard } from "@bec/ui";

import type { ArticleTeaser } from "@/lib/article";

interface ArticleFeedProps {
  articles: ArticleTeaser[];
  /** Heading level for each card title. Default 2 (cards on category index / homepage). */
  headingLevel?: 2 | 3 | 4;
  /** Per-archetype empty-state copy. Default is generic. */
  emptyCopy?: string;
}

export function ArticleFeed({ articles, headingLevel = 2, emptyCopy }: ArticleFeedProps) {
  if (articles.length === 0) {
    return (
      <p
        style={{
          color: "var(--bec-color-muted-fg)",
          fontStyle: "italic",
          marginTop: "1.5rem",
        }}
      >
        {emptyCopy ?? "No articles yet. Check back soon — fresh local guides land here as they publish."}
      </p>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "clamp(1.25rem, 3vw, 2rem)",
        // Single column under 640px (mobile-first per ADR-006/024/029); two
        // columns by the time desktop chrome shows up. Hero aspect ratio
        // honoured by the card image itself.
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 22rem), 1fr))",
        marginTop: "clamp(1.5rem, 4vw, 2.5rem)",
      }}
    >
      {articles.map((a) => (
        <ArticleCard
          key={a.id}
          href={`/${a.category.slug}/${a.slug}`}
          title={a.title}
          excerpt={a.excerpt ?? undefined}
          kicker={a.category.name}
          imageUrl={a.heroImage?.blobUrl}
          imageAlt={a.heroImage?.altText}
          headingLevel={headingLevel}
        />
      ))}
    </div>
  );
}
