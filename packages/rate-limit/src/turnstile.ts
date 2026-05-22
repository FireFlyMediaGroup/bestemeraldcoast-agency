// Cloudflare Turnstile verification (ADR-017).
//
// Server-side companion to the <Turnstile /> client widget: takes the token
// the widget POSTs back, calls Cloudflare's siteverify endpoint, returns
// pass/fail. Public signup + contact form handlers gate writes on this.
//
// Failure modes:
//   - No secret configured (local/CI) → success:true   [fail-open, like the
//     limiter helpers — otherwise every preview deploy 403s every form].
//   - Token missing                   → success:false  [the client must
//     have a token; absence is a bot or a JS-disabled bot, both reject].
//   - siteverify network/parse error  → success:false  [fail-closed: if we
//     can't verify the human-ness signal, decline. Cloudflare outages are
//     rare; the alternative — letting bots through during a Cloudflare
//     hiccup — defeats the entire purpose].

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileResult {
  success: boolean;
  errorCodes?: string[];
}

export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<TurnstileResult> {
  if (!token) {
    return { success: false, errorCodes: ["missing-input-response"] };
  }

  const { serverEnv } = await import("@bec/config");
  const secret = serverEnv.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Parity with @bec/logger transports + rate-limit fail-open: a missing
    // secret means Turnstile isn't deployed in this environment, not that
    // the user failed a challenge.
    return { success: true };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    return {
      success: data.success === true,
      errorCodes: data["error-codes"],
    };
  } catch (err) {
    const { logger } = await import("@bec/logger");
    logger.error({ err }, "turnstile verify failed — failing closed");
    return { success: false, errorCodes: ["internal-error"] };
  }
}
