import type { Meta, StoryObj } from "@storybook/react";

import { ARCHETYPE_LIST } from "../../theme/index.js";

import { Button } from "./button.js";

const meta: Meta<typeof Button> = {
  title: "Primitives/Button",
  component: Button,
  args: {
    children: "Read the story",
    variant: "primary",
    size: "md",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost"],
    },
    size: { control: "select", options: ["sm", "md", "lg"] },
    onClick: { action: "click" },
  },
  parameters: {
    a11y: {
      // The a11y addon runs axe-core against the rendered story. We want a
      // hard error in the report (not just a warning) on any violation so the
      // Storybook UI flags regressions on first inspection.
      config: { rules: [{ id: "color-contrast", enabled: true }] },
      manual: false,
    },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};

// Renders the Button in all three archetypes side-by-side so a reviewer can
// see the master plan's "rendered in all three archetypes" requirement in a
// single frame without flipping the toolbar.
export const AllArchetypes: Story = {
  parameters: {
    // Disable the global theme decorator on this story — each tile applies its
    // own archetype class so all three render at once.
    bec: { skipArchetypeWrapper: true },
  },
  render: (args) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: "1.5rem",
      }}
    >
      {ARCHETYPE_LIST.map((archetype) => (
        <div
          key={archetype}
          className={`archetype-${archetype}`}
          style={{
            background: "var(--bec-color-background)",
            color: "var(--bec-color-foreground)",
            padding: "2rem",
            borderRadius: "var(--bec-radius-lg)",
            border: "1px solid var(--bec-color-border)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            alignItems: "flex-start",
            fontFamily: "var(--bec-font-body)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--bec-font-heading)",
              fontSize: "1.25rem",
              textTransform: "capitalize",
            }}
          >
            {archetype}
          </div>
          <Button {...args} variant="primary">
            Primary
          </Button>
          <Button {...args} variant="secondary">
            Secondary
          </Button>
          <Button {...args} variant="outline">
            Outline
          </Button>
        </div>
      ))}
    </div>
  ),
};
