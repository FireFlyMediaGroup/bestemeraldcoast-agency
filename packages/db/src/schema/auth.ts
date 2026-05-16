// Auth.js (NextAuth v5) tables — required by @auth/drizzle-adapter.
//
// The master plan's Database Schema section does not enumerate auth tables;
// it predates the Commit 1.4 auth-implementation detail. Magic-link sign-in
// (Resend provider) fundamentally cannot work without persisting verification
// tokens, so these four tables are necessary infrastructure for Commit 1.4 to
// satisfy its own acceptance ("magic link works end-to-end"). The shape here
// is the canonical @auth/drizzle-adapter Postgres schema — do not customize
// it away from the adapter's expectations (ADR-016/consistency: adapter
// upgrades assume this exact shape).
//
// Only the operator's allow-listed email ever reaches these tables (the
// NextAuth signIn callback rejects everyone else), so `users` is effectively
// a single-row table for now; the structure is kept standard for when
// additional internal roles arrive.

import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    // @auth/drizzle-adapter's DefaultPostgresAccountsTable expects these JS
    // keys verbatim — a deliberate snake_case quirk in the adapter's typed
    // contract (userId / providerAccountId stay camelCase, the OAuth token
    // fields are snake_case). Renaming away from this breaks the adapter's
    // structural type check. DB column names (the text("…") args) are
    // unchanged, so migration 0001 is unaffected.
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
    // FK column index — the adapter looks accounts up by userId and the
    // ON DELETE cascade from users needs it to avoid a seq scan as rows grow.
    userIdIdx: index("accounts_user_id_idx").on(t.userId),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => ({
    // FK column index — sessions are looked up / cascade-deleted by userId.
    userIdIdx: index("sessions_user_id_idx").on(t.userId),
  }),
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
  }),
);
