// Audience — subscribers + newsletter issues + per-send delivery records
// (ADR-013, ADR-017 for double-opt-in tokens).

import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { sites } from "./sites.js";

export const subscriberStatus = pgEnum("subscriber_status", [
  "pending",
  "active",
  "unsubscribed",
  "bounced",
  "complained",
]);

export const subscribers = pgTable("subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  status: subscriberStatus("status").notNull().default("pending"),
  primarySiteId: uuid("primary_site_id").references(() => sites.id),
  interestedSiteIds: jsonb("interested_site_ids").$type<string[]>().default([]),
  interestedCategories: jsonb("interested_categories").$type<string[]>().default([]),
  source: text("source"),
  sourceUrl: text("source_url"),
  ipCountry: text("ip_country"),
  lastOpenedAt: timestamp("last_opened_at"),
  lastClickedAt: timestamp("last_clicked_at"),
  totalOpens: integer("total_opens").default(0),
  totalClicks: integer("total_clicks").default(0),
  doubleOptInToken: text("double_opt_in_token"),
  confirmedAt: timestamp("confirmed_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  unsubscribeReason: text("unsubscribe_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsletterIssues = pgTable("newsletter_issues", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id").references(() => sites.id),
  issueNumber: integer("issue_number").notNull(),
  subject: text("subject").notNull(),
  preheader: text("preheader"),
  contentMdx: text("content_mdx").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  recipientCount: integer("recipient_count"),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const newsletterSends = pgTable(
  "newsletter_sends",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => newsletterIssues.id),
    subscriberId: uuid("subscriber_id")
      .notNull()
      .references(() => subscribers.id),
    sentAt: timestamp("sent_at"),
    openedAt: timestamp("opened_at"),
    clickedAt: timestamp("clicked_at"),
    bouncedAt: timestamp("bounced_at"),
    bounceType: text("bounce_type"),
  },
  (t) => ({
    uniqueIssueSubscriber: uniqueIndex("newsletter_sends_unique").on(t.issueId, t.subscriberId),
  }),
);
