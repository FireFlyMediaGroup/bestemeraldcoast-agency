import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// Vite config consumed by Storybook's @storybook/react-vite builder (and by any
// future direct Vite usage like Storybook's interaction-test runner). The
// Tailwind v4 plugin wires @import "tailwindcss" + @theme { } in
// styles/globals.css without a separate PostCSS step.

export default defineConfig({
  plugins: [tailwindcss()],
});
