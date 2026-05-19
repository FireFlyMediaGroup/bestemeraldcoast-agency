// SiteTheme → CSS custom properties (ADR-032 "inline injection").
//
// `styles/globals.css` ships the three archetype defaults as static
// `.archetype-*` blocks. But each `sites.themeTokens` DB row is the
// authoritative, possibly per-site-tuned token set ("may be adjusted within
// the archetype" — ADR-032). `applyTheme()` turns a resolved SiteTheme into
// the exact `--bec-*` variables so a site renders its own row, not just the
// archetype average.
//
// Two forms, same variable set:
//   - `themeToCssVars(theme)` → a React style object (custom props). This is
//     the SAFE default — spread onto the `(site)` wrapper's `style=`; no
//     `dangerouslySetInnerHTML`, no injection surface.
//   - `themeToCssText(theme)` → the `prop: value; …` declaration string, for
//     the rare case a raw `<style>`/`:root{}` block is needed (e.g. email,
//     ADR-033). Values are theme-controlled (our DB), not user input.
//
// The variable names MUST match what `styles/globals.css` consumes
// (`--bec-color-*`, `--bec-radius-*`, `--bec-font-*`) so descendant Tailwind
// utilities (`bg-primary`, `rounded-md`, `font-heading`) repaint. Spacing +
// mono are also emitted for components that read them via `var()` directly.

import type { SiteTheme } from "./tokens.js";

/** Ordered map of CSS custom property → value for a resolved SiteTheme. */
export function themeToCssVars(theme: SiteTheme): Record<string, string> {
  const { colors, radius, fonts, spacing } = theme;
  const vars: Record<string, string> = {
    "--bec-color-background": colors.background,
    "--bec-color-foreground": colors.foreground,
    "--bec-color-primary": colors.primary,
    "--bec-color-primary-fg": colors.primaryFg,
    "--bec-color-accent": colors.accent,
    "--bec-color-accent-fg": colors.accentFg,
    "--bec-color-muted": colors.muted,
    "--bec-color-muted-fg": colors.mutedFg,
    "--bec-color-border": colors.border,
    "--bec-color-success": colors.success,
    "--bec-color-warning": colors.warning,
    "--bec-color-danger": colors.danger,
    "--bec-radius-sm": radius.sm,
    "--bec-radius-md": radius.md,
    "--bec-radius-lg": radius.lg,
    "--bec-radius-xl": radius.xl,
    "--bec-font-heading": fonts.heading,
    "--bec-font-body": fonts.body,
    "--bec-content-max-width": spacing.contentMaxWidth,
    "--bec-section-gap": spacing.sectionGap,
  };
  if (fonts.mono) vars["--bec-font-mono"] = fonts.mono;
  return vars;
}

/**
 * Declaration-list string (`--bec-x: y; …`) for a raw `<style>`/inline block.
 * Not HTML — pair with a selector yourself, e.g.
 * `:root{${themeToCssText(t)}}`. Values originate from our DB, never user
 * input, so there is no injection vector; still, prefer `themeToCssVars` +
 * `style=` where possible.
 */
export function themeToCssText(theme: SiteTheme): string {
  return Object.entries(themeToCssVars(theme))
    .map(([k, v]) => `${k}: ${v};`)
    .join(" ");
}
