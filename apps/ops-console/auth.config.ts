// Edge-safe slice of Auth.js config for `middleware.ts` only.
//
// Middleware runs on the Edge bundle and cannot import `@/auth`, which pulls
// in DrizzleAdapter + `@bec/db` (TCP/pg). Session strategy is JWT, so the
// proxy only needs cookie/JWT settings — not the DB adapter. See
// https://authjs.dev/guides/edge-compatibility (split config).
//
// Route handlers use `auth.ts`, which spreads this object and adds the
// adapter + the Resend (Email) provider + validated `serverEnv` values
// (ADR-038 / build-time inertness).
//
// `providers` is intentionally EMPTY here. The Resend provider is an Email
// provider, which Auth.js requires a database adapter for. `middleware.ts`
// builds its NextAuth instance from this config with **no adapter** (the
// adapter is the very thing that can't run on Edge). If the Email provider
// were present here, Auth.js's per-request config assertion in the Edge
// middleware would throw `MissingAdapter`, breaking every authenticated
// request in production. Reading/validating an existing JWT session (all
// the middleware does) needs `secret` + `session`, not `providers` — so
// the edge slice keeps providers empty and the Email provider lives only
// in `auth.ts` (which has the adapter). This is the Auth.js-documented
// split for Email providers + Edge middleware.

import type { NextAuthConfig } from "next-auth";

export default {
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login?check=1",
    error: "/login?error=1",
  },
  providers: [],
  callbacks: {
    signIn({ user }) {
      const operatorEmail = process.env.OPERATOR_EMAIL?.toLowerCase();
      const email = user.email?.toLowerCase();
      if (!email || !operatorEmail) return false;
      return email === operatorEmail;
    },
  },
} satisfies NextAuthConfig;
