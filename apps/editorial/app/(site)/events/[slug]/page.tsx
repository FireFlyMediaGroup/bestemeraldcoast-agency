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

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PageShell kicker="Event" title={slug.replace(/-/g, " ")}>
      <p>Event detail shell. Event schema + details land in a later Phase 2 commit.</p>
    </PageShell>
  );
}
