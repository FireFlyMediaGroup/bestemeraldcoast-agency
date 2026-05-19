// Editorial composer detail (Commit 2.7). Server Component: loads the
// article + its site categories / images / business-link state, hands them
// to the client Composer. notFound() for an unknown id.

import { notFound } from "next/navigation";

import { getArticleForEdit } from "@/lib/articles-data";

import { Composer } from "./composer";

export const dynamic = "force-dynamic";

export default async function ComposerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticleForEdit(id);
  if (!article) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <p className="text-sm text-muted-fg">
        {article.siteName} · <span className="capitalize">{article.status}</span>{" "}
        · <code>{article.slug}</code>
      </p>
      <Composer article={article} />
    </main>
  );
}
