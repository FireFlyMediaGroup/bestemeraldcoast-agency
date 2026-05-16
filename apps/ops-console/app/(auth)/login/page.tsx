// Magic-link sign-in. Server component + server action calling Auth.js v5's
// `signIn`. Apple HIG (project plan § Operator-side UX): single primary CTA,
// CTA + input live in the bottom region for one-handed reach, 44pt minimum
// tap targets, dark by default.

import { Button } from "@bec/ui";

import { signIn } from "@/auth";

// Only same-origin relative paths are allowed as a post-login destination.
// Rejects absolute URLs, protocol-relative (`//evil.com`), and backslash
// tricks — an open-redirect guard for the `from` value middleware preserves.
function safeRedirect(from: string | undefined): string {
  if (!from) return "/";
  if (!from.startsWith("/")) return "/";
  if (from.startsWith("//") || from.startsWith("/\\")) return "/";
  return from;
}

async function requestMagicLink(formData: FormData): Promise<void> {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;
  const redirectTo = safeRedirect(String(formData.get("from") ?? "") || undefined);
  // Auth.js redirects to `pages.verifyRequest` on success and
  // `pages.error` on failure (both configured in auth.ts → /login?...).
  await signIn("resend", { email, redirectTo });
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ check?: string; error?: string; from?: string }>;
}) {
  const params = await searchParams;
  const checkInbox = params.check === "1";
  const hadError = params.error === "1";
  const from = safeRedirect(params.from);

  return (
    <main className="flex min-h-dvh flex-col px-6">
      <div className="flex flex-1 flex-col justify-end pb-[15dvh] pt-[12dvh]">
        <div className="mx-auto w-full max-w-sm">
          <header className="mb-10">
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--bec-font-heading)" }}
            >
              BEC Ops Console
            </h1>
            <p className="mt-2 text-base text-muted-fg">
              Sign in with a magic link sent to the operator address.
            </p>
          </header>

          {checkInbox ? (
            <div className="flex flex-col gap-4">
              <p
                role="status"
                className="rounded-(--radius-lg) border border-border bg-muted px-4 py-3 text-base"
              >
                Check your inbox — the magic link is on its way. It expires
                shortly; request another below if it lapses.
              </p>
              {/* Retry path: re-submits the same magic-link action so an
                  expired link isn't a dead end. Preserves `from`. */}
              <form action={requestMagicLink} className="flex flex-col gap-3">
                <input type="hidden" name="from" value={from} />
                <label className="flex flex-col gap-2">
                  <span className="text-sm text-muted-fg">Email</span>
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    placeholder="operator@bestemeraldcoast.com"
                    className="min-h-[44px] rounded-(--radius-md) border border-border bg-background px-4 text-base outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  />
                </label>
                <Button
                  type="submit"
                  size="lg"
                  variant="outline"
                  className="min-h-[44px] w-full"
                  aria-label="Send another magic link"
                >
                  Send another link
                </Button>
              </form>
            </div>
          ) : (
            <form action={requestMagicLink} className="flex flex-col gap-4">
              <input type="hidden" name="from" value={from} />
              {hadError ? (
                <p
                  role="alert"
                  className="rounded-(--radius-md) border border-danger px-3 py-2 text-sm text-danger"
                >
                  That sign-in didn&apos;t go through. Confirm you&apos;re
                  using the operator address and try again.
                </p>
              ) : null}
              <label className="flex flex-col gap-2">
                <span className="text-sm text-muted-fg">Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  autoFocus
                  placeholder="operator@bestemeraldcoast.com"
                  // 44pt minimum tap target (Apple HIG).
                  className="min-h-[44px] rounded-(--radius-md) border border-border bg-background px-4 text-base outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
              </label>
              <Button type="submit" size="lg" className="min-h-[44px] w-full">
                Send magic link
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
