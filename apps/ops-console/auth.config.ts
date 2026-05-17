// Edge-safe slice of Auth.js config for `middleware.ts` only.
//
// Middleware runs on the Edge bundle and cannot import `@/auth`, which pulls
// in DrizzleAdapter + `@bec/db` (TCP/pg). Session strategy is JWT, so the
// proxy only needs cookie/JWT settings — not the DB adapter. See
// https://authjs.dev/guides/edge-compatibility (split config).
//
// Route handlers use `auth.ts`, which spreads this object and adds the
// adapter + validated `serverEnv` values (ADR-038 / build-time inertness).

import type { NextAuthConfig } from "next-auth";
import Resend from "next-auth/providers/resend";

export default {
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login?check=1",
    error: "/login?error=1",
  },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY ?? "",
      from: "ops@bestemeraldcoast.com",
    }),
  ],
  callbacks: {
    signIn({ user }) {
      const operatorEmail = process.env.OPERATOR_EMAIL?.toLowerCase();
      const email = user.email?.toLowerCase();
      if (!email || !operatorEmail) return false;
      return email === operatorEmail;
    },
  },
} satisfies NextAuthConfig;
