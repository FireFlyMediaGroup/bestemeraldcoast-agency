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
// - Edge middleware uses `auth.config.ts` only (JWT slice, `process.env`);
//   see middleware.ts + https://authjs.dev/guides/edge-compatibility.
// - This file keeps Route / RSC `auth` + handlers on Drizzle + `serverEnv`
//   (ADR-038); never import it from middleware or the Edge bundle pulls pg.
// - Build-time inertness (Auth.js v5): the config is an **async factory**,
//   and `@bec/config` + `@bec/db` are **dynamically imported inside it** —
//   never at module scope. This matters: `@bec/config`'s `index.ts` runs
//   `parseEnv()` at *module load*, so a top-level `import { serverEnv }` (or
//   importing `@bec/db`, which transitively imports `@bec/config`) would fire
//   full env validation — including `productionRequired` — the moment
//   `next build` imports this file under NODE_ENV=production, with no
//   app-level .env present → build boot-fail. (A lazy NextAuth factory alone
//   does NOT fix this; the import statements themselves are the trigger.)
//   Keeping only `next-auth` + `@auth/drizzle-adapter` + `./auth.config`
//   (no `@bec/*`) at module scope and deferring the env-touching packages
//   into the per-request async factory makes the module genuinely inert at
//   build time.
// - Route / handlers use validated `serverEnv` for secrets; middleware uses
//   `auth.config.ts` + `process.env` for JWT only (ADR-038 on Node routes).

import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth, { type NextAuthResult } from "next-auth";
import Resend from "next-auth/providers/resend";

import authConfig from "./auth.config";

const result = NextAuth(async () => {
  // Dynamic — runs per-request, not at module load / `next build`.
  const { serverEnv } = await import("@bec/config");
  const { getDb, schema } = await import("@bec/db");

  const operatorEmail = serverEnv.OPERATOR_EMAIL?.toLowerCase();

  return {
    ...authConfig,
    adapter: DrizzleAdapter(getDb(), {
      usersTable: schema.users,
      accountsTable: schema.accounts,
      sessionsTable: schema.sessions,
      verificationTokensTable: schema.verificationTokens,
    }),
    secret: serverEnv.NEXTAUTH_SECRET,
    providers: [
      Resend({
        apiKey: serverEnv.RESEND_API_KEY,
        // Resend `From` must use a verified domain. Production verifies
        // `ops.bestemeraldcoast.com` in Resend — not the apex `bestemeraldcoast.com`.
        from: "noreply@ops.bestemeraldcoast.com",
      }),
    ],
    callbacks: {
      ...authConfig.callbacks,
      // Hard allow-list via validated env (ADR-038). Mirrors auth.config
      // (middleware/edge) but uses serverEnv after parseEnv.
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
