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

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PageShell kicker="Event" title={titleize(slug)}>
      <p>Event detail shell. Event schema + details land in a later Phase 2 commit.</p>
    </PageShell>
  );
}
