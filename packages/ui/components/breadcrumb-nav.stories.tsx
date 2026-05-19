import type { Meta, StoryObj } from "@storybook/react";

import { ARCHETYPE_LIST } from "../theme/index.js";

import { BreadcrumbNav } from "./breadcrumb-nav.js";

const items = [
  { label: "Home", href: "/" },
  { label: "Food & Drink", href: "/food-and-drink" },
  { label: "The 12 Best Oyster Bars in Pensacola" },
];

const meta: Meta<typeof BreadcrumbNav> = {
  title: "Magazine/BreadcrumbNav",
  component: BreadcrumbNav,
  args: { items },
  parameters: {
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] }, manual: false },
  },
};
export default meta;
type Story = StoryObj<typeof BreadcrumbNav>;

export const Default: Story = {};
export const TwoLevel: Story = {
  args: { items: [{ label: "Home", href: "/" }, { label: "Events" }] },
};

export const AllArchetypes: Story = {
  parameters: { bec: { skipArchetypeWrapper: true } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {ARCHETYPE_LIST.map((a) => (
        <div
          key={a}
          className={`archetype-${a}`}
          style={{
            background: "var(--bec-color-background)",
            padding: "1rem",
            borderRadius: "var(--bec-radius-md)",
            border: "1px solid var(--bec-color-border)",
          }}
        >
          <BreadcrumbNav {...args} />
        </div>
      ))}
    </div>
  ),
};
