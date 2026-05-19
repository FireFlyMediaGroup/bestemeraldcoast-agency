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

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PageShell kicker="Business" title={titleize(slug)}>
      <p>
        Business profile shell. Verified details + LocalBusiness JSON-LD land
        in Commit 2.3.
      </p>
    </PageShell>
  );
}
