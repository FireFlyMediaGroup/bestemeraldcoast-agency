// Agent API authentication — `Authorization: Bearer ${AGENT_API_KEY}`
// (ADR-003). Separate from operator (NextAuth) auth: agents are headless
// and present a shared secret, not a session.
//
// Build-inert: @bec/config is dynamically imported (eager-parseEnv reason,
// same as the rest of the API surface).

const encoder = new TextEncoder();

// Length-padded constant-time compare. A plain === short-circuits on the
// first differing byte and leaks the shared secret's length/prefix via
// timing. Compare fixed-size byte buffers instead.
function timingSafeEqual(a: string, b: string): boolean {
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  // Compare against a buffer of `ab`'s length regardless, so length
  // differences don't early-return; fold the length check into the result.
  let mismatch = ab.length ^ bb.length;
  for (let i = 0; i < ab.length; i++) {
    mismatch |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return mismatch === 0;
}

/**
 * Returns null when the request is authorized; otherwise a 401 Response to
 * return immediately. Usage:
 *
 *   const unauthorized = await requireAgentAuth(req);
 *   if (unauthorized) return unauthorized;
 */
export async function requireAgentAuth(req: Request): Promise<Response | null> {
  const { serverEnv } = await import("@bec/config");
  const expected = serverEnv.AGENT_API_KEY;

  // Fail closed: if the server has no AGENT_API_KEY configured, no agent
  // request can be authorized (don't silently allow an unauthenticated
  // mutation surface).
  if (!expected) {
    return Response.json({ error: "agent_auth_unconfigured" }, { status: 401 });
  }

  const header = req.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ", 2);
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!timingSafeEqual(token, expected)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

/** Stable rate-limit key for the presented agent key (never log the raw key). */
export function agentKeyId(req: Request): string {
  const token = (req.headers.get("authorization") ?? "").split(" ", 2)[1] ?? "anon";
  // Cheap, non-reversible bucket id so the limiter key isn't the secret.
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h = (h ^ token.charCodeAt(i)) * 16777619;
  }
  return `k_${(h >>> 0).toString(36)}`;
}
