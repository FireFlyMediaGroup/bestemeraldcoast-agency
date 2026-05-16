// Operator Leads view (master plan Commit 1.6). Server Component: reads the
// agent-API-populated leads via @bec/db, renders a gap-sorted table with a
// status filter. Empty state copy is the master-plan acceptance string.
// Skeleton loading is loading.tsx (Suspense via the App Router).

import Link from "next/link";

import { LEAD_STATUSES, isLeadStatus } from "@/lib/lead-transitions";
import { listLeads } from "@/lib/leads-data";

import { PullToRefresh } from "./pull-to-refresh";
import { StatusBadge, formatStatus } from "./status-badge";

export const dynamic = "force-dynamic";

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-[36px] items-center rounded-(--radius-sm) border px-3 text-sm transition-colors ${
        active
          ? "border-transparent bg-primary text-primary-fg"
          : "border-border text-muted-fg hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const filter =
    sp.status && isLeadStatus(sp.status) ? sp.status : undefined;

  const leads = await listLeads(filter);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--bec-font-heading)" }}
          >
            Leads
          </h1>
          <p className="mt-1 text-base text-muted-fg">
            {leads.length} {leads.length === 1 ? "lead" : "leads"}
            {filter ? ` · ${formatStatus(filter)}` : ""} · sorted by gap score
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center rounded-(--radius-sm) border border-border px-3 text-sm text-muted-fg hover:text-foreground"
        >
          Dashboard
        </Link>
      </header>

      <nav
        aria-label="Filter by status"
        className="flex flex-wrap gap-2"
      >
        <FilterChip label="All" href="/leads" active={!filter} />
        {LEAD_STATUSES.map((s) => (
          <FilterChip
            key={s}
            label={formatStatus(s)}
            href={`/leads?status=${s}`}
            active={filter === s}
          />
        ))}
      </nav>

      <PullToRefresh>
        {leads.length === 0 ? (
          <section className="rounded-(--radius-lg) border border-border bg-muted px-5 py-16 text-center">
            <p className="text-base text-muted-fg">
              {filter
                ? `No leads with status “${formatStatus(filter)}”.`
                : "No leads yet — run Scout to populate."}
            </p>
            {filter ? (
              <Link
                href="/leads"
                className="mt-3 inline-block text-sm text-primary hover:underline"
              >
                Clear filter
              </Link>
            ) : null}
          </section>
        ) : (
          <div className="overflow-x-auto rounded-(--radius-lg) border border-border">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-fg">
                  <th className="px-4 py-3 font-medium">Business</th>
                  <th className="px-4 py-3 font-medium">Niche</th>
                  <th className="px-4 py-3 font-medium">City</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Gap</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Days in status
                  </th>
                  <th className="px-4 py-3 font-medium">Lock holder</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-border last:border-0 hover:bg-muted"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/leads/${l.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {l.businessName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-fg">{l.niche}</td>
                    <td className="px-4 py-3 text-muted-fg">{l.city}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {l.gapScore ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-fg">
                      {l.daysInStatus}
                    </td>
                    <td className="px-4 py-3 text-muted-fg">
                      {l.lockedBy ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PullToRefresh>
    </main>
  );
}
