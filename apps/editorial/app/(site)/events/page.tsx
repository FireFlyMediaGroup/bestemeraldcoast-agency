import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Events" };

export default function EventsIndexPage() {
  return (
    <PageShell kicker="What's on" title="Events">
      <p>Events index shell. Event listings land in a later Phase 2 commit.</p>
    </PageShell>
  );
}
