// Operator editorial list (Commit 2.7). Server Component: reads articles via
// @bec/db, renders a status-filtered table. Mirrors the Leads view pattern
// (force-dynamic + filter chips + empty state).

import Link from "next/link";

import { ARTICLE_STATUSES, isArticleStatus } from "@/lib/article-transitions";
import { listArticles } from "@/lib/articles-data";

export const dynamic = "force-dynamic";

function Chip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-[44px] items-center rounded-(--radius-sm) border px-3 text-sm capitalize transition-colors ${
        active
          ? "border-transparent bg-primary text-primary-fg"
          : "border-border text-muted-fg hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

export default async function EditorialPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = status && isArticleStatus(status) ? status : undefined;
  const rows = await listArticles(active);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="font-heading text-2xl font-bold">Editorial</h1>
      <p className="mt-1 text-sm text-muted-fg">
        Drafts come from the Editor agent (<code>/draft-article</code>). Review,
        edit, and publish here.
      </p>

      <nav
        aria-label="Filter by status"
        className="mt-4 flex flex-wrap gap-2"
      >
        <Chip label="all" href="/editorial" active={!active} />
        {ARTICLE_STATUSES.map((s) => (
          <Chip
            key={s}
            label={s}
            href={`/editorial?status=${s}`}
            active={active === s}
          />
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="mt-10 text-center text-muted-fg">
          No articles{active ? ` in “${active}”` : ""} yet.
        </p>
      ) : (
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-fg">
              <th className="py-2 pr-4 font-medium">Title</th>
              <th className="py-2 pr-4 font-medium">Site</th>
              <th className="py-2 pr-4 font-medium">Category</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border/60 hover:bg-muted/40"
              >
                <td className="py-2 pr-4">
                  <Link
                    href={`/editorial/${r.id}`}
                    className="font-medium text-foreground underline-offset-2 hover:underline"
                  >
                    {r.title}
                  </Link>
                  {r.isSponsored ? (
                    <span className="ml-2 rounded-(--radius-sm) bg-accent px-1.5 py-0.5 text-xs text-accent-fg">
                      Sponsored
                    </span>
                  ) : null}
                </td>
                <td className="py-2 pr-4 text-muted-fg">{r.siteName}</td>
                <td className="py-2 pr-4 text-muted-fg">
                  {r.categoryName ?? "—"}
                </td>
                <td className="py-2 pr-4 capitalize">{r.status}</td>
                <td className="py-2 text-muted-fg">
                  {r.updatedAt
                    ? new Date(r.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
