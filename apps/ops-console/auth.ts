// NextAuth v5 (Auth.js) config — magic-link sign-in over Resend (Commit 1.4).
//
// - Provider: Resend email (magic link). Requires a DB adapter to persist
//   verification tokens (magic links are inherently stateful) — we use
//   @auth/drizzle-adapter over @bec/db's Pool-driver client + the Auth.js
//   tables added in migration 0001.
// - Allow-list: the `signIn` callback rejects every address except the
//   single operator email (serverEnv.OPERATOR_EMAIL). This is the master
//   plan's "single allow-listed email" requirement.
// - Session: JWT strategy so route guards can check the session at the edge
//   without a DB round-trip. The adapter is still required for the email
//   provider's verification-token flow even under JWT sessions.
// - All secrets come from @bec/config's validated serverEnv (ADR-038); we
//   never read process.env directly here.
// - Lazy initialization (Auth.js v5): the config is a factory, not a literal.
//   `getDb()` and every `serverEnv.*` read happen per-request, not at module
//   load. `next build` imports this module (for middleware + the /api/auth
//   route) under NODE_ENV=production, which makes @bec/config's parseEnv()
//   apply `productionRequired` — with no app-level .env at build time the
//   prod secrets are absent and a module-scope read would boot-fail the
//   whole build. Deferring to the factory keeps build-time import inert;
//   the env is only resolved when a request actually hits auth.

import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb, schema } from "@bec/db";
import { serverEnv } from "@bec/config";
import NextAuth, { type NextAuthResult } from "next-auth";
import Resend from "next-auth/providers/resend";

const result = NextAuth(() => {
  const operatorEmail = serverEnv.OPERATOR_EMAIL?.toLowerCase();

  return {
    adapter: DrizzleAdapter(getDb(), {
      usersTable: schema.users,
      accountsTable: schema.accounts,
      sessionsTable: schema.sessions,
      verificationTokensTable: schema.verificationTokens,
    }),
    session: { strategy: "jwt" },
    secret: serverEnv.NEXTAUTH_SECRET,
    trustHost: true,
    providers: [
      Resend({
        apiKey: serverEnv.RESEND_API_KEY,
        // Verified sending domain is configured in Resend + DNS (ADR-013).
        // `from` falls back to Resend's onboarding sender if unset so local
        // dev doesn't hard-fail before the domain is verified.
        from: "ops@bestemeraldcoast.com",
      }),
    ],
    pages: {
      signIn: "/login",
      verifyRequest: "/login?check=1",
      error: "/login?error=1",
    },
    callbacks: {
      // Hard allow-list. Even though Resend only mails the address the user
      // typed, the token is verifiable by anyone who receives it — so we
      // gate on the resolved email here, server-side, on every sign-in.
      signIn({ user }) {
        const email = user.email?.toLowerCase();
        if (!email || !operatorEmail) return false;
        return email === operatorEmail;
      },
    },
  };
});

// Explicit `NextAuthResult` annotations rather than bare destructuring:
// under pnpm's symlinked node_modules, tsc can't "name" the inferred types
// without a non-portable reference into next-auth/@auth internals (TS2742).
// This is the Auth.js-documented workaround for the v5 + pnpm combination.
export const handlers: NextAuthResult["handlers"] = result.handlers;
export const auth: NextAuthResult["auth"] = result.auth;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;
