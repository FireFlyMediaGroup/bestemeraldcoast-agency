// Mobile shell (master plan Commit 1.7). Lives inside the (app) route group,
// so the auth.ts allow-list + (app)/layout.tsx server guard already protect
// it — no new auth surface. Layout is a full-height column: a scrollable
// content region above a sticky bottom tab bar. Dark-by-default + safe-area
// insets are handled globally (globals.css); viewport-fit=cover and the
// apple-mobile-web-app meta are set in the root layout.

import { BottomNav } from "./_components/bottom-nav";

export default function MobileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
