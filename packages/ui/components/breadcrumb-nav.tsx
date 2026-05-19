// Breadcrumb trail. Semantic: labelled <nav> + ordered list, the current
// page marked aria-current and not linked (WCAG 2.2 AA, ADR-036). The visual
// JSON-LD BreadcrumbList counterpart is Commit 2.3's concern — this is the
// rendered UI only. Framework-neutral.

export interface BreadcrumbItem {
  label: string;
  /** Omit on the current (last) item. */
  href?: string;
}

export interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNav({ items, className }: BreadcrumbNavProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={["text-sm text-muted-fg", className]
        .filter(Boolean)
        .join(" ")}
    >
      <ol className="flex list-none flex-wrap items-center gap-1 p-0 m-0">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              {item.href && !last ? (
                <a
                  href={item.href}
                  className="no-underline text-muted-fg hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {item.label}
                </a>
              ) : (
                <span aria-current={last ? "page" : undefined} className="text-foreground">
                  {item.label}
                </span>
              )}
              {!last ? (
                <span aria-hidden="true" className="px-1 text-muted-fg">
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
