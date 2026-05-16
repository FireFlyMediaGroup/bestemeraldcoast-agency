// Edge auth guard. Auth.js v5's `auth` export doubles as middleware: it
// populates `req.auth` from the JWT session. Any request into the protected
// surface without a session is redirected to /login. The matcher excludes
// the auth API, the login page, and Next internals so the redirect can't
// loop and static assets stay public.

import { auth } from "@/auth";

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
