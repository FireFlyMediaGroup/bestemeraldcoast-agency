import type { SiteTheme } from "../tokens.js";

// Magazine archetype — bestpensacola, bestfortwaltonbeach, bestemeraldcoast (hub).
// Trustworthy, neighborhood, readable. References: Eater city sites, Garden & Gun.
// Initial token values from ADR-032.

export const magazine: SiteTheme = {
  archetype: "magazine",
  colors: {
    background: "oklch(0.98 0.01 80)",
    foreground: "oklch(0.18 0 0)",
    primary: "oklch(0.30 0.06 240)",
    primaryFg: "oklch(0.98 0.01 80)",
    accent: "oklch(0.75 0.13 70)",
    accentFg: "oklch(0.18 0 0)",
    muted: "oklch(0.94 0.01 80)",
    mutedFg: "oklch(0.45 0.02 80)",
    border: "oklch(0.88 0.01 80)",
    success: "oklch(0.55 0.13 145)",
    warning: "oklch(0.72 0.14 70)",
    danger: "oklch(0.58 0.17 25)",
  },
  fonts: {
    heading: "Fraunces, Georgia, serif",
    body: "Inter, system-ui, sans-serif",
    weights: {
      heading: [400, 600, 700],
      body: [400, 500, 700],
    },
  },
  radius: {
    sm: "4px",
    md: "6px",
    lg: "8px",
    xl: "12px",
  },
  spacing: {
    contentMaxWidth: "720px",
    sectionGap: "4rem",
  },
  imagery: {
    style: "editorial",
    heroAspect: "3/2",
    treatment: "natural",
  },
  voice: {
    tagline: "Stories from your corner of the coast.",
    tone: "casual",
    sampleHeadlinePattern: "The {Adjective} {Noun} {Locals} {Verb}",
  },
};
