CREATE TABLE "niche_category_map" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"niche_id" text NOT NULL,
	"archetype" text NOT NULL,
	"primary_category_slug" text NOT NULL,
	"secondary_category_slug" text,
	"is_excluded" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "niches" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"commercial_value" integer NOT NULL,
	"editorial_value" integer NOT NULL,
	"primary_archetypes" jsonb NOT NULL,
	"excluded_archetypes" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pipeline_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"niche_id" text NOT NULL,
	"city" text NOT NULL,
	"signal_type" text NOT NULL,
	"signal_strength" integer NOT NULL,
	"lead_id" uuid,
	"occurred_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "season_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"boosted_niche_ids" jsonb NOT NULL,
	"multiplier" numeric NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "season_weights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"niche_id" text NOT NULL,
	"month" integer NOT NULL,
	"multiplier" numeric NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "minimum_weekly_articles" integer DEFAULT 2;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "maximum_weekly_articles" integer DEFAULT 3;--> statement-breakpoint
ALTER TABLE "niche_category_map" ADD CONSTRAINT "niche_category_map_niche_id_niches_id_fk" FOREIGN KEY ("niche_id") REFERENCES "public"."niches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_signals" ADD CONSTRAINT "pipeline_signals_niche_id_niches_id_fk" FOREIGN KEY ("niche_id") REFERENCES "public"."niches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_signals" ADD CONSTRAINT "pipeline_signals_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_weights" ADD CONSTRAINT "season_weights_niche_id_niches_id_fk" FOREIGN KEY ("niche_id") REFERENCES "public"."niches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "niche_archetype_unique" ON "niche_category_map" USING btree ("niche_id","archetype");--> statement-breakpoint
CREATE INDEX "pipeline_signals_niche_city" ON "pipeline_signals" USING btree ("niche_id","city","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "season_events_name_unique" ON "season_events" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "niche_month_unique" ON "season_weights" USING btree ("niche_id","month");