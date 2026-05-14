CREATE TYPE "public"."lead_status" AS ENUM('new', 'diagnosed', 'build_ready', 'approved_to_send', 'sent', 'replied', 'booked', 'closed_won', 'closed_lost');--> statement-breakpoint
CREATE TYPE "public"."reply_sentiment" AS ENUM('positive', 'negative', 'neutral', 'question', 'out_of_office', 'unsubscribe_request');--> statement-breakpoint
CREATE TYPE "public"."image_provenance" AS ENUM('owned', 'business_submitted', 'ai_generated', 'licensed_stock', 'unsplash_free', 'public_domain');--> statement-breakpoint
CREATE TYPE "public"."article_status" AS ENUM('draft', 'review', 'scheduled', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('listicle', 'profile', 'guide', 'event_coverage', 'news', 'sponsored', 'evergreen');--> statement-breakpoint
CREATE TYPE "public"."subscriber_status" AS ENUM('pending', 'active', 'unsubscribed', 'bounced', 'complained');--> statement-breakpoint
CREATE TYPE "public"."featured_placement" AS ENUM('hero', 'category_top', 'sidebar', 'newsletter');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('kickoff', 'design', 'build', 'review', 'launched', 'maintenance', 'paused', 'closed');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_id" uuid,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"domain" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text,
	"archetype" text NOT NULL,
	"theme_tokens" jsonb NOT NULL,
	"geo_center_lat" numeric,
	"geo_center_lng" numeric,
	"geo_radius_miles" integer,
	"is_hub" boolean DEFAULT false,
	"og_image_url" text,
	"favicon_url" text,
	"sending_from_name" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sites_slug_unique" UNIQUE("slug"),
	CONSTRAINT "sites_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "business_enrichment_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"field_name" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"source" text NOT NULL,
	"enriched_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"niche" text NOT NULL,
	"city" text NOT NULL,
	"primary_site_id" uuid,
	"google_place_id" text,
	"rating" numeric,
	"review_count" integer,
	"website_url" text,
	"website_status" text,
	"contact_channels" jsonb,
	"is_client" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"editorial_summary" text,
	"risk_flag" text,
	"do_not_contact" boolean DEFAULT false NOT NULL,
	"do_not_contact_reason" text,
	"do_not_contact_at" timestamp,
	"delisted_from_editorial" boolean DEFAULT false NOT NULL,
	"last_enriched_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "businesses_slug_unique" UNIQUE("slug"),
	CONSTRAINT "businesses_google_place_id_unique" UNIQUE("google_place_id")
);
--> statement-breakpoint
CREATE TABLE "lead_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"from_status" "lead_status",
	"to_status" "lead_status" NOT NULL,
	"changed_by" text NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"diagnosis" jsonb,
	"offer" jsonb,
	"mockup_url" text,
	"video_url" text,
	"notes" text,
	"locked_by" text,
	"locked_at" timestamp,
	"gap_score_snapshot" integer,
	"scoring_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "outreach_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"draft" text NOT NULL,
	"final_copy" text,
	"checker_pass" boolean DEFAULT false,
	"checker_score" integer,
	"checker_notes" jsonb,
	"approved_at" timestamp,
	"approved_by" text,
	"sent_at" timestamp,
	"sent_message_id" text,
	"replied_at" timestamp,
	"reply_body" text,
	"reply_sentiment" "reply_sentiment",
	"drafted_response" text,
	"response_sent_at" timestamp,
	"tracking_code" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "outreach_messages_tracking_code_unique" UNIQUE("tracking_code")
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blob_url" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"alt_text" text NOT NULL,
	"caption" text,
	"provenance" "image_provenance" NOT NULL,
	"attribution" text,
	"rights_expires_at" timestamp,
	"blurhash" text,
	"uploaded_by_id" text,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "article_businesses" (
	"article_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"rank" integer,
	CONSTRAINT "article_businesses_article_id_business_id_pk" PRIMARY KEY("article_id","business_id")
);
--> statement-breakpoint
CREATE TABLE "article_images" (
	"article_id" uuid NOT NULL,
	"image_id" uuid NOT NULL,
	"role" text NOT NULL,
	"position" integer,
	CONSTRAINT "article_images_article_id_image_id_role_pk" PRIMARY KEY("article_id","image_id","role")
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"body_mdx" text NOT NULL,
	"original_draft_body" text,
	"status" "article_status" DEFAULT 'draft' NOT NULL,
	"content_type" "content_type" DEFAULT 'listicle' NOT NULL,
	"author_id" uuid,
	"reviewed_by_id" uuid,
	"category_id" uuid,
	"hero_image_id" uuid,
	"tags" jsonb,
	"published_at" timestamp,
	"scheduled_for" timestamp,
	"syndicated_to_hub" boolean DEFAULT false,
	"hub_adapted_body" text,
	"hub_canonical_override" boolean DEFAULT false,
	"is_sponsored" boolean DEFAULT false NOT NULL,
	"sponsored_by_business_id" uuid,
	"sponsorship_disclosure" text,
	"meta_title" text,
	"meta_description" text,
	"og_image_id" uuid,
	"view_count" integer DEFAULT 0,
	"last_viewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"bio" text,
	"avatar_image_id" uuid,
	"is_ai" boolean DEFAULT false,
	"is_human_reviewer" boolean DEFAULT false,
	"email" text,
	"twitter" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "authors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "editorial_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"draft_body" text NOT NULL,
	"final_body" text NOT NULL,
	"edits_summary" text,
	"rejected_draft" boolean DEFAULT false,
	"rejection_reason" text,
	"prompt_version" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"recurrence" text,
	"venue_name" text,
	"venue_address" text,
	"venue_lat" numeric,
	"venue_lng" numeric,
	"ticket_url" text,
	"price_min" integer,
	"price_max" integer,
	"is_free" boolean DEFAULT false,
	"category" text,
	"hero_image_id" uuid,
	"associated_business_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "newsletter_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid,
	"issue_number" integer NOT NULL,
	"subject" text NOT NULL,
	"preheader" text,
	"content_mdx" text NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"recipient_count" integer,
	"open_count" integer DEFAULT 0,
	"click_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "newsletter_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" uuid NOT NULL,
	"subscriber_id" uuid NOT NULL,
	"sent_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"bounced_at" timestamp,
	"bounce_type" text
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"status" "subscriber_status" DEFAULT 'pending' NOT NULL,
	"primary_site_id" uuid,
	"interested_site_ids" jsonb DEFAULT '[]'::jsonb,
	"interested_categories" jsonb DEFAULT '[]'::jsonb,
	"source" text,
	"source_url" text,
	"ip_country" text,
	"last_opened_at" timestamp,
	"last_clicked_at" timestamp,
	"total_opens" integer DEFAULT 0,
	"total_clicks" integer DEFAULT 0,
	"double_opt_in_token" text,
	"confirmed_at" timestamp,
	"unsubscribed_at" timestamp,
	"unsubscribe_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "featured_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"placement" "featured_placement" NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"amount_cents" integer NOT NULL,
	"newsletter_mentions_remaining" integer DEFAULT 4,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsorships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"issue_id" uuid,
	"article_id" uuid,
	"type" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"status" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'todo' NOT NULL,
	"due_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid,
	"business_id" uuid NOT NULL,
	"offer_type" text NOT NULL,
	"contract_amount_cents" integer NOT NULL,
	"status" "project_status" DEFAULT 'kickoff' NOT NULL,
	"kickoff_at" timestamp,
	"launched_at" timestamp,
	"brief" jsonb,
	"live_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_budgets" (
	"agent_name" text PRIMARY KEY NOT NULL,
	"daily_budget_usd" numeric NOT NULL,
	"monthly_budget_usd" numeric NOT NULL,
	"hard_stop" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_name" text NOT NULL,
	"prompt_version" integer,
	"invoked_by" text NOT NULL,
	"input_lead_ids" jsonb,
	"output_summary" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"cache_creation_tokens" integer,
	"cache_read_tokens" integer,
	"cost_usd" numeric,
	"duration_ms" integer,
	"status" text NOT NULL,
	"error" text,
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_enrichment_log" ADD CONSTRAINT "business_enrichment_log_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_primary_site_id_sites_id_fk" FOREIGN KEY ("primary_site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_messages" ADD CONSTRAINT "outreach_messages_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_businesses" ADD CONSTRAINT "article_businesses_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_businesses" ADD CONSTRAINT "article_businesses_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_images" ADD CONSTRAINT "article_images_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_images" ADD CONSTRAINT "article_images_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_reviewed_by_id_authors_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."authors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_hero_image_id_images_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."images"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_sponsored_by_business_id_businesses_id_fk" FOREIGN KEY ("sponsored_by_business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_og_image_id_images_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."images"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editorial_feedback" ADD CONSTRAINT "editorial_feedback_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_hero_image_id_images_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."images"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_associated_business_id_businesses_id_fk" FOREIGN KEY ("associated_business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_issues" ADD CONSTRAINT "newsletter_issues_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_sends" ADD CONSTRAINT "newsletter_sends_issue_id_newsletter_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."newsletter_issues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_sends" ADD CONSTRAINT "newsletter_sends_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_primary_site_id_sites_id_fk" FOREIGN KEY ("primary_site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_listings" ADD CONSTRAINT "featured_listings_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_listings" ADD CONSTRAINT "featured_listings_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorships" ADD CONSTRAINT "sponsorships_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorships" ADD CONSTRAINT "sponsorships_issue_id_newsletter_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."newsletter_issues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorships" ADD CONSTRAINT "sponsorships_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cat_site_slug" ON "categories" USING btree ("site_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "article_site_slug_unique" ON "articles" USING btree ("site_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "event_site_slug" ON "events" USING btree ("site_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_sends_unique" ON "newsletter_sends" USING btree ("issue_id","subscriber_id");