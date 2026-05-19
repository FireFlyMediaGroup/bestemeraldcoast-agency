import type { Meta, StoryObj } from "@storybook/react";

import { ARCHETYPE_LIST } from "../theme/index.js";

import { SiteFooter } from "./site-footer.js";

const meta: Meta<typeof SiteFooter> = {
  title: "Magazine/SiteFooter",
  component: SiteFooter,
  args: { siteName: "Best Pensacola", year: 2026 },
  parameters: {
    layout: "fullscreen",
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] }, manual: false },
  },
};
export default meta;
type Story = StoryObj<typeof SiteFooter>;

export const Default: Story = {};

export const AllArchetypes: Story = {
  parameters: { bec: { skipArchetypeWrapper: true } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {ARCHETYPE_LIST.map((a) => (
        <div key={a} className={`archetype-${a}`}>
          <SiteFooter
            {...args}
            siteName={`Best ${a.charAt(0).toUpperCase()}${a.slice(1)}`}
          />
        </div>
      ))}
    </div>
  ),
};
