// Per-domain (homepage / shell) OG card, 1200×630 (ADR-009), per-archetype
// design (ADR-032). Lives in the (site) route group so proxy.ts injects the
// resolved site context for the request — the proxy's previous skip of
// `/opengraph-image` was removed in this commit (2.11.6).
//
// Distinct from the per-article OG card at
// `(site)/[category]/[slug]/opengraph-image.tsx` — that one is keyed on
// article title + category; this one is the network/site brand card used
// when the homepage (or any shell route with no more-specific OG) is
// shared.
//
// Palette note: ImageResponse runs on Satori, which does not support
// `oklch()` (the @bec/ui theme tokens are OKLCH). OG cards use a fixed
// hex approximation per archetype — a deliberate, isolated divergence
// from the live CSS tokens, scoped to the social card only. Same OG_PALETTE
// table as the per-article version on purpose (visual consistency).

import { ImageResponse } from "next/og";

import { getSiteContext } from "@/lib/site-context";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Make Next regenerate per-request — the proxy resolves a different site
// per host, so caching one variant would serve the wrong card.
export const dynamic = "force-dynamic";

interface OgPalette {
  bg: string;
  fg: string;
  accent: string;
  muted: string;
}

const OG_PALETTE = {
  magazine: { bg: "#faf7ef", fg: "#1a1a1a", accent: "#c98a2b", muted: "#6b6b63" },
  coastal: { bg: "#ffffff", fg: "#0f2a33", accent: "#e2683c", muted: "#5a7b84" },
  premium: { bg: "#f6f4ef", fg: "#23231f", accent: "#7c8a6b", muted: "#7a786f" },
} satisfies Record<string, OgPalette>;

function ogPalette(archetype: string | undefined): OgPalette {
  if (archetype === "coastal") return OG_PALETTE.coastal;
  if (archetype === "premium") return OG_PALETTE.premium;
  return OG_PALETTE.magazine;
}

export default async function Image(): Promise<ImageResponse> {
  const site = await getSiteContext();
  const palette = ogPalette(site?.archetype);
  const siteName = site?.name ?? "Best Emerald Coast";
  const tagline = site?.tagline ?? "Local guides + editorial across the Emerald Coast";
  const domain = site?.domain ?? "bestemeraldcoast.com";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: palette.bg,
          color: palette.fg,
          padding: "72px",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 4,
            color: palette.accent,
            fontWeight: 700,
          }}
        >
          BEST EMERALD COAST
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 108,
            fontWeight: 700,
            lineHeight: 1.05,
            maxWidth: "1056px",
          }}
        >
          {siteName}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", fontSize: 32, color: palette.muted }}>
            {tagline}
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: palette.fg }}>
            {domain}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
