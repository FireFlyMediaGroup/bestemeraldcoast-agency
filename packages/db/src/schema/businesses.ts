// Businesses + enrichment log (ADR-023, ADR-031).

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

import { sites } from "./sites.js";
import type { ContactChannel } from "./types.js";

export const businesses = pgTable("businesses", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  niche: text("niche").notNull(),
  city: text("city").notNull(),
  primarySiteId: uuid("primary_site_id").references(() => sites.id),
  googlePlaceId: text("google_place_id").unique(),
  rating: numeric("rating"),
  reviewCount: integer("review_count"),
  websiteUrl: text("website_url"),
  websiteStatus: text("website_status"), // 'none' | 'outdated' | 'modern'
  contactChannels: jsonb("contact_channels").$type<ContactChannel[]>(),
  isClient: boolean("is_client").default(false),
  isFeatured: boolean("is_featured").default(false),
  editorialSummary: text("editorial_summary"),
  // ADR-031: risk flag + do-not-contact list.
  riskFlag: text("risk_flag"), // 'high' | 'medium' | 'low' | null
  doNotContact: boolean("do_not_contact").default(false).notNull(),
  doNotContactReason: text("do_not_contact_reason"),
  doNotContactAt: timestamp("do_not_contact_at"),
  delistedFromEditorial: boolean("delisted_from_editorial").default(false).notNull(),
  lastEnrichedAt: timestamp("last_enriched_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const businessEnrichmentLog = pgTable("business_enrichment_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id),
  fieldName: text("field_name").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  source: text("source").notNull(), // 'scout' | 'diagnoser' | 'cron' | 'operator'
  enrichedAt: timestamp("enriched_at").defaultNow(),
});
