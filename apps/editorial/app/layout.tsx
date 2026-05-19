import type { Metadata, Viewport } from "next";

import "./globals.css";

// MINIMAL STATIC ROOT LAYOUT.
//
// Next renders its internal `_not-found` / `_global-error` pages through the
// root layout at build time. If the root layout is async and reads a Dynamic
// API (`headers()` via getSiteContext), that build-time generation crashes
// ("reading 'length'" / null `useContext`). So the root stays static and
// synchronous; all per-site chrome that needs the resolved site lives in the
// `(site)` route-group layout (which only wraps real, request-time routes).
// ops-console keeps its root layout static for the same reason.
//
// Per-site `<head>` (title/description/canonical/OG) + ADR-010 canonical is
// Commit 2.3 (structured data). The 2.1 shell differentiates sites in the
// rendered body (header/footer/home read getSiteContext()), which is what
// the acceptance check verifies — not the document title.

export const metadata: Metadata = {
  title: "Best Emerald Coast",
  description: "Local guides and editorial across the Emerald Coast network.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  // HIG: draw under the safe area; body inset padding in globals.css keeps
  // content clear of the notch / home indicator.
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
