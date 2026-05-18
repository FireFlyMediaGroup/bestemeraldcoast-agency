// Composes the agent-API request pipeline so each route file stays a thin
// body: (1) Bearer AGENT_API_KEY auth → 401, (2) ADR-017 rate limit
// (60/key/min) → 429, (3) error capture via @bec/logger (ADR-012) → 500.
// All env-touching packages are dynamically imported (build-inert).

import { agentKeyId, requireAgentAuth } from "./agent-auth.js";
import { checkRateLimit, tooManyRequests } from "./ratelimit.js";

// Next 16 dynamic-segment params arrive as a Promise. The wrapper is generic
// over the params shape so each route's exported handler matches Next's
// generated typed-route constraint: a `[id]` route's context is
// `Promise<{ id: string }>`; a non-dynamic route's is `Promise<{}>`. A single
// hardcoded `{ id: string }` made every non-dynamic agent route fail
// `next build` ("Property 'id' is missing in type '{}'"). That error only
// surfaces in `next build` / `next typegen` (the `.next/types` route
// constraints don't exist under a bare `tsc --noEmit`), so it passed CI and
// only broke on Vercel.
//
// Default `Record<never, never>` (lint-safe empty object) matches Next's
// non-dynamic `Promise<{}>`. Dynamic routes call `agentRoute<{ id: string }>`
// so `id` stays a concrete `string` — a Record index access would be
// `string | undefined` under noUncheckedIndexedAccess and every
// `eq(col, id)` would reject the `undefined`.
export type RouteCtx<P = Record<never, never>> = { params: Promise<P> };

type Handler<P = Record<never, never>> = (
  req: Request,
  ctx: RouteCtx<P>,
) => Promise<Response>;

export function agentRoute<P = Record<never, never>>(
  handler: Handler<P>,
): Handler<P> {
  return async (req, ctx) => {
    // The try spans auth + rate-limit + handler so a throw from ANY of them
    // is logged + converted to 500 (not just handler throws).
    try {
      const unauthorized = await requireAgentAuth(req);
      if (unauthorized) return unauthorized;

      const rl = await checkRateLimit("agentApi", agentKeyId(req));
      if (!rl.success) return tooManyRequests(rl);

      return await handler(req, ctx);
    } catch (err) {
      const { logger } = await import("@bec/logger");
      logger.error(
        { err, route: new URL(req.url).pathname, method: req.method },
        "agent API request failed",
      );
      return Response.json({ error: "internal_error" }, { status: 500 });
    }
  };
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate a dynamic-route `id` as a UUID before it reaches a Postgres
 * `uuid` column (an invalid value would otherwise surface as a raw DB
 * error). Returns the id, or a 400 Response to return immediately.
 */
export function requireUuid(id: string): string | Response {
  if (!UUID.test(id)) {
    return Response.json({ error: "invalid_id" }, { status: 400 });
  }
  return id;
}

/** Parse a JSON body, returning [value, null] or [null, 400 Response]. */
export async function readJson<T>(req: Request): Promise<[T, null] | [null, Response]> {
  try {
    return [(await req.json()) as T, null];
  } catch {
    return [null, Response.json({ error: "invalid_json" }, { status: 400 })];
  }
}
