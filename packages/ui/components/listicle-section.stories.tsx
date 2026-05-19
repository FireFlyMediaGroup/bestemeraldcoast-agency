import type { Meta, StoryObj } from "@storybook/react";

import { ARCHETYPE_LIST } from "../theme/index.js";

import { ListicleSection } from "./listicle-section.js";

const meta: Meta<typeof ListicleSection> = {
  title: "Magazine/ListicleSection",
  component: ListicleSection,
  args: {
    rank: 1,
    title: "Joe Patti's Seafood",
    children: (
      <p>
        Part fish market, part institution. Get the smoked tuna dip, then take
        a number at the counter and watch the boats come in.
      </p>
    ),
  },
  parameters: {
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] }, manual: false },
  },
};
export default meta;
type Story = StoryObj<typeof ListicleSection>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "var(--bec-content-max-width)", margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
};

export const Sequence: Story = {
  render: (args) => (
    <div style={{ maxWidth: "var(--bec-content-max-width)", margin: "0 auto" }}>
      <ListicleSection {...args} rank={1} title="Joe Patti's Seafood" />
      <ListicleSection {...args} rank={2} title="The Fish House" />
      <ListicleSection {...args} rank={3} title="Pearl & Horn" />
    </div>
  ),
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
          style={{ background: "var(--bec-color-background)", padding: "1.5rem" }}
        >
          <ListicleSection {...args} />
        </div>
      ))}
    </div>
  ),
};
