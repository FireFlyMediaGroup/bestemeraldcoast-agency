// Premium archetype's STRUCTURAL featured variant (ADR-032: "editorial-
// magazine, refined, full-bleed … lots of negative space … selective
// full-bleed elements"). This is a real layout fork, not just tokens: no
// card chrome/border, the image runs edge-to-edge (full-bleed), and the
// text sits in a narrow, generously-spaced measure below it. Still fully
// token-colored (so it also works under any archetype's palette), but the
// composition is deliberately different from the default `FeaturedListing`.
// Pair it with the `premium` theme; the default variant covers Magazine/
// Coastal (and Premium too, if the card form is wanted there).

import type { FeaturedListingProps } from "./featured-listing.js";

export type FeaturedListingPremiumProps = FeaturedListingProps;

export function FeaturedListingPremium({
  href,
  title,
  kicker,
  excerpt,
  imageUrl,
  imageAlt,
  headingLevel = 2,
  className,
}: FeaturedListingPremiumProps) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  return (
    <article
      className={["group bg-background text-foreground", className]
        .filter(Boolean)
        .join(" ")}
    >
      <a
        href={href}
        className="block no-underline text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {imageUrl ? (
          // Full-bleed: the image is intentionally edge-to-edge (no radius,
          // no border — Premium minimal-chrome). eslint-disable-next-line
          // @next/next/no-img-element -- @bec/ui is framework-neutral
          // (ADR-037); the app supplies optimized images.
          <img
            src={imageUrl}
            alt={imageAlt ?? ""}
            className="w-full object-cover"
            style={{ aspectRatio: "var(--bec-hero-aspect)" }}
          />
        ) : null}
        {/* Narrow measure + large negative space (the Premium signature). */}
        <div
          className="mx-auto px-6"
          style={{
            maxWidth: "var(--bec-content-max-width)",
            paddingBlock: "var(--bec-section-gap)",
          }}
        >
          {kicker ? (
            <p className="m-0 font-body text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {kicker}
            </p>
          ) : null}
          <Heading className="mt-4 font-heading text-4xl font-medium leading-tight sm:text-5xl group-hover:text-primary">
            {title}
          </Heading>
          {excerpt ? (
            <p className="mt-6 max-w-prose font-body text-lg leading-relaxed text-muted-fg">
              {excerpt}
            </p>
          ) : null}
        </div>
      </a>
    </article>
  );
}
