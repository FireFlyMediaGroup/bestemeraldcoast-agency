// Editorial — articles, authors, article↔business + article↔image joins,
// editorial feedback loop (ADR-014, ADR-015, ADR-020, ADR-027).

import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { businesses } from "./businesses.js";
import { images } from "./images.js";
import { categories, sites } from "./sites.js";

export const articleStatus = pgEnum("article_status", [
  "draft",
  "review",
  "scheduled",
  "published",
  "archived",
]);

export const contentType = pgEnum("content_type", [
  "listicle",
  "profile",
  "guide",
  "event_coverage",
  "news",
  "sponsored",
  "evergreen",
]);

// Authors (ADR-027). Defined before `articles` because articles.authorId /
// reviewedById close over `authors.id`.
export const authors = pgTable("authors", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  // No .references() — avoid the circular images → authors → images cycle.
  // App-level constraint: avatarImageId, when set, must point at an images row.
  avatarImageId: uuid("avatar_image_id"),
  isAi: boolean("is_ai").default(false),
  isHumanReviewer: boolean("is_human_reviewer").default(false),
  email: text("email"),
  twitter: text("twitter"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    bodyMdx: text("body_mdx").notNull(),
    // Editor's first draft, preserved verbatim for ADR-020 training-data capture.
    originalDraftBody: text("original_draft_body"),
    status: articleStatus("status").notNull().default("draft"),
    contentType: contentType("content_type").notNull().default("listicle"),
    authorId: uuid("author_id").references(() => authors.id),
    reviewedById: uuid("reviewed_by_id").references(() => authors.id),
    categoryId: uuid("category_id").references(() => categories.id),
    heroImageId: uuid("hero_image_id").references(() => images.id),
    tags: jsonb("tags").$type<string[]>(),
    publishedAt: timestamp("published_at"),
    scheduledFor: timestamp("scheduled_for"),
    // Hub syndication (ADR-010).
    syndicatedToHub: boolean("syndicated_to_hub").default(false),
    hubAdaptedBody: text("hub_adapted_body"),
    hubCanonicalOverride: boolean("hub_canonical_override").default(false),
    // Sponsored content (ADR-015).
    isSponsored: boolean("is_sponsored").default(false).notNull(),
    sponsoredByBusinessId: uuid("sponsored_by_business_id").references(() => businesses.id),
    sponsorshipDisclosure: text("sponsorship_disclosure"),
    // SEO.
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    ogImageId: uuid("og_image_id").references(() => images.id),
    viewCount: integer("view_count").default(0),
    lastViewedAt: timestamp("last_viewed_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    siteSlugUnique: uniqueIndex("article_site_slug_unique").on(t.siteId, t.slug),
  }),
);

export const articleBusinesses = pgTable(
  "article_businesses",
  {
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id),
    rank: integer("rank"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.articleId, t.businessId] }),
  }),
);

export const articleImages = pgTable(
  "article_images",
  {
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id),
    imageId: uuid("image_id")
      .notNull()
      .references(() => images.id),
    role: text("role").notNull(), // 'hero' | 'inline' | 'gallery' | 'og_card'
    position: integer("position"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.articleId, t.imageId, t.role] }),
  }),
);

// Editor feedback loop (ADR-020) — captures the draft → final delta so future
// prompt tuning can train on what the operator actually rewrites.
export const editorialFeedback = pgTable("editorial_feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  articleId: uuid("article_id")
    .notNull()
    .references(() => articles.id),
  draftBody: text("draft_body").notNull(),
  finalBody: text("final_body").notNull(),
  editsSummary: text("edits_summary"),
  rejectedDraft: boolean("rejected_draft").default(false),
  rejectionReason: text("rejection_reason"),
  promptVersion: integer("prompt_version"),
  createdAt: timestamp("created_at").defaultNow(),
});
