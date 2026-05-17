// Edge auth guard. Import only `auth.config` + a minimal NextAuth instance —
// not `@/auth`. The full `auth.ts` pulls DrizzleAdapter + `@bec/db` into the
// middleware bundle and Vercel Edge rejects it. JWT sessions only need this
// edge-safe slice. See auth.config.ts + https://authjs.dev/guides/edge-compatibility

import NextAuth from "next-auth";

import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isAuthed = Boolean(req.auth);
  const { pathname, search } = req.nextUrl;

  if (!isAuthed) {
    const loginUrl = new URL("/login", req.nextUrl);
    // Preserve where the operator was headed so login can bounce back.
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname + search);
    }
    return Response.redirect(loginUrl);
  }
  // Authed — fall through (returning undefined lets the request proceed).
});

export const config = {
  // Guard everything except: Next internals, the auth API (must stay
  // reachable for the magic-link callback), the login page itself, and
  // common static files.
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
  ],
};
