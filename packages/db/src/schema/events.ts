// Events — separate content type per ADR-028.

import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { businesses } from "./businesses.js";
import { images } from "./images.js";
import { sites } from "./sites.js";

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    recurrence: text("recurrence"),
    venueName: text("venue_name"),
    venueAddress: text("venue_address"),
    venueLat: numeric("venue_lat"),
    venueLng: numeric("venue_lng"),
    ticketUrl: text("ticket_url"),
    priceMin: integer("price_min"),
    priceMax: integer("price_max"),
    isFree: boolean("is_free").default(false),
    category: text("category"),
    heroImageId: uuid("hero_image_id").references(() => images.id),
    associatedBusinessId: uuid("associated_business_id").references(() => businesses.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    siteSlugUnique: uniqueIndex("event_site_slug").on(t.siteId, t.slug),
  }),
);
