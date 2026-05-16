// Composes the agent-API request pipeline so each route file stays a thin
// body: (1) Bearer AGENT_API_KEY auth → 401, (2) ADR-017 rate limit
// (60/key/min) → 429, (3) error capture via @bec/logger (ADR-012) → 500.
// All env-touching packages are dynamically imported (build-inert).

import { agentKeyId, requireAgentAuth } from "./agent-auth.js";
import { checkRateLimit, tooManyRequests } from "./ratelimit.js";

// Next 16 dynamic-segment params arrive as a Promise. Typed as a concrete
// object (not Record<string,string>) so `id` is `string` — a Record index
// access would be `string | undefined` under noUncheckedIndexedAccess and
// every `eq(col, id)` would reject the `undefined`. Routes with no dynamic
// segment simply ignore `ctx`.
export type RouteCtx = { params: Promise<{ id: string }> };

type Handler = (req: Request, ctx: RouteCtx) => Promise<Response>;

export function agentRoute(handler: Handler): Handler {
  return async (req, ctx) => {
    const unauthorized = await requireAgentAuth(req);
    if (unauthorized) return unauthorized;

    const rl = await checkRateLimit("agentApi", agentKeyId(req));
    if (!rl.success) return tooManyRequests(rl);

    try {
      return await handler(req, ctx);
    } catch (err) {
      const { logger } = await import("@bec/logger");
      logger.error(
        { err, route: new URL(req.url).pathname, method: req.method },
        "agent API handler threw",
      );
      return Response.json({ error: "internal_error" }, { status: 500 });
    }
  };
}

/** Parse a JSON body, returning [value, null] or [null, 400 Response]. */
export async function readJson<T>(req: Request): Promise<[T, null] | [null, Response]> {
  try {
    return [(await req.json()) as T, null];
  } catch {
    return [null, Response.json({ error: "invalid_json" }, { status: 400 })];
  }
}
