// Seasonal-weight resolution (ADR-040 — Editorial Rotation Specification).
//
// The Curator scoring algorithm's "Seasonal weight" component (0.20 weight)
// is: the niche's monthly base multiplier, overridden by any active named
// season event that boosts the niche ("override monthly base when active",
// spec § Named seasonal events). The pure core is DB-free and trivially
// testable; `getSeasonalWeight` is the thin Postgres-backed wrapper used by
// app/agent code and asserted by the seed (Commit 1.10 acceptance:
// getSeasonalWeight('charter_fishing', 2026-06-15) === 1.5).

export interface SeasonWeightRow {
  nicheId: string;
  month: number; // 1-12
  multiplier: string | number; // drizzle `numeric` → string
}

export interface SeasonEventRow {
  boostedNicheIds: string[];
  startDate: string | Date; // drizzle `date` → 'YYYY-MM-DD'
  endDate: string | Date;
  multiplier: string | number;
}

// Year-agnostic month/day ordinal (events recur annually; rows are seeded
// with a representative year). None of the 8 spec events wrap the year
// boundary, so a simple month*100+day ordinal compare is correct.
function mdOrdinal(d: Date): number {
  return (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

function toDate(v: string | Date): Date {
  return v instanceof Date ? v : new Date(`${v}T00:00:00Z`);
}

/**
 * Pure seasonal-weight calculation. Returns the niche's monthly base
 * multiplier, unless one or more active named events boost this niche — then
 * the strongest (max) event multiplier overrides the base.
 */
export function computeSeasonalWeight(
  weights: SeasonWeightRow[],
  events: SeasonEventRow[],
  nicheId: string,
  date: Date,
): number {
  const month = date.getUTCMonth() + 1;
  const base = weights.find(
    (w) => w.nicheId === nicheId && Number(w.month) === month,
  );
  const baseMultiplier = base ? Number(base.multiplier) : 1.0;

  const cur = mdOrdinal(date);
  let override: number | null = null;
  for (const e of events) {
    if (!e.boostedNicheIds.includes(nicheId)) continue;
    const start = mdOrdinal(toDate(e.startDate));
    const end = mdOrdinal(toDate(e.endDate));
    if (cur < start || cur > end) continue;
    const m = Number(e.multiplier);
    if (override === null || m > override) override = m;
  }

  return override ?? baseMultiplier;
}

/**
 * DB-backed seasonal weight for `(nicheId, date)`. Reads the niche's monthly
 * weights + all season events (a tiny table) and applies the pure core.
 */
export async function getSeasonalWeight(
  nicheId: string,
  date: Date,
): Promise<number> {
  const { getDb, schema, eq } = await import("./index.js");
  const db = getDb();

  const weights = await db
    .select({
      nicheId: schema.seasonWeights.nicheId,
      month: schema.seasonWeights.month,
      multiplier: schema.seasonWeights.multiplier,
    })
    .from(schema.seasonWeights)
    .where(eq(schema.seasonWeights.nicheId, nicheId));

  const events = await db
    .select({
      boostedNicheIds: schema.seasonEvents.boostedNicheIds,
      startDate: schema.seasonEvents.startDate,
      endDate: schema.seasonEvents.endDate,
      multiplier: schema.seasonEvents.multiplier,
    })
    .from(schema.seasonEvents);

  return computeSeasonalWeight(
    weights as SeasonWeightRow[],
    events as SeasonEventRow[],
    nicheId,
    date,
  );
}
