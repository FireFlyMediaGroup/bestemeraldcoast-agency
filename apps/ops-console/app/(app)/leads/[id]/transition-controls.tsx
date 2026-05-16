"use client";

// Manual lead-status transition controls (master plan Commit 1.6: "status
// changes optimistically and roll back on error"). The optimistic value is
// applied inside the transition; on a successful action the server
// revalidatePath re-renders this route and `currentStatus` advances (the
// optimistic base resets to it). On failure the optimistic value reverts to
// the unchanged `currentStatus` when the transition settles — a visual
// rollback — and an error toast explains why.

import { useEffect, useState, useTransition, useOptimistic } from "react";

import { Button } from "@bec/ui";

import type { LeadStatus } from "@/lib/lead-transitions";

import { StatusBadge, formatStatus } from "../status-badge";
import { transitionLead } from "../actions";

const ERROR_COPY: Record<string, string> = {
  unauthorized: "Your session expired — sign in again.",
  invalid_id: "This lead id is invalid.",
  unknown_status: "That status isn’t recognized.",
  not_found: "This lead no longer exists.",
  invalid_transition: "That transition isn’t allowed from the current status.",
  status_changed_concurrently:
    "Someone else changed this lead’s status — reloaded with the latest.",
};

export function TransitionControls({
  leadId,
  currentStatus,
  nextStatuses,
}: {
  leadId: string;
  currentStatus: LeadStatus;
  nextStatuses: LeadStatus[];
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] =
    useOptimistic<LeadStatus>(currentStatus);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  function go(to: LeadStatus) {
    setToast(null);
    startTransition(async () => {
      setOptimisticStatus(to);
      const res = await transitionLead(leadId, to);
      if (!res.ok) {
        setToast(ERROR_COPY[res.error] ?? "Couldn’t update the lead.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-fg">Current</span>
        <StatusBadge status={optimisticStatus} />
        {isPending ? (
          <span className="text-sm text-muted-fg">saving…</span>
        ) : null}
      </div>

      {nextStatuses.length === 0 ? (
        <p className="text-sm text-muted-fg">
          {formatStatus(currentStatus)} is a terminal status — no further
          transitions.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {nextStatuses.map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => go(s)}
              className="min-h-[44px]"
            >
              → {formatStatus(s)}
            </Button>
          ))}
        </div>
      )}

      {toast ? (
        <div
          role="alert"
          className="rounded-(--radius-sm) border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--bec-color-danger)",
            color: "var(--bec-color-danger)",
          }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
