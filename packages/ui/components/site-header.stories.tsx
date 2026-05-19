import type { Meta, StoryObj } from "@storybook/react";

import { ARCHETYPE_LIST } from "../theme/index.js";

import { SiteHeader } from "./site-header.js";

const meta: Meta<typeof SiteHeader> = {
  title: "Magazine/SiteHeader",
  component: SiteHeader,
  args: {
    siteName: "Best Pensacola",
    nav: [
      { label: "Food & Drink", href: "/food-and-drink" },
      { label: "Things to Do", href: "/things-to-do" },
      { label: "Events", href: "/events" },
    ],
  },
  parameters: {
    layout: "fullscreen",
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] }, manual: false },
  },
};
export default meta;
type Story = StoryObj<typeof SiteHeader>;

export const Default: Story = {};
export const NameOnly: Story = { args: { nav: [] } };

export const AllArchetypes: Story = {
  parameters: { bec: { skipArchetypeWrapper: true } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {ARCHETYPE_LIST.map((a) => (
        <div key={a} className={`archetype-${a}`}>
          <SiteHeader
            {...args}
            siteName={`Best ${a.charAt(0).toUpperCase()}${a.slice(1)}`}
          />
        </div>
      ))}
    </div>
  ),
};
