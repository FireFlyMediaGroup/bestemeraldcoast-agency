// Business summary card (referenced businesses in an article / directory).
// Rating is rendered as accessible text (not just stars) — WCAG 2.2 AA, no
// reliance on color/glyph alone. LocalBusiness JSON-LD is Commit 2.3; this is
// the visible card only. Tokenized, framework-neutral.

export interface BusinessCardProps {
  name: string;
  /** 0–5; rendered as text "x.x ★ (n)". */
  rating?: number;
  reviewCount?: number;
  address?: string;
  tagline?: string;
  /** Optional profile/detail link; whole card becomes a link when set. */
  href?: string;
  /** Match the surrounding outline; default h3. */
  headingLevel?: 2 | 3 | 4;
  className?: string;
}

export function BusinessCard({
  name,
  rating,
  reviewCount,
  address,
  tagline,
  href,
  headingLevel = 3,
  className,
}: BusinessCardProps) {
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const body = (
    <>
      <Heading className="m-0 font-heading text-lg font-semibold text-foreground">
        {name}
      </Heading>
      {typeof rating === "number" ? (
        <p className="mt-1 m-0 text-sm text-muted-fg">
          <span className="font-semibold text-foreground">
            {rating.toFixed(1)}
          </span>{" "}
          <span aria-hidden="true">★</span>
          <span className="sr-only"> out of 5</span>
          {typeof reviewCount === "number"
            ? ` · ${reviewCount} review${reviewCount === 1 ? "" : "s"}`
            : null}
        </p>
      ) : null}
      {tagline ? (
        <p className="mt-2 m-0 font-body text-sm leading-relaxed text-foreground">
          {tagline}
        </p>
      ) : null}
      {address ? (
        <p className="mt-2 m-0 text-sm text-muted-fg">{address}</p>
      ) : null}
    </>
  );

  const cardClass = [
    "block border border-border bg-background p-4 no-underline",
    href
      ? "hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return href ? (
    <a href={href} className={cardClass} style={{ borderRadius: "var(--bec-radius-md)" }}>
      {body}
    </a>
  ) : (
    <div className={cardClass} style={{ borderRadius: "var(--bec-radius-md)" }}>
      {body}
    </div>
  );
}
