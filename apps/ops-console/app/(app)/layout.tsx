// Auth guard for the protected app surface. `middleware.ts` already redirects
// unauthenticated requests, but this server-side check is the belt to the
// middleware's suspenders: it runs in the Node runtime with the full session
// and protects against any matcher gap. Defense in depth — never rely on a
// single guard for an internal control plane.

import { redirect } from "next/navigation";

import { auth } from "@/auth";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return <div className="min-h-dvh">{children}</div>;
}
