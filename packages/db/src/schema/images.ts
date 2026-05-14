// Images — central store referenced by articles, events, authors (ADR-022).

import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const imageProvenance = pgEnum("image_provenance", [
  "owned",
  "business_submitted",
  "ai_generated",
  "licensed_stock",
  "unsplash_free",
  "public_domain",
]);

export const images = pgTable("images", {
  id: uuid("id").defaultRandom().primaryKey(),
  blobUrl: text("blob_url").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  altText: text("alt_text").notNull(), // required for accessibility (ADR-036)
  caption: text("caption"),
  provenance: imageProvenance("provenance").notNull(),
  attribution: text("attribution"),
  rightsExpiresAt: timestamp("rights_expires_at"),
  blurhash: text("blurhash"),
  uploadedById: text("uploaded_by_id"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});
