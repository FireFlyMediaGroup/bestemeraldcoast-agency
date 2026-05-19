import type { Meta, StoryObj } from "@storybook/react";

import { ARCHETYPE_LIST } from "../theme/index.js";

import { BusinessCard } from "./business-card.js";

const meta: Meta<typeof BusinessCard> = {
  title: "Magazine/BusinessCard",
  component: BusinessCard,
  args: {
    name: "Joe Patti's Seafood",
    rating: 4.7,
    reviewCount: 5231,
    address: "524 S B St, Pensacola, FL 32502",
    tagline: "The Gulf Coast seafood market locals have trusted since 1931.",
    href: "/businesses/joe-pattis-seafood",
  },
  parameters: {
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] }, manual: false },
  },
};
export default meta;
type Story = StoryObj<typeof BusinessCard>;

export const Default: Story = {};
export const NoRatingNoLink: Story = {
  args: { rating: undefined, reviewCount: undefined, href: undefined },
};

export const AllArchetypes: Story = {
  parameters: { bec: { skipArchetypeWrapper: true } },
  render: (args) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0,1fr))",
        gap: "1.5rem",
      }}
    >
      {ARCHETYPE_LIST.map((a) => (
        <div
          key={a}
          className={`archetype-${a}`}
          style={{ background: "var(--bec-color-background)", padding: "1rem" }}
        >
          <BusinessCard {...args} />
        </div>
      ))}
    </div>
  ),
};
