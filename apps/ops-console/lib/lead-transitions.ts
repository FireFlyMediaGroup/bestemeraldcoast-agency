// Lead status-transition validity (mirrors the `lead_status` pgEnum in
// @bec/db's schema/leads.ts). Every status mutation through the agent API
// must be a declared edge here, and every applied transition writes a
// `lead_status_history` row (master plan Commit 1.5: "All mutations enforce
// status transition validity and write to lead_status_history").

export type LeadStatus =
  | "new"
  | "diagnosed"
  | "build_ready"
  | "approved_to_send"
  | "sent"
  | "replied"
  | "booked"
  | "closed_won"
  | "closed_lost";

// Forward pipeline + the two ways a lead can drop out at most stages.
// closed_won / closed_lost are terminal (no outgoing edges).
const TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  new: ["diagnosed", "closed_lost"],
  diagnosed: ["build_ready", "closed_lost"],
  build_ready: ["approved_to_send", "closed_lost"],
  approved_to_send: ["sent", "closed_lost"],
  sent: ["replied", "closed_lost"],
  replied: ["booked", "closed_won", "closed_lost"],
  booked: ["closed_won", "closed_lost"],
  closed_won: [],
  closed_lost: [],
};

export function isValidTransition(from: LeadStatus, to: LeadStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export const LEAD_STATUSES = Object.keys(TRANSITIONS) as LeadStatus[];

export function isLeadStatus(v: unknown): v is LeadStatus {
  return typeof v === "string" && (LEAD_STATUSES as string[]).includes(v);
}
