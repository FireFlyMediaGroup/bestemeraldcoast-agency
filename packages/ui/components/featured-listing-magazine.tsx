// Hero/featured block — the Magazine archetype's lead unit (large image,
// kicker, headline, dek). ADR-032 ships archetype-specific featured variants
// (FeaturedListingCoastal/Premium come in Commit 2.5); this is the Magazine
// one: documentary image, restrained type, generous measure. Text sits on
// the token background (not over the image) so contrast is always WCAG 2.2
// AA regardless of photo — no text-on-photo legibility gamble.

export interface FeaturedListingMagazineProps {
  href: string;
  title: string;
  kicker?: string;
  excerpt?: string;
  imageUrl?: string;
  /** Required when imageUrl is set (ADR-022). "" = decorative. */
  imageAlt?: string;
  /** Match the surrounding outline; default h2. */
  headingLevel?: 2 | 3;
  className?: string;
}

export function FeaturedListingMagazine({
  href,
  title,
  kicker,
  excerpt,
  imageUrl,
  imageAlt,
  headingLevel = 2,
  className,
}: FeaturedListingMagazineProps) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  return (
    <article
      className={[
        "group overflow-hidden border border-border bg-background",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ borderRadius: "var(--bec-radius-xl)" }}
    >
      <a
        href={href}
        className="block no-underline text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- @bec/ui is framework-neutral (ADR-037); the app supplies optimized images.
          <img
            src={imageUrl}
            alt={imageAlt ?? ""}
            className="aspect-[21/9] w-full object-cover"
          />
        ) : null}
        <div className="p-6 sm:p-8">
          {kicker ? (
            <p className="m-0 font-body text-xs font-semibold uppercase tracking-widest text-accent">
              {kicker}
            </p>
          ) : null}
          <Heading className="mt-2 font-heading text-3xl font-bold leading-tight sm:text-4xl group-hover:text-primary">
            {title}
          </Heading>
          {excerpt ? (
            <p className="mt-3 max-w-prose font-body text-base leading-relaxed text-muted-fg">
              {excerpt}
            </p>
          ) : null}
        </div>
      </a>
    </article>
  );
}
