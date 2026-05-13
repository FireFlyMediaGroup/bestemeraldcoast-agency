import type { StorybookConfig } from "@storybook/react-vite";

// ADR-037 component library + ADR-036 a11y baseline.
//
// We use Storybook's Vite builder so Tailwind v4 plugs in via @tailwindcss/vite
// (see ../vite.config.ts) without a separate PostCSS pipeline.

const config: StorybookConfig = {
  stories: [
    "../components/**/*.stories.@(ts|tsx)",
    "../theme/**/*.stories.@(ts|tsx)",
  ],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    check: false,
  },
  docs: {
    autodocs: "tag",
  },
};

export default config;
