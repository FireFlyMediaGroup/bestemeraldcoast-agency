// Site footer with legal navigation + copyright. Tokenized + semantic
// (`<footer>` + labelled `<nav>`); WCAG 2.2 AA (muted-fg on background is a
// contrast-checked token pair, ADR-032/ADR-036). Framework-neutral.

export interface SiteFooterLink {
  label: string;
  href: string;
}

export interface SiteFooterProps {
  siteName: string;
  /** Defaults to the current year. */
  year?: number;
  /** Legal/utility links; sensible defaults match the editorial routes. */
  links?: SiteFooterLink[];
  className?: string;
}

const DEFAULT_LINKS: SiteFooterLink[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Disclosure", href: "/disclosure" },
  { label: "Cookies", href: "/cookies" },
  { label: "Editorial Standards", href: "/editorial-standards" },
];

export function SiteFooter({
  siteName,
  year,
  links = DEFAULT_LINKS,
  className,
}: SiteFooterProps) {
  return (
    <footer
      className={[
        "border-t border-border bg-background text-muted-fg",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className="mx-auto px-4 py-8 sm:px-6"
        style={{ maxWidth: "var(--bec-content-max-width)" }}
      >
        <nav aria-label="Footer">
          <ul className="flex list-none flex-wrap gap-x-6 gap-y-2 p-0 m-0">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="inline-flex min-h-11 items-center text-sm text-muted-fg no-underline hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="mt-4 text-sm">
          © {year ?? new Date().getFullYear()} {siteName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
