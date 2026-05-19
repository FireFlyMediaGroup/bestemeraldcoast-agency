import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { titleize } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: titleize(slug) };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PageShell kicker="Author" title={titleize(slug)}>
      <p>
        Author profile shell. The AI-authorship + reviewer byline pattern
        (ADR-027) is wired in Commit 2.3.
      </p>
    </PageShell>
  );
}
