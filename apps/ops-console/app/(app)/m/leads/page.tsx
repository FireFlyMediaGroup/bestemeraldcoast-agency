import Link from "next/link";

import { Placeholder } from "../_components/placeholder";

export const dynamic = "force-dynamic";

export default function MobileLeads() {
  return (
    <Placeholder
      title="Leads"
      blurb="Mobile lead triage lands in a later Phase 1 commit."
    >
      <Link
        href="/leads"
        className="flex min-h-[44px] items-center justify-center rounded-(--radius-lg) border border-border px-5 text-sm text-primary hover:bg-muted"
      >
        Open the full Leads table →
      </Link>
    </Placeholder>
  );
}
