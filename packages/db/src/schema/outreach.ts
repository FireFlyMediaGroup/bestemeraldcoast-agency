// Outreach messages — drafts + checker grading + send + reply (ADR-024, ADR-034).

import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { leads } from "./leads.js";

export const replySentiment = pgEnum("reply_sentiment", [
  "positive",
  "negative",
  "neutral",
  "question",
  "out_of_office",
  "unsubscribe_request",
]);

export const outreachMessages = pgTable("outreach_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id),
  channel: text("channel").notNull(), // 'email' | 'sms' | 'ig_dm'
  draft: text("draft").notNull(),
  finalCopy: text("final_copy"),
  checkerPass: boolean("checker_pass").default(false),
  checkerScore: integer("checker_score"), // 0-12 per ADR-034
  checkerNotes: jsonb("checker_notes"),
  approvedAt: timestamp("approved_at"),
  approvedBy: text("approved_by"),
  sentAt: timestamp("sent_at"),
  sentMessageId: text("sent_message_id"),
  repliedAt: timestamp("replied_at"),
  replyBody: text("reply_body"),
  replySentiment: replySentiment("reply_sentiment"),
  draftedResponse: text("drafted_response"),
  responseSentAt: timestamp("response_sent_at"),
  trackingCode: text("tracking_code").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});
