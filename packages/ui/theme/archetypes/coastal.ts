import type { SiteTheme } from "../tokens.js";

// Coastal archetype — bestpensacolabeach, bestdestinfl.
// Bright, vacation-forward, lifestyle. References: Coastal Living, Visit Florida.
// Initial token values from ADR-032.

export const coastal: SiteTheme = {
  archetype: "coastal",
  colors: {
    background: "oklch(1.00 0 0)",
    foreground: "oklch(0.20 0.02 220)",
    primary: "oklch(0.55 0.12 220)",
    primaryFg: "oklch(1.00 0 0)",
    accent: "oklch(0.72 0.14 30)",
    accentFg: "oklch(0.20 0.02 220)",
    muted: "oklch(0.96 0.02 220)",
    mutedFg: "oklch(0.45 0.03 220)",
    border: "oklch(0.88 0.02 220)",
    success: "oklch(0.62 0.15 160)",
    warning: "oklch(0.78 0.14 70)",
    danger: "oklch(0.62 0.18 25)",
  },
  fonts: {
    heading: '"General Sans", Inter, system-ui, sans-serif',
    body: "Inter, system-ui, sans-serif",
    weights: {
      heading: [500, 600, 700],
      body: [400, 500, 600],
    },
  },
  radius: {
    sm: "8px",
    md: "10px",
    lg: "12px",
    xl: "16px",
  },
  spacing: {
    contentMaxWidth: "800px",
    sectionGap: "5rem",
  },
  imagery: {
    style: "lifestyle",
    heroAspect: "16/9",
    treatment: "natural",
  },
  voice: {
    tagline: "Where the locals go.",
    tone: "punchy",
    sampleHeadlinePattern: "{Number} {Things} You {Must} {Verb} in {Place}",
  },
};
