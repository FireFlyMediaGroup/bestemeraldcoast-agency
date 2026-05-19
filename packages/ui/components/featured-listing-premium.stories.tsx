import type { Meta, StoryObj } from "@storybook/react";

import { ARCHETYPE_LIST } from "../theme/index.js";

import { FeaturedListingPremium } from "./featured-listing-premium.js";

const meta: Meta<typeof FeaturedListingPremium> = {
  title: "Magazine/FeaturedListingPremium",
  component: FeaturedListingPremium,
  args: {
    href: "/guides/30a-slow-weekend",
    kicker: "The Guide",
    title: "A Slow Weekend on 30A",
    excerpt:
      "Where to take it down a gear: the quiet beach access, the long table, and the bookshop you'll lose an afternoon in.",
  },
  parameters: {
    layout: "fullscreen",
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] }, manual: false },
  },
};
export default meta;
type Story = StoryObj<typeof FeaturedListingPremium>;

// Premium archetype = the intended pairing (full-bleed, negative space).
export const Default: Story = {
  globals: { archetype: "premium" },
};

// Structural variant is still token-colored, so it holds up under every
// archetype's palette — shown across all three.
export const AllArchetypes: Story = {
  parameters: { bec: { skipArchetypeWrapper: true } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {ARCHETYPE_LIST.map((a) => (
        <div
          key={a}
          className={`archetype-${a}`}
          style={{ background: "var(--bec-color-background)" }}
        >
          <FeaturedListingPremium {...args} />
        </div>
      ))}
    </div>
  ),
};
