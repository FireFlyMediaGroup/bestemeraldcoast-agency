// Dashboard placeholder. Commit 1.4 is the scaffold + auth; the real ops
// surfaces (lead pipeline, approvals, metrics) arrive in later Phase 1
// commits. This proves the authed route group renders for a signed-in
// operator and shows who's signed in.

import Link from "next/link";

import { auth, signOut } from "@/auth";
import { Button } from "@bec/ui";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-8 px-6 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--bec-font-heading)" }}
          >
            Ops Console
          </h1>
          <p className="mt-1 text-base text-muted-fg">
            Signed in as {session?.user?.email ?? "operator"}.
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button type="submit" variant="outline" size="sm" className="min-h-[44px]">
            Sign out
          </Button>
        </form>
      </header>

      <nav className="grid gap-3">
        <Link
          href="/leads"
          className="flex min-h-[44px] items-center justify-between rounded-(--radius-lg) border border-border px-5 py-4 hover:bg-muted"
        >
          <span className="font-medium">Leads</span>
          <span className="text-sm text-muted-fg">
            Pipeline · diagnosis · manual transitions →
          </span>
        </Link>
      </nav>

      <section className="rounded-(--radius-lg) border border-border bg-muted px-5 py-8 text-center">
        <p className="text-base text-muted-fg">
          Approvals and metrics land in the following Phase 1 commits.
        </p>
      </section>
    </main>
  );
}
