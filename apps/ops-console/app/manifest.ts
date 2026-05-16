import type { MetadataRoute } from "next";

// PWA manifest (master plan Commit 1.7 — "add manifest.json so it can be
// added to home screen"). Next serves this at /manifest.webmanifest and
// auto-injects the <link rel="manifest">. `display: standalone` + the
// apple-mobile-web-app meta in the root layout are what strip Safari chrome
// when launched from the home screen. start_url is the mobile shell.
//
// Icons ship as a single SVG (Chrome/Android render it; it scales cleanly).
// iOS uses the apple-touch-icon for the home-screen glyph and wants a raster
// PNG — tracked as an operator pre-flight item (drop app/apple-icon.png);
// Add-to-home-screen still works without it (glyph falls back to a snapshot).

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BEC Ops Console",
    short_name: "BEC Ops",
    description:
      "Internal agency control plane for the Best Emerald Coast network.",
    start_url: "/m",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#141519",
    theme_color: "#141519",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "maskable",
      },
    ],
  };
}
