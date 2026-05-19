// Article teaser card (category indexes, related lists). The whole card is
// one link; the title is an <h3> by default (override `headingLevel` to fit
// the surrounding outline — WCAG 2.2 AA heading order). Image alt is required
// when an image is present (ADR-022); pass "" only for decorative.

export interface ArticleCardProps {
  href: string;
  title: string;
  excerpt?: string;
  kicker?: string;
  imageUrl?: string;
  /**
   * Alt text for `imageUrl`. Not type-enforced here (presentational
   * component); ADR-022's hard "no image without alt" gate is enforced
   * upstream at the ops-console image picker. Callers MUST pass meaningful
   * alt for content images; pass `""` to mark an image explicitly
   * decorative. Defaults to `""` only as a safe fallback.
   */
  imageAlt?: string;
  /** 2 | 3 | 4 — match the surrounding document outline. Default 3. */
  headingLevel?: 2 | 3 | 4;
  className?: string;
}

export function ArticleCard({
  href,
  title,
  excerpt,
  kicker,
  imageUrl,
  imageAlt,
  headingLevel = 3,
  className,
}: ArticleCardProps) {
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  return (
    <article
      className={[
        "group overflow-hidden border border-border bg-background",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ borderRadius: "var(--bec-radius-lg)" }}
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
            className="aspect-[3/2] w-full object-cover"
            loading="lazy"
          />
        ) : null}
        <div className="p-4">
          {kicker ? (
            <p className="m-0 font-body text-xs font-semibold uppercase tracking-widest text-accent">
              {kicker}
            </p>
          ) : null}
          <Heading className="mt-1 font-heading text-xl font-semibold leading-snug group-hover:text-primary">
            {title}
          </Heading>
          {excerpt ? (
            <p className="mt-2 font-body text-sm leading-relaxed text-muted-fg">
              {excerpt}
            </p>
          ) : null}
        </div>
      </a>
    </article>
  );
}
