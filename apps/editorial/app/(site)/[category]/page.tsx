import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { titleize } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  // Canonical / structured data (ADR-010) is Commit 2.3, not the shell.
  return { title: titleize(category) };
}

export default async function CategoryIndexPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return (
    <PageShell kicker="Category" title={titleize(category)}>
      <p>Category index shell. Article cards land in Commit 2.2.</p>
    </PageShell>
  );
}
