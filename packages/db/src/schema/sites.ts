// Sites + categories (ADR-008, ADR-010, ADR-021, ADR-032).

import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { SiteTheme } from "./types.js";

export const sites = pgTable("sites", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  domain: text("domain").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline"),
  archetype: text("archetype").notNull(), // 'magazine' | 'coastal' | 'premium' (ADR-032)
  themeTokens: jsonb("theme_tokens").$type<SiteTheme>().notNull(),
  geoCenterLat: numeric("geo_center_lat"),
  geoCenterLng: numeric("geo_center_lng"),
  geoRadiusMiles: integer("geo_radius_miles"),
  isHub: boolean("is_hub").default(false),
  ogImageUrl: text("og_image_url"),
  faviconUrl: text("favicon_url"),
  sendingFromName: text("sending_from_name"), // e.g. 'Pensacola Weekly'
  // ADR-040 editorial rotation: per-site weekly article floor/ceiling the
  // Curator's brief-queue generator targets (master plan Commit 1.10).
  minimumWeeklyArticles: integer("minimum_weekly_articles").default(2),
  maximumWeeklyArticles: integer("maximum_weekly_articles").default(3),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    parentId: uuid("parent_id"),
    sortOrder: integer("sort_order").default(0),
  },
  (t) => ({
    siteSlugUnique: uniqueIndex("cat_site_slug").on(t.siteId, t.slug),
  }),
);
