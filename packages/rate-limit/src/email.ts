// Server-side email validation for public signup forms (ADR-017).
//
// Three checks, in order: syntax → disposable-domain blocklist → MX lookup.
// Returns a discriminated result so the caller knows *why* the address
// failed, but per ADR-017 the public response is the **same** "thanks for
// subscribing" regardless of outcome — the ban is silent so we don't leak
// which addresses are blocked.
//
// The disposable list is loaded lazily on first call and cached for the
// lifetime of the process so /api/subscribe doesn't pay an import cost on
// every request.

import { promises as dnsPromises } from "node:dns";

/** RFC-5322-flavored sanity check. Tight enough to reject obvious junk before DNS. */
const SYNTAX_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmailReason = "syntax" | "disposable" | "no_mx";

export interface EmailValidationResult {
  valid: boolean;
  /** Set when valid=false. Caller decides whether to surface it — per ADR-017, normally not. */
  reason?: EmailReason;
  /** Trimmed lowercase form of the input. */
  normalized: string;
}

let disposableDomains: Set<string> | undefined;

async function getDisposableDomains(): Promise<Set<string>> {
  if (disposableDomains) return disposableDomains;
  const mod = (await import("disposable-email-domains")) as
    | string[]
    | { default: string[] };
  const list = Array.isArray(mod) ? mod : mod.default;
  disposableDomains = new Set(list.map((d) => d.toLowerCase()));
  return disposableDomains;
}

export async function validateEmail(raw: string): Promise<EmailValidationResult> {
  const normalized = raw.trim().toLowerCase();

  if (!SYNTAX_RE.test(normalized)) {
    return { valid: false, reason: "syntax", normalized };
  }

  // Safe non-null: regex above requires exactly one `@` with content on both sides.
  const domain = normalized.split("@")[1]!;

  const disposable = await getDisposableDomains();
  if (disposable.has(domain)) {
    return { valid: false, reason: "disposable", normalized };
  }

  try {
    const mx = await dnsPromises.resolveMx(domain);
    if (!mx || mx.length === 0) {
      return { valid: false, reason: "no_mx", normalized };
    }
  } catch {
    // ENOTFOUND, ENODATA, SERVFAIL → treat as no MX. Don't surface; ADR-017
    // is silent-reject at the caller.
    return { valid: false, reason: "no_mx", normalized };
  }

  return { valid: true, normalized };
}

/** Test-only: clear the cached disposable-domain set so a re-import sees a fresh list. */
export function __resetDisposableDomainCacheForTesting(): void {
  disposableDomains = undefined;
}
