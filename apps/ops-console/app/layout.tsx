import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "BEC Ops Console",
  description: "Internal agency control plane for the Best Emerald Coast network.",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  // Apple HIG (master plan Commit 1.7): when launched from the home screen,
  // run standalone with no Safari chrome. `black-translucent` lets the app
  // draw under the status bar — the safe-area insets in globals.css keep
  // content clear of the notch / home indicator.
  appleWebApp: {
    capable: true,
    title: "BEC Ops",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  // Apple HIG: respect the safe area (notch / home indicator) and allow the
  // app to draw under it; `viewport-fit=cover` + the body safe-area padding
  // in globals.css work together.
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  // Dark-first ops UI for evening triage; light is the prefers-color-scheme
  // fallback handled in globals.css. Hexes track the actual --bec-color-
  // background OKLCH values (dark oklch(0.17 0.01 260), light
  // oklch(0.99 0.003 260)) so the browser chrome tint matches the page.
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#141519" },
    { media: "(prefers-color-scheme: light)", color: "#fbfbfc" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
