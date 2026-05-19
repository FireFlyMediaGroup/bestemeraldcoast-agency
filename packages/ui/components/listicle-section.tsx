import type { ReactNode } from "react";

// One ranked entry in a listicle ("The 12 best…"). Rank is decorative
// (aria-hidden) — the heading carries the real semantics so screen-reader
// users get a clean heading outline (WCAG 2.2 AA). Tokenized; magazine-tuned
// but archetype-agnostic.

export interface ListicleSectionProps {
  rank: number;
  title: string;
  /** Match the surrounding outline; default h2. */
  headingLevel?: 2 | 3;
  media?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ListicleSection({
  rank,
  title,
  headingLevel = 2,
  media,
  children,
  className,
}: ListicleSectionProps) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  return (
    <section
      className={["scroll-mt-24", className].filter(Boolean).join(" ")}
      style={{ marginBlock: "var(--bec-section-gap)" }}
    >
      <div className="flex items-baseline gap-3">
        <span
          aria-hidden="true"
          className="font-heading text-4xl font-bold leading-none text-accent"
        >
          {rank}
        </span>
        <Heading className="font-heading text-2xl font-semibold leading-snug text-foreground">
          {title}
        </Heading>
      </div>
      {media ? <div className="mt-4">{media}</div> : null}
      <div className="mt-3 font-body text-base leading-relaxed text-foreground [&_p]:my-3">
        {children}
      </div>
    </section>
  );
}
