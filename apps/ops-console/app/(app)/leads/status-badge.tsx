// Shared lead-status presentation (list + detail). Pure/server-safe — no
// client boundary. Colors reference the ops-console token CSS variables
// (globals.css) so they track the dark/light palette automatically.

import type { LeadStatus } from "@/lib/lead-transitions";

const TOKEN: Record<LeadStatus, string> = {
  new: "--bec-color-muted-fg",
  diagnosed: "--bec-color-primary",
  build_ready: "--bec-color-accent",
  approved_to_send: "--bec-color-accent",
  sent: "--bec-color-primary",
  replied: "--bec-color-primary",
  booked: "--bec-color-success",
  closed_won: "--bec-color-success",
  closed_lost: "--bec-color-danger",
};

export function formatStatus(s: LeadStatus): string {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  const color = `var(${TOKEN[status]})`;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-(--radius-sm) border px-2 py-0.5 text-sm font-medium"
      style={{ borderColor: color, color }}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full"
        style={{ background: color }}
      />
      {formatStatus(status)}
    </span>
  );
}
