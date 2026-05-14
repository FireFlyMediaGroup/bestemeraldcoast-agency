// Agent runs + budgets (ADR-018 cost monitoring, ADR-019 prompt versioning).

import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const agentRuns = pgTable("agent_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentName: text("agent_name").notNull(),
  promptVersion: integer("prompt_version"),
  invokedBy: text("invoked_by").notNull(),
  inputLeadIds: jsonb("input_lead_ids").$type<string[]>(),
  outputSummary: text("output_summary"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  cacheCreationTokens: integer("cache_creation_tokens"),
  cacheReadTokens: integer("cache_read_tokens"),
  costUsd: numeric("cost_usd"),
  durationMs: integer("duration_ms"),
  status: text("status").notNull(),
  error: text("error"),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const agentBudgets = pgTable("agent_budgets", {
  agentName: text("agent_name").primaryKey(),
  dailyBudgetUsd: numeric("daily_budget_usd").notNull(),
  monthlyBudgetUsd: numeric("monthly_budget_usd").notNull(),
  hardStop: boolean("hard_stop").default(true).notNull(),
});
