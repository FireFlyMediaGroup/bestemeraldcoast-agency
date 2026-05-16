// Skeleton for the lead detail while the server fetch is in flight (Apple
// HIG — master plan Commit 1.6). animate-pulse is auto-disabled under
// prefers-reduced-motion (globals.css).

export default function LeadDetailLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-56 animate-pulse rounded-(--radius-sm) bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded-(--radius-sm) bg-muted" />
        </div>
        <div className="h-11 w-24 animate-pulse rounded-(--radius-sm) bg-muted" />
      </div>

      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="space-y-3 rounded-(--radius-lg) border border-border p-5"
        >
          <div className="h-4 w-28 animate-pulse rounded-(--radius-sm) bg-muted" />
          <div className="h-4 w-full animate-pulse rounded-(--radius-sm) bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded-(--radius-sm) bg-muted" />
        </div>
      ))}
    </main>
  );
}
