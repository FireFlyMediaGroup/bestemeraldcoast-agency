// Basic Auth gate for the bec-storybook Vercel deployment.
//
// Why: the master plan's Commit 0.5 acceptance asked for "password protection"
// on the deployed Storybook at ui.bestemeraldcoast.com. Vercel's native
// Password Protection feature is paywalled to Enterprise / the Advanced
// Deployment Protection add-on on Pro, which the BEC plan does not include.
// HTTP Basic Auth via Edge Middleware is the closest substitute — same
// "single shared password" experience the master plan called for, $0 cost,
// shareable with contractors and designers without inviting them to the
// Vercel team. See docs/runbooks/storybook-deploy.md for setup + rotation.
//
// Runtime: Vercel Edge. Uses web-standard `Request`/`Response` — no Next.js
// dependency. `process.env` is available at the edge for runtime-supplied
// values. Env vars are configured per-environment in the Vercel project's
// Settings → Environment Variables; password is stored canonically in the
// BEC-Production 1Password vault and synced into Vercel.

const REALM = "bec-storybook";

// Don't match Vercel's internal paths or robot files. Everything else (every
// Storybook canvas asset + iframe + html doc) gets gated.
export const config = {
  matcher: "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt).*)",
};

export default function middleware(request: Request): Response | undefined {
  const expectedUser = process.env.STORYBOOK_BASIC_AUTH_USER;
  const expectedPassword = process.env.STORYBOOK_BASIC_AUTH_PASSWORD;

  // Fail closed. If the env vars aren't configured, return 503 rather than
  // bypass — we'd rather the operator see a broken page than accidentally
  // expose a pre-launch design system because a deploy lost its env config.
  if (!expectedUser || !expectedPassword) {
    return new Response("Storybook auth not configured", { status: 503 });
  }

  const header = request.headers.get("authorization");
  if (!header) return unauthorized();

  const [scheme, encoded] = header.split(" ", 2);
  if (!scheme || scheme.toLowerCase() !== "basic" || !encoded) {
    return unauthorized();
  }

  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorized();
  }

  const sep = decoded.indexOf(":");
  if (sep === -1) return unauthorized();
  const user = decoded.slice(0, sep);
  const password = decoded.slice(sep + 1);

  if (
    !constantTimeEquals(user, expectedUser) ||
    !constantTimeEquals(password, expectedPassword)
  ) {
    return unauthorized();
  }

  // Auth passed — return nothing so Vercel serves the underlying static asset.
  return undefined;
}

function unauthorized(): Response {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}"`,
    },
  });
}

// Length-equalized constant-time string compare. Prevents timing attacks
// against the password — naïve `===` short-circuits and leaks character-prefix
// information through wall-clock differences. Edge runtime doesn't expose
// Node's `crypto.timingSafeEqual`; this is the canonical web-standard
// alternative.
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
