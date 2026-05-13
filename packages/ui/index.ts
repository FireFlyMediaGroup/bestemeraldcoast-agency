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

export {
  ARCHETYPE_LIST,
  archetypes,
  coastal,
  magazine,
  premium,
} from "./theme/index.js";
export type { Archetype, SiteTheme } from "./theme/index.js";
