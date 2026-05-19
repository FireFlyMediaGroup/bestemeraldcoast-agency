import type { ReactNode } from "react";

// Site masthead. Archetype-agnostic: every color/font/radius is a
// CSS-variable-backed Tailwind token (ADR-032 component contract) so it
// repaints when an ancestor switches `.archetype-*`. Framework-neutral
// (plain <a>) — ADR-037; the consuming app can wrap links if it needs to.

export interface SiteHeaderNavItem {
  label: string;
  href: string;
}

export interface SiteHeaderProps {
  siteName: string;
  /** Optional primary nav (categories, etc.). */
  nav?: SiteHeaderNavItem[];
  /** Optional slot rendered at the end of the bar (e.g. search). */
  end?: ReactNode;
  className?: string;
}

export function SiteHeader({ siteName, nav, end, className }: SiteHeaderProps) {
  return (
    <header
      className={[
        "border-b border-border bg-background text-foreground",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className="mx-auto flex items-center justify-between gap-4 px-4 py-4 sm:px-6"
        style={{ maxWidth: "var(--bec-content-max-width)" }}
      >
        <a
          href="/"
          className="font-heading text-lg font-bold no-underline text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {siteName}
        </a>
        {nav && nav.length > 0 ? (
          <nav aria-label="Primary">
            <ul className="flex list-none flex-wrap gap-4 p-0 m-0">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex min-h-11 items-center text-sm text-muted-fg no-underline hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        {end ? <div className="flex items-center">{end}</div> : null}
      </div>
    </header>
  );
}
