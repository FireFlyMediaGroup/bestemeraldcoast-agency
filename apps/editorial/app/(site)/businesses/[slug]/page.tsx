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

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PageShell kicker="Business" title={slug.replace(/-/g, " ")}>
      <p>
        Business profile shell. Verified details + LocalBusiness JSON-LD land
        in Commit 2.3.
      </p>
    </PageShell>
  );
}
