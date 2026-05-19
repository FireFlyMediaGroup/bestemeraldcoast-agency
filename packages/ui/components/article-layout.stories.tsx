import type { Meta, StoryObj } from "@storybook/react";

import { ARCHETYPE_LIST } from "../theme/index.js";

import { ArticleLayout } from "./article-layout.js";
import { BreadcrumbNav } from "./breadcrumb-nav.js";

const body = (
  <>
    <p>
      Pensacola&rsquo;s oyster scene has quietly become one of the best on the
      Gulf. Here&rsquo;s where the shucking is fresh and the rooms are worth
      lingering in.
    </p>
    <h2>Why now</h2>
    <p>
      A run of good harvests and a few ambitious openings have reset the bar.
      These are the rooms locals book first.
    </p>
  </>
);

const meta: Meta<typeof ArticleLayout> = {
  title: "Magazine/ArticleLayout",
  component: ArticleLayout,
  args: {
    kicker: "Food & Drink",
    title: "The 12 Best Oyster Bars in Pensacola Right Now",
    byline: "Drafted with AI assistance, edited by the Best Pensacola desk · May 19, 2026",
    children: body,
  },
  parameters: {
    layout: "fullscreen",
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] }, manual: false },
  },
};
export default meta;
type Story = StoryObj<typeof ArticleLayout>;

export const Default: Story = {
  args: {
    breadcrumb: (
      <BreadcrumbNav
        items={[
          { label: "Home", href: "/" },
          { label: "Food & Drink", href: "/food-and-drink" },
          { label: "The 12 Best Oyster Bars in Pensacola" },
        ]}
      />
    ),
  },
};

export const Minimal: Story = { args: { kicker: undefined, byline: undefined } };

export const AllArchetypes: Story = {
  parameters: { bec: { skipArchetypeWrapper: true } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {ARCHETYPE_LIST.map((a) => (
        <div
          key={a}
          className={`archetype-${a}`}
          style={{ background: "var(--bec-color-background)", paddingBlock: "2rem" }}
        >
          <ArticleLayout {...args} />
        </div>
      ))}
    </div>
  ),
};
