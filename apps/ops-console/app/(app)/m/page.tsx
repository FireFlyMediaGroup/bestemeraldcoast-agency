// Mobile Home tab (master plan Commit 1.7). Entry screen for the home-screen
// PWA (manifest start_url is /m).

import { auth } from "@/auth";

import { Placeholder } from "./_components/placeholder";

export const dynamic = "force-dynamic";

export default async function MobileHome() {
  const session = await auth();

  return (
    <Placeholder
      title="BEC Ops"
      blurb={`Signed in as ${session?.user?.email ?? "operator"}.`}
    >
      <p className="text-center text-xs text-muted-fg">
        Add to Home Screen for an app-like, full-screen experience.
      </p>
    </Placeholder>
  );
}
