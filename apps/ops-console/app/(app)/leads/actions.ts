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

  const { getDb, schema, eq, and } = await import("@bec/db");
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

  // Local LeadStatus union and the drizzle pgEnum union are nominally
  // distinct to tsc though their string sets are identical — cast at the
  // write sites so the column types line up (same pattern as the agent route).
  type StatusCol = (typeof schema.leadStatus.enumValues)[number];
  const trimmedReason = reason?.trim();

  let raced = false;
  await db.transaction(async (tx) => {
    const moved = await tx
      .update(schema.leads)
      .set({ status: to as StatusCol, updatedAt: new Date() })
      .where(
        and(
          eq(schema.leads.id, leadId),
          eq(schema.leads.status, from as StatusCol),
        ),
      )
      .returning({ id: schema.leads.id });
    if (moved.length === 0) {
      raced = true;
      return;
    }
    await tx.insert(schema.leadStatusHistory).values({
      leadId,
      fromStatus: from as StatusCol,
      toStatus: to as StatusCol,
      changedBy: operator,
      reason: trimmedReason ? trimmedReason : null,
    });
  });

  if (raced) return { ok: false, error: "status_changed_concurrently" };

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return { ok: true, status: to };
}
