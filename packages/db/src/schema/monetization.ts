// Monetization — featured listings + sponsorships (ADR-025).

import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { newsletterIssues } from "./audience.js";
import { businesses } from "./businesses.js";
import { articles } from "./editorial.js";
import { sites } from "./sites.js";

export const featuredPlacement = pgEnum("featured_placement", [
  "hero",
  "category_top",
  "sidebar",
  "newsletter",
]);

export const featuredListings = pgTable("featured_listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id),
  placement: featuredPlacement("placement").notNull(),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  amountCents: integer("amount_cents").notNull(),
  newsletterMentionsRemaining: integer("newsletter_mentions_remaining").default(4),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sponsorships = pgTable("sponsorships", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id),
  issueId: uuid("issue_id").references(() => newsletterIssues.id),
  articleId: uuid("article_id").references(() => articles.id),
  type: text("type").notNull(),
  amountCents: integer("amount_cents").notNull(),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  status: text("status").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
