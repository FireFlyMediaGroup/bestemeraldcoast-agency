import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "BEC Ops Console",
  description: "Internal agency control plane for the Best Emerald Coast network.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  // Apple HIG: respect the safe area (notch / home indicator) and allow the
  // app to draw under it; `viewport-fit=cover` + the body safe-area padding
  // in globals.css work together.
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  // Dark-first ops UI for evening triage; light is the prefers-color-scheme
  // fallback handled in globals.css.
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0e14" },
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
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
