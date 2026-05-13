import type { SiteTheme } from "../tokens.js";

// Premium archetype — bestsouthwalton, bestcr30a, best30a.life.
// Editorial-magazine, refined, full-bleed. References: Cereal Magazine, Kinfolk.
// Initial token values from ADR-032.

export const premium: SiteTheme = {
  archetype: "premium",
  colors: {
    background: "oklch(0.97 0.01 90)",
    foreground: "oklch(0.20 0.01 90)",
    primary: "oklch(0.20 0.01 90)",
    primaryFg: "oklch(0.97 0.01 90)",
    accent: "oklch(0.65 0.05 140)",
    accentFg: "oklch(0.20 0.01 90)",
    muted: "oklch(0.93 0.01 90)",
    mutedFg: "oklch(0.50 0.01 90)",
    border: "oklch(0.85 0.01 90)",
    success: "oklch(0.55 0.10 145)",
    warning: "oklch(0.72 0.12 70)",
    danger: "oklch(0.55 0.16 25)",
  },
  fonts: {
    heading: '"Editorial New", Fraunces, Georgia, serif',
    body: '"Söhne", "Inter Tight", Inter, system-ui, sans-serif',
    weights: {
      heading: [300, 400, 500],
      body: [400, 500],
    },
  },
  radius: {
    sm: "2px",
    md: "3px",
    lg: "4px",
    xl: "6px",
  },
  spacing: {
    contentMaxWidth: "900px",
    sectionGap: "6rem",
  },
  imagery: {
    style: "minimal",
    heroAspect: "21/9",
    treatment: "desaturated",
  },
  voice: {
    tagline: "A measured look at the coast.",
    tone: "refined",
    sampleHeadlinePattern: "On {Noun}: a {Field} {Practitioner} reflects",
  },
};
