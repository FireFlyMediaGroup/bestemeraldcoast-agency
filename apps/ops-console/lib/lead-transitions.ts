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

// Optional `leads` column writes applied in the same statement as the
// transition. Mirrors the agent-API PatchLead surface; an absent key leaves
// the column untouched (matches drizzle `.set()` undefined-omission — we do
// NOT null a column the caller didn't send).
export interface LeadTransitionFields {
  notes?: string;
  mockupUrl?: string;
  videoUrl?: string;
  gapScoreSnapshot?: number;
  diagnosis?: Record<string, unknown>;
  offer?: Record<string, unknown>;
}

/**
 * Atomically move a lead `from` → `to` and write its `lead_status_history`
 * row as a SINGLE SQL statement (a CTE), returning whether the row actually
 * moved.
 *
 * Why a CTE and not `db.transaction()`: `@bec/db` runs the Neon Pool with
 * `neonConfig.poolQueryViaFetch = true` (client.ts — required for Vercel
 * serverless auth stability). Each `pool.query()` is then a stateless HTTP
 * request, so an interactive `BEGIN … COMMIT` session has no connection
 * affinity and Drizzle's `db.transaction()` throws (regression from PR #28;
 * surfaced as a hard 500 on every agent-API status transition). A single
 * statement needs no interactive transaction and is atomic in Postgres, so
 * it is transport-independent (works over fetch OR websocket).
 *
 * Race-safety is preserved exactly: the UPDATE is conditional on the row
 * still being in `from`. A concurrent transition that already moved the lead
 * makes the UPDATE match 0 rows → the CTE's `moved` set is empty → the
 * history INSERT…SELECT writes 0 rows → we return `transitioned: false` so
 * the caller reports the race (409) instead of recording a transition that
 * never legitimately happened.
 *
 * Returns `transitioned: true` when the lead moved, `false` on the race.
 * Caller is responsible for validity (`isValidTransition`) and the
 * `from === to` no-op short-circuit before calling this.
 */
export async function applyLeadTransition(opts: {
  // The shared @bec/db drizzle handle from `getDb()`. Type-only import so we
  // bind to the monorepo's single drizzle identity without a runtime dep.
  db: import("@bec/db").Database;
  id: string;
  from: LeadStatus;
  to: LeadStatus;
  changedBy: string;
  reason?: string | null;
  fields?: LeadTransitionFields;
}): Promise<{ transitioned: boolean }> {
  const { db, id, from, to, changedBy, reason, fields } = opts;
  // Bind drizzle's `sql` from @bec/db so it shares the monorepo's single
  // drizzle-orm identity (same reason routes import operators from @bec/db).
  const { sql } = await import("@bec/db");

  // Build the SET list: `status` + `updated_at` always; optional columns
  // only when the caller provided them (undefined-omission semantics).
  const sets = [
    sql`status = ${to}::lead_status`,
    sql`updated_at = now()`,
  ];
  const f = fields ?? {};
  if (f.notes !== undefined) sets.push(sql`notes = ${f.notes}`);
  if (f.mockupUrl !== undefined) sets.push(sql`mockup_url = ${f.mockupUrl}`);
  if (f.videoUrl !== undefined) sets.push(sql`video_url = ${f.videoUrl}`);
  if (f.gapScoreSnapshot !== undefined)
    sets.push(sql`gap_score_snapshot = ${f.gapScoreSnapshot}`);
  if (f.diagnosis !== undefined)
    sets.push(sql`diagnosis = ${JSON.stringify(f.diagnosis)}::jsonb`);
  if (f.offer !== undefined)
    sets.push(sql`offer = ${JSON.stringify(f.offer)}::jsonb`);

  const stmt = sql`
    WITH moved AS (
      UPDATE leads
         SET ${sql.join(sets, sql`, `)}
       WHERE id = ${id}::uuid AND status = ${from}::lead_status
      RETURNING id
    )
    INSERT INTO lead_status_history
      (lead_id, from_status, to_status, changed_by, reason)
    SELECT id, ${from}::lead_status, ${to}::lead_status,
           ${changedBy}, ${reason ?? null}
      FROM moved
    RETURNING lead_id
  `;

  const res = await db.execute(stmt);
  // drizzle neon-serverless `execute` returns a pg-style QueryResult
  // ({ rows: [...] }); be defensive about an array-shaped result too.
  const rows = Array.isArray(res)
    ? res
    : ((res as { rows?: unknown[] } | null)?.rows ?? []);
  return { transitioned: rows.length > 0 };
}
