// Agency projects + project tasks (ADR-026, ADR-041).

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
import { leads } from "./leads.js";
import type { ProjectBrief } from "./types.js";

export const projectStatus = pgEnum("project_status", [
  "kickoff",
  "design",
  "build",
  "review",
  "launched",
  "maintenance",
  "paused",
  "closed",
]);

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id),
  offerType: text("offer_type").notNull(),
  contractAmountCents: integer("contract_amount_cents").notNull(),
  status: projectStatus("status").notNull().default("kickoff"),
  kickoffAt: timestamp("kickoff_at"),
  launchedAt: timestamp("launched_at"),
  brief: jsonb("brief").$type<ProjectBrief>(),
  liveUrl: text("live_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectTasks = pgTable("project_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"),
  dueAt: timestamp("due_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
