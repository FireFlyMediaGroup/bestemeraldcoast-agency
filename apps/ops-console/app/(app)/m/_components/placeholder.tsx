// Shared placeholder screen body (master plan Commit 1.7: "each tab gets a
// placeholder screen for now"). Server-safe — no client boundary.

export function Placeholder({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <header>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--bec-font-heading)" }}
        >
          {title}
        </h1>
        <p className="mt-1 text-base text-muted-fg">{blurb}</p>
      </header>
      <div className="rounded-(--radius-lg) border border-border bg-muted px-5 py-12 text-center text-sm text-muted-fg">
        Coming in a later Phase 1 commit.
      </div>
      {children}
    </section>
  );
}
