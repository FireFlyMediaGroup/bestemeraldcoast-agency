import type { Meta, StoryObj } from "@storybook/react";

import { ARCHETYPE_LIST } from "../theme/index.js";

import { FeaturedListing } from "./featured-listing.js";

const meta: Meta<typeof FeaturedListing> = {
  title: "Magazine/FeaturedListing",
  component: FeaturedListing,
  args: {
    href: "/things-to-do/perfect-pensacola-beach-weekend",
    kicker: "The Weekender",
    title: "How to Spend a Perfect Weekend on Pensacola Beach",
    excerpt:
      "Sunrise on the fishing pier, a long lunch over the water, and the one sunset spot that's worth the walk.",
  },
  parameters: {
    layout: "fullscreen",
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] }, manual: false },
  },
};
export default meta;
type Story = StoryObj<typeof FeaturedListing>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "var(--bec-content-max-width)", margin: "2rem auto" }}>
        <Story />
      </div>
    ),
  ],
};

// One archetype-agnostic component, three archetypes — proves the ADR-032
// contract: the image aspect tracks `--bec-hero-aspect` (3/2 · 16/9 · 21/9)
// and colors/fonts/radius track the archetype tokens, no forked code.
export const AllArchetypes: Story = {
  parameters: { bec: { skipArchetypeWrapper: true } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {ARCHETYPE_LIST.map((a) => (
        <div
          key={a}
          className={`archetype-${a}`}
          style={{ background: "var(--bec-color-background)", padding: "1.5rem" }}
        >
          <FeaturedListing {...args} />
        </div>
      ))}
    </div>
  ),
};
