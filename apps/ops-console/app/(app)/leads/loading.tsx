// Skeleton for the Leads table while the server fetch is in flight (Apple
// HIG — master plan Commit 1.6). Mirrors the page's layout so the swap is
// jank-free. animate-pulse is auto-disabled under prefers-reduced-motion
// (globals.css).

export default function LeadsLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-28 animate-pulse rounded-(--radius-sm) bg-muted" />
          <div className="h-4 w-56 animate-pulse rounded-(--radius-sm) bg-muted" />
        </div>
        <div className="h-11 w-28 animate-pulse rounded-(--radius-sm) bg-muted" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-20 animate-pulse rounded-(--radius-sm) bg-muted"
          />
        ))}
      </div>

      <div className="rounded-(--radius-lg) border border-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-0"
          >
            <div className="h-4 flex-1 animate-pulse rounded-(--radius-sm) bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded-(--radius-sm) bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded-(--radius-sm) bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded-(--radius-sm) bg-muted" />
          </div>
        ))}
      </div>
    </main>
  );
}
