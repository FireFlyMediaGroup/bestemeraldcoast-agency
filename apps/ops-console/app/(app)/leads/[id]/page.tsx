// Lead detail (master plan Commit 1.6): diagnosis, offer, mockup, status
// history + manual transition controls. Server Component — reads via @bec/db;
// valid next statuses are derived from the shared transition map so the UI
// and the agent API share one source of transition truth.

import Link from "next/link";
import { notFound } from "next/navigation";

import {
  LEAD_STATUSES,
  isValidTransition,
  type LeadStatus,
} from "@/lib/lead-transitions";
import { getLead } from "@/lib/leads-data";

import { StatusBadge, formatStatus } from "../status-badge";
import { TransitionControls } from "./transition-controls";

export const dynamic = "force-dynamic";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-(--radius-lg) border border-border p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-fg">
        {title}
      </h2>
      {children}
    </section>
  );
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  const nextStatuses: LeadStatus[] = LEAD_STATUSES.filter((s) =>
    isValidTransition(lead.status, s),
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--bec-font-heading)" }}
          >
            {lead.businessName}
          </h1>
          <p className="mt-1 text-base text-muted-fg">
            {lead.niche} · {lead.city}
            {lead.gapScore != null ? ` · gap ${lead.gapScore}` : ""}
          </p>
        </div>
        <Link
          href="/leads"
          className="inline-flex min-h-[44px] items-center rounded-(--radius-sm) border border-border px-3 text-sm text-muted-fg hover:text-foreground"
        >
          ← Leads
        </Link>
      </header>

      <Section title="Status">
        <TransitionControls
          leadId={lead.id}
          currentStatus={lead.status}
          nextStatuses={nextStatuses}
        />
        {lead.lockedBy ? (
          <p className="mt-3 text-sm text-muted-fg">
            Locked by {lead.lockedBy}
            {lead.lockedAt ? ` since ${formatDate(lead.lockedAt)}` : ""}
          </p>
        ) : null}
      </Section>

      <Section title="Business">
        <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
          <dt className="text-muted-fg">Niche</dt>
          <dd>{lead.niche}</dd>
          <dt className="text-muted-fg">City</dt>
          <dd>{lead.city}</dd>
          <dt className="text-muted-fg">Website</dt>
          <dd>
            {lead.websiteUrl ? (
              <a
                href={lead.websiteUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary hover:underline"
              >
                {lead.websiteUrl}
              </a>
            ) : (
              "—"
            )}
            {lead.websiteStatus ? (
              <span className="ml-2 text-muted-fg">
                ({lead.websiteStatus})
              </span>
            ) : null}
          </dd>
        </dl>
      </Section>

      <Section title="Diagnosis">
        {lead.diagnosis ? (
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-muted-fg">Gap score: </span>
              <span className="tabular-nums">
                {lead.diagnosis.gapScore}
              </span>
            </p>
            <p>{lead.diagnosis.summary}</p>
            {lead.diagnosis.findings?.length ? (
              <ul className="space-y-1.5">
                {lead.diagnosis.findings.map((f, i) => (
                  <li key={`${f.code}-${i}`} className="flex gap-2">
                    <span
                      className="mt-0.5 shrink-0 rounded-(--radius-sm) border px-1.5 text-xs"
                      style={{
                        borderColor:
                          f.severity === "high"
                            ? "var(--bec-color-danger)"
                            : f.severity === "medium"
                              ? "var(--bec-color-warning)"
                              : "var(--bec-color-muted-fg)",
                      }}
                    >
                      {f.severity}
                    </span>
                    <span>{f.description}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-fg">
            Not diagnosed yet — the Diagnoser populates this.
          </p>
        )}
      </Section>

      <Section title="Offer">
        {lead.offer ? (
          <div className="space-y-2 text-sm">
            <p className="font-medium">{lead.offer.headline}</p>
            <p className="text-muted-fg">
              {lead.offer.type} · {formatPrice(lead.offer.priceCents)}
            </p>
            {lead.offer.bullets?.length ? (
              <ul className="list-inside list-disc space-y-1">
                {lead.offer.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-fg">No offer drafted yet.</p>
        )}
      </Section>

      {lead.mockupUrl || lead.videoUrl ? (
        <Section title="Assets">
          <div className="flex flex-col gap-2 text-sm">
            {lead.mockupUrl ? (
              <a
                href={lead.mockupUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary hover:underline"
              >
                View mockup ↗
              </a>
            ) : null}
            {lead.videoUrl ? (
              <a
                href={lead.videoUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary hover:underline"
              >
                View walkthrough video ↗
              </a>
            ) : null}
          </div>
        </Section>
      ) : null}

      {lead.notes ? (
        <Section title="Notes">
          <p className="whitespace-pre-wrap text-sm">{lead.notes}</p>
        </Section>
      ) : null}

      <Section title="Status history">
        {lead.history.length === 0 ? (
          <p className="text-sm text-muted-fg">
            No transitions recorded yet.
          </p>
        ) : (
          <ol className="space-y-3">
            {lead.history.map((h, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                {h.fromStatus ? (
                  <StatusBadge status={h.fromStatus} />
                ) : (
                  <span className="text-muted-fg">created</span>
                )}
                <span className="text-muted-fg">→</span>
                <StatusBadge status={h.toStatus} />
                <span className="text-muted-fg">
                  by {h.changedBy} · {formatDate(h.createdAt)}
                </span>
                {h.reason ? (
                  <span className="w-full text-muted-fg">“{h.reason}”</span>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </Section>
    </main>
  );
}
