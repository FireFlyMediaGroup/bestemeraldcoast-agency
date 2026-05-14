// Lead pipeline (ADRs flowing through Phase 1-2: 003, 019, 040).

import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { businesses } from "./businesses.js";
import type { Diagnosis, Offer } from "./types.js";

export const leadStatus = pgEnum("lead_status", [
  "new",
  "diagnosed",
  "build_ready",
  "approved_to_send",
  "sent",
  "replied",
  "booked",
  "closed_won",
  "closed_lost",
]);

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id),
  status: leadStatus("status").notNull().default("new"),
  diagnosis: jsonb("diagnosis").$type<Diagnosis>(),
  offer: jsonb("offer").$type<Offer>(),
  mockupUrl: text("mockup_url"),
  videoUrl: text("video_url"),
  notes: text("notes"),
  lockedBy: text("locked_by"),
  lockedAt: timestamp("locked_at"),
  gapScoreSnapshot: integer("gap_score_snapshot"),
  scoringVersion: integer("scoring_version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leadStatusHistory = pgTable("lead_status_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id),
  fromStatus: leadStatus("from_status"),
  toStatus: leadStatus("to_status").notNull(),
  changedBy: text("changed_by").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});
