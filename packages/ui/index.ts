// Public surface of @bec/ui.
//
// Re-exports primitives and theme tokens. Compositions / layouts (ADR-037) will
// be added as they're built. See `.storybook/` for the Storybook entry.

export { Button } from "./components/primitives/button.js";
export type {
  ButtonProps,
  ButtonSize,
  ButtonVariant,
} from "./components/primitives/button.js";

// Magazine composition components (ADR-037; Commit 2.2). Archetype-agnostic —
// they read CSS-variable-backed tokens, so the same components serve Coastal
// and Premium too (Commit 2.5 adds only archetype-specific *variants*).
export { SiteHeader } from "./components/site-header.js";
export type {
  SiteHeaderProps,
  SiteHeaderNavItem,
} from "./components/site-header.js";
export { SiteFooter } from "./components/site-footer.js";
export type { SiteFooterProps, SiteFooterLink } from "./components/site-footer.js";
export { BreadcrumbNav } from "./components/breadcrumb-nav.js";
export type { BreadcrumbNavProps, BreadcrumbItem } from "./components/breadcrumb-nav.js";
export { ArticleLayout } from "./components/article-layout.js";
export type { ArticleLayoutProps } from "./components/article-layout.js";
export { ArticleCard } from "./components/article-card.js";
export type { ArticleCardProps } from "./components/article-card.js";
export { ListicleSection } from "./components/listicle-section.js";
export type { ListicleSectionProps } from "./components/listicle-section.js";
export { BusinessCard } from "./components/business-card.js";
export type { BusinessCardProps } from "./components/business-card.js";
export { NewsletterSignupInline } from "./components/newsletter-signup-inline.js";
export type { NewsletterSignupInlineProps } from "./components/newsletter-signup-inline.js";
export { FeaturedListingMagazine } from "./components/featured-listing-magazine.js";
export type { FeaturedListingMagazineProps } from "./components/featured-listing-magazine.js";

export {
  ARCHETYPE_LIST,
  archetypes,
  coastal,
  magazine,
  premium,
  themeToCssVars,
  themeToCssText,
} from "./theme/index.js";
export type { Archetype, SiteTheme } from "./theme/index.js";
