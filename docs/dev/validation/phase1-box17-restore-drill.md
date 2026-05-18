# Phase 1 Gate — Box 17: Restore Drill Runbook (ADR-006)

**Purpose:** prove the Neon backup actually restores, and produce a timed DR runbook (not a theoretical one).
**Acceptance (per `next-step.md`):** restore the Neon backup to a **scratch branch**, **verify row counts**, **document the runbook timing.**
**Who:** operator-run (needs Neon console / API access). Read-only against the scratch branch — production is never touched.

> Neon terminology: a **branch** is a copy-on-write clone. Restoring "to a point in time" = create a new branch with its head set to a past timestamp (PITR, within the project's history-retention window). That branch is the "scratch branch" for this drill. Production branch stays untouched.

---

## 0. Prereqs

- Neon project access (console or `neonctl` CLI authenticated).
- `psql` available locally (or use the Neon SQL editor).
- The production branch name (typically `main`/`production`) and the project id.
- This drill expects the **2026-05-18 baseline snapshot** below. If you run the drill later, first re-capture production counts (Appendix A) and use those as "expected".

## 1. Record start time

`DRILL_START = ____________` (UTC). Note wall-clock at each step; the timing IS the deliverable.

## 2. Create the restore (scratch) branch from backup

Pick a restore point inside the retention window (e.g. "now − 1 hour", or a labeled backup).

CLI:
```bash
# t0: branch-create issued
neonctl branches create \
  --project-id "<PROJECT_ID>" \
  --name "dr-drill-2026-05-18" \
  --parent "<PROD_BRANCH>" \
  --parent-timestamp "<ISO8601 restore point>"
# record t1: branch ready
```
(Console path: Branches → New branch → "Include data up to" a past time → Create.)

Record: `restore_point = ____`, `t0 = ____`, `t1 = ____`, **restore duration = t1 − t0 = ____**.

## 3. Connect to the scratch branch

```bash
neonctl connection-string dr-drill-2026-05-18 --project-id "<PROJECT_ID>"
psql "<scratch-branch connection string>"
```

## 4. Verify row counts (run on the SCRATCH branch)

```sql
select
 (select count(*) from sites)               as sites,
 (select count(*) from categories)          as categories,
 (select count(*) from authors)             as authors,
 (select count(*) from agent_budgets)       as agent_budgets,
 (select count(*) from niches)              as niches,
 (select count(*) from niche_category_map)  as niche_category_map,
 (select count(*) from season_weights)      as season_weights,
 (select count(*) from season_events)       as season_events,
 (select count(*) from businesses)          as businesses,
 (select count(*) from leads)               as leads,
 (select count(*) from lead_status_history) as lead_status_history,
 (select count(*) from agent_runs)          as agent_runs,
 (select count(*) from pipeline_signals)    as pipeline_signals;
```

Functional acceptance probe (ADR-040 seasonal weight — must return **1.5**):
```sql
select get_seasonal_weight('charter_fishing', date '2026-06-15');  -- expect 1.50
```
(If the function name differs in-schema, use the seed-documented call from `packages/db/src/season.ts`.)

### Expected vs restored

**Static/seed tables — must match EXACTLY** (these don't change after seed):

| Table | Expected | Restored | OK? |
|---|---|---|---|
| sites | 8 | | |
| categories | 48 | | |
| authors | 2 | | |
| agent_budgets | 9 | | |
| niches | 10 | | |
| niche_category_map | 30 | | |
| season_weights | 120 | | |
| season_events | 8 | | |
| `get_seasonal_weight('charter_fishing','2026-06-15')` | 1.50 | | |

**Dynamic tables — depend on the restore point.** Expected = whatever production held at `restore_point`. The 2026-05-18 production reference (post 3 Scout + 3 Diagnoser runs) was: `businesses=47, leads=11, lead_status_history=11, agent_runs=17, pipeline_signals=18`. Acceptance is **internal consistency**, not an exact match to a different timestamp:

| Check | Expected | Restored | OK? |
|---|---|---|---|
| businesses ≥ leads | true | | |
| leads == lead_status_history (every lead has ≥1 history row; 11==11 at ref) | consistent | | |
| pipeline_signals: each lead_added has a niche in `niches` | no orphans | | |
| no rows with future `created_at` beyond restore_point | true | | |

Orphan check:
```sql
select count(*) as orphan_signals
from pipeline_signals ps
left join niches n on n.id = ps.niche_id
where n.id is null;            -- expect 0
```

## 5. Record verify time + outcome

`t2 = ____` (verification complete). **Verify duration = t2 − t1 = ____.**
**Total drill time = t2 − DRILL_START = ____.**

Outcome: ☐ PASS (all static tables exact, probe = 1.50, no orphans, dynamic checks consistent) ☐ FAIL (list mismatches: __________)

## 6. Teardown

```bash
neonctl branches delete dr-drill-2026-05-18 --project-id "<PROJECT_ID>"
```
Confirm the scratch branch is gone (Branches list). Production unaffected (read-only clone, never written).

## 7. Record the result

Add a dated note + the filled timing table to `docs/dev/status/task-log.md` (box 17 line of the canonical `PHASE 1 GATE — STATUS` checklist) via a bookkeeping PR. Capture: restore_point, restore duration, verify duration, total time, PASS/FAIL. That timed runbook is the box-17 deliverable.

---

## Appendix A — re-capture production baseline (if running the drill on a later date)

Run against the **production** branch (read-only), then use these as "Expected" above:
```sql
select 'sites' t, count(*) n from sites
union all select 'categories', count(*) from categories
union all select 'authors', count(*) from authors
union all select 'agent_budgets', count(*) from agent_budgets
union all select 'niches', count(*) from niches
union all select 'niche_category_map', count(*) from niche_category_map
union all select 'season_weights', count(*) from season_weights
union all select 'season_events', count(*) from season_events
union all select 'businesses', count(*) from businesses
union all select 'leads', count(*) from leads
union all select 'lead_status_history', count(*) from lead_status_history
union all select 'agent_runs', count(*) from agent_runs
union all select 'pipeline_signals', count(*) from pipeline_signals
order by t;
```
