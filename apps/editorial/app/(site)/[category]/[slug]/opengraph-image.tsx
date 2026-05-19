import { ImageResponse } from "next/og";

import { getArticle } from "@/lib/article";
import { titleize } from "@/lib/format";
import { getSiteContext } from "@/lib/site-context";

// Dynamic OG card, 1200×630 (ADR-009), per-archetype design (ADR-032).
// Lives under the [category]/[slug] segment so proxy injects site context
// (proxy only skips the ROOT /opengraph-image, not the nested one). Renders
// a branded card even when the article isn't found yet (no-data case) so
// shares never 404 the image.
//
// Palette note: ImageResponse runs on Satori, which does not support
// `oklch()` (the @bec/ui theme tokens are OKLCH). OG cards therefore use a
// fixed hex approximation per archetype — a deliberate, isolated divergence
// from the live CSS tokens, scoped to the social card only.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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

export default async function Image({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<ImageResponse> {
  const site = await getSiteContext();
  const { category, slug } = await params;

  const article = site ? await getArticle(site.id, category, slug) : null;
  const palette = ogPalette(site?.archetype);

  const siteName = site?.name ?? "Best Emerald Coast";
  const kicker = (article?.category.name ?? titleize(category)).toUpperCase();
  const title = article?.title ?? titleize(slug);

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
          {kicker}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: "960px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 30,
            color: palette.muted,
          }}
        >
          <span style={{ display: "flex", fontWeight: 700, color: palette.fg }}>
            {siteName}
          </span>
          <span style={{ display: "flex" }}>{site?.domain ?? ""}</span>
        </div>
      </div>
    ),
    size,
  );
}
