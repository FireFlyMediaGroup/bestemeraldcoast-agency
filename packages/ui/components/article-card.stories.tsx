import type { Meta, StoryObj } from "@storybook/react";

import { ARCHETYPE_LIST } from "../theme/index.js";

import { ArticleCard } from "./article-card.js";

const meta: Meta<typeof ArticleCard> = {
  title: "Magazine/ArticleCard",
  component: ArticleCard,
  args: {
    href: "/food-and-drink/best-oyster-bars-pensacola-2026",
    kicker: "Food & Drink",
    title: "The 12 Best Oyster Bars in Pensacola Right Now",
    excerpt:
      "From dollar-shuck happy hours to Gulf-to-table rooms, the spots locals actually go back to.",
  },
  parameters: {
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] }, manual: false },
  },
};
export default meta;
type Story = StoryObj<typeof ArticleCard>;

export const Default: Story = {};
export const NoImageNoExcerpt: Story = { args: { excerpt: undefined } };

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
          <ArticleCard {...args} />
        </div>
      ))}
    </div>
  ),
};
