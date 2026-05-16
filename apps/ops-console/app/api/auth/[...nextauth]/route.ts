// Auth.js v5 route handlers. The `handlers` export from `auth.ts` provides
// both GET and POST for the entire /api/auth/* surface (sign-in, callback,
// magic-link verification, sign-out, session).
//
// DEFERRED to Commit 1.5 (intentionally not wrapped here): ADR-017 Upstash
// rate-limiting + ADR-012 error capture on this route. Rationale: the
// Upstash rate-limit infrastructure does not exist yet — Commit 1.5
// ("Internal agent API") is the commit that introduces it ("Rate-limit per
// ADR-017") and is the right place to apply the shared limiter uniformly
// across the auth route and the agent API. Adding a half-wired limiter now,
// before the Upstash env is even in the validated schema, would be premature
// and create a second divergent rate-limit code path. Auth payloads are also
// NextAuth-framework-owned; hand-rolling Zod validation of its internal
// request shapes is fragile and unnecessary (the magic-link allow-list in
// auth.ts's signIn callback is the real authorization gate). Tracked, not
// dismissed — revisit when Commit 1.5 lands the shared limiter.

import { handlers } from "@/auth";

export const { GET, POST } = handlers;
