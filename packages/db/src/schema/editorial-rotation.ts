// Editorial rotation foundation (ADR-040 — editorial-pipeline coupling &
// niche rotation). These five tables are the static + event-log inputs the
// Curator scoring algorithm reads. Definitions follow the Editorial Rotation
// Specification in the master project plan verbatim, with one deliberate
// addition noted below.

import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { leads } from "./leads.js";
import type { Archetype } from "./types.js";

// The 10 priority niches. `id` is a stable text slug ('charter_fishing'),
// referenced by the four child tables.
export const niches = pgTable("niches", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  commercialValue: integer("commercial_value").notNull(), // 0-100
  editorialValue: integer("editorial_value").notNull(), // 0-100
  primaryArchetypes: jsonb("primary_archetypes")
    .$type<Archetype[]>()
    .notNull(),
  excludedArchetypes: jsonb("excluded_archetypes")
    .$type<Archetype[]>()
    .default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const nicheCategoryMap = pgTable(
  "niche_category_map",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nicheId: text("niche_id")
      .notNull()
      .references(() => niches.id),
    archetype: text("archetype").notNull(), // 'magazine' | 'coastal' | 'premium'
    primaryCategorySlug: text("primary_category_slug").notNull(),
    secondaryCategorySlug: text("secondary_category_slug"),
    isExcluded: boolean("is_excluded").default(false).notNull(),
  },
  (t) => ({
    uniqueMapping: uniqueIndex("niche_archetype_unique").on(
      t.nicheId,
      t.archetype,
    ),
  }),
);

export const seasonWeights = pgTable(
  "season_weights",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nicheId: text("niche_id")
      .notNull()
      .references(() => niches.id),
    month: integer("month").notNull(), // 1-12
    multiplier: numeric("multiplier").notNull(), // 0.5 - 2.0
    notes: text("notes"),
  },
  (t) => ({
    uniqueNicheMonth: uniqueIndex("niche_month_unique").on(
      t.nicheId,
      t.month,
    ),
  }),
);

export const seasonEvents = pgTable(
  "season_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    boostedNicheIds: jsonb("boosted_niche_ids").$type<string[]>().notNull(),
    multiplier: numeric("multiplier").notNull(),
    notes: text("notes"),
  },
  (t) => ({
    // Deliberate addition beyond the spec's column list: a unique index on
    // `name`. The spec defines no natural key, but the seed must be
    // idempotent (`onConflictDoNothing`) like every other seeded table —
    // event names are unique by construction, so this is the natural key
    // and changes no behavior for readers.
    uniqueName: uniqueIndex("season_events_name_unique").on(t.name),
  }),
);

export const pipelineSignals = pgTable(
  "pipeline_signals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nicheId: text("niche_id")
      .notNull()
      .references(() => niches.id),
    city: text("city").notNull(),
    signalType: text("signal_type").notNull(), // 'lead_added' | 'diagnosis_done' | 'reply_received' | …
    signalStrength: integer("signal_strength").notNull(),
    leadId: uuid("lead_id").references(() => leads.id),
    occurredAt: timestamp("occurred_at").defaultNow(),
  },
  (t) => ({
    byNicheCity: index("pipeline_signals_niche_city").on(
      t.nicheId,
      t.city,
      t.occurredAt,
    ),
  }),
);
