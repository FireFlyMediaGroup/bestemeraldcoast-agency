"use server";

// Operator manual lead-status transition (master plan Commit 1.6: "manual
// transition controls", "status changes optimistically and roll back on
// error"). This is the authenticated operator path — `changedBy` is the
// signed-in operator's email, NOT an agent key. It mirrors the agent API's
// atomic read-validate-write (apps/.../api/agent/leads/[id]/route.ts): the
// status UPDATE is conditional on the row still being in `from`, so a
// concurrent transition makes it affect 0 rows → we abort and report the
// race instead of writing a history row for a transition that never
// legitimately happened.

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import {
  applyLeadTransition,
  isLeadStatus,
  isValidTransition,
  type LeadStatus,
} from "@/lib/lead-transitions";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type TransitionResult =
  | { ok: true; status: LeadStatus }
  | { ok: false; error: string };

export async function transitionLead(
  leadId: string,
  toStatus: string,
  reason?: string,
): Promise<TransitionResult> {
  const session = await auth();
  const operator = session?.user?.email;
  if (!operator) return { ok: false, error: "unauthorized" };

  if (!UUID.test(leadId)) return { ok: false, error: "invalid_id" };
  if (!isLeadStatus(toStatus)) return { ok: false, error: "unknown_status" };
  const to: LeadStatus = toStatus;

  const { getDb, schema, eq } = await import("@bec/db");
  const db = getDb();

  const [lead] = await db
    .select({ id: schema.leads.id, status: schema.leads.status })
    .from(schema.leads)
    .where(eq(schema.leads.id, leadId));
  if (!lead) return { ok: false, error: "not_found" };

  const from = lead.status as LeadStatus;
  if (from === to) return { ok: true, status: from };
  if (!isValidTransition(from, to)) {
    return { ok: false, error: "invalid_transition" };
  }

  const trimmedReason = reason?.trim();

  // Atomic conditional transition + history insert as ONE statement (a CTE),
  // not db.transaction(): interactive transactions do not survive the Neon
  // fetch transport (PR #28 regression — see applyLeadTransition()). Race
  // semantics are preserved: a concurrent move makes the conditional UPDATE
  // match 0 rows → transitioned:false → we report the race, no history row.
  const { transitioned } = await applyLeadTransition({
    db,
    id: leadId,
    from,
    to,
    changedBy: operator,
    reason: trimmedReason ? trimmedReason : null,
  });

  if (!transitioned) {
    return { ok: false, error: "status_changed_concurrently" };
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return { ok: true, status: to };
}
