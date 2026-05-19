import type { ReactNode } from "react";

// Article reading frame for the Magazine archetype (works in all three via
// tokens). Constrains body to the theme's `--bec-content-max-width`, owns the
// single <h1>, and exposes slots for breadcrumb / byline / hero / footer so
// Commit 2.3 can drop in structured data + real content without changing the
// frame. Comfortable measure + clear hierarchy = HIG reader principles.

export interface ArticleLayoutProps {
  title: string;
  /** Eyebrow above the title (e.g. category). */
  kicker?: string;
  /** Breadcrumb slot (e.g. <BreadcrumbNav/>). */
  breadcrumb?: ReactNode;
  /** Byline / dateline slot (AI-authorship + reviewer pattern is Commit 2.3). */
  byline?: ReactNode;
  /** Hero media slot (image/video). */
  hero?: ReactNode;
  /** Trailing slot (newsletter signup, related, etc.). */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ArticleLayout({
  title,
  kicker,
  breadcrumb,
  byline,
  hero,
  footer,
  children,
  className,
}: ArticleLayoutProps) {
  return (
    <article
      className={["mx-auto px-4 sm:px-6 text-foreground", className]
        .filter(Boolean)
        .join(" ")}
      style={{ maxWidth: "var(--bec-content-max-width)" }}
    >
      {breadcrumb ? <div className="pt-6">{breadcrumb}</div> : null}

      <header className="pt-6">
        {kicker ? (
          <p className="m-0 font-body text-xs font-semibold uppercase tracking-widest text-accent">
            {kicker}
          </p>
        ) : null}
        <h1 className="mt-2 font-heading text-3xl font-bold leading-tight sm:text-4xl">
          {title}
        </h1>
        {byline ? (
          <div className="mt-4 text-sm text-muted-fg">{byline}</div>
        ) : null}
      </header>

      {hero ? <div className="mt-6">{hero}</div> : null}

      <div
        className="prose-content mt-8 font-body text-base leading-relaxed [&_p]:my-4 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:font-semibold [&_a]:text-primary"
      >
        {children}
      </div>

      {footer ? (
        <div style={{ marginBlock: "var(--bec-section-gap)" }}>{footer}</div>
      ) : null}
    </article>
  );
}
