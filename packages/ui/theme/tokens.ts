// SiteTheme contract — ADR-032.
//
// Every `sites.themeTokens` row in the database, and every Storybook archetype
// fixture, must satisfy this type. Components in `packages/ui/` must read all
// colors / fonts / radii / spacing from CSS variables — no hardcoded values
// (ADR-032 component contract).

export type Archetype = "magazine" | "coastal" | "premium";

export type SiteTheme = {
  archetype: Archetype;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    primaryFg: string;
    accent: string;
    accentFg: string;
    muted: string;
    mutedFg: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono?: string;
    weights: {
      heading: number[];
      body: number[];
    };
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  spacing: {
    contentMaxWidth: string;
    sectionGap: string;
  };
  imagery: {
    style: "editorial" | "lifestyle" | "minimal";
    heroAspect: "16/9" | "4/3" | "21/9" | "3/2";
    treatment?: "duotone" | "desaturated" | "natural";
  };
  voice: {
    tagline: string;
    tone: "casual" | "refined" | "punchy";
    sampleHeadlinePattern: string;
  };
};
