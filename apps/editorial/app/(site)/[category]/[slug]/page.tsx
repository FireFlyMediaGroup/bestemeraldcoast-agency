import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { titleize } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Article JSON-LD / canonical (ADR-010) is Commit 2.3, not the shell.
  return { title: titleize(slug) };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  return (
    <PageShell kicker={titleize(category)} title={titleize(slug)}>
      <p>
        Article shell. Magazine ArticleLayout + structured data arrive in
        Commits 2.2–2.3.
      </p>
    </PageShell>
  );
}
