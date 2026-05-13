import type { Decorator, Preview } from "@storybook/react";
import { useEffect } from "react";

import { ARCHETYPE_LIST } from "../theme/index.js";

import "../styles/globals.css";

// Global toolbar dropdown — switches the archetype class applied to every story
// wrapper. Stories that opt out (e.g. `AllArchetypes`) set
// `parameters.bec.skipArchetypeWrapper = true` and apply archetype classes
// themselves.

const withArchetype: Decorator = (Story, context) => {
  const archetype =
    (context.globals.archetype as string | undefined) ?? "magazine";
  const skip = Boolean(
    (context.parameters.bec as { skipArchetypeWrapper?: boolean } | undefined)
      ?.skipArchetypeWrapper,
  );

  // Mirror the archetype on <html> so the body background (driven by globals.css
  // :root) repaints across the canvas, not just inside the decorator <div>.
  useEffect(() => {
    if (skip) return;
    const root = document.documentElement;
    const previous = Array.from(root.classList).filter((c) =>
      c.startsWith("archetype-"),
    );
    for (const c of previous) root.classList.remove(c);
    root.classList.add(`archetype-${archetype}`);
    return () => {
      root.classList.remove(`archetype-${archetype}`);
      for (const c of previous) root.classList.add(c);
    };
  }, [archetype, skip]);

  if (skip) {
    return <Story />;
  }

  return (
    <div
      className={`archetype-${archetype}`}
      style={{
        padding: "1.5rem",
        background: "var(--bec-color-background)",
        color: "var(--bec-color-foreground)",
        fontFamily: "var(--bec-font-body)",
        minHeight: "100%",
      }}
    >
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [withArchetype],
  globalTypes: {
    archetype: {
      name: "Archetype",
      description: "BEC design archetype (ADR-032)",
      defaultValue: "magazine",
      toolbar: {
        icon: "paintbrush",
        items: ARCHETYPE_LIST.map((a) => ({ value: a, title: a })),
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: "padded",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    a11y: {
      // Enforce WCAG 2.2 AA per ADR-036.
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "color-contrast-enhanced", enabled: false },
        ],
      },
    },
  },
};

export default preview;
