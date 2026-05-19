import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PageShell kicker="Author" title={slug.replace(/-/g, " ")}>
      <p>
        Author profile shell. The AI-authorship + reviewer byline pattern
        (ADR-027) is wired in Commit 2.3.
      </p>
    </PageShell>
  );
}
