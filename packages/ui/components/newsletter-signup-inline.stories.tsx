import type { Meta, StoryObj } from "@storybook/react";

import { ARCHETYPE_LIST } from "../theme/index.js";

import { NewsletterSignupInline } from "./newsletter-signup-inline.js";

const meta: Meta<typeof NewsletterSignupInline> = {
  title: "Magazine/NewsletterSignupInline",
  component: NewsletterSignupInline,
  args: { idBase: "nl-default" },
  parameters: {
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] }, manual: false },
  },
};
export default meta;
type Story = StoryObj<typeof NewsletterSignupInline>;

export const Default: Story = {};

export const AllArchetypes: Story = {
  parameters: { bec: { skipArchetypeWrapper: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {ARCHETYPE_LIST.map((a) => (
        <div
          key={a}
          className={`archetype-${a}`}
          style={{ background: "var(--bec-color-background)", padding: "1rem" }}
        >
          {/* unique idBase per tile so label/input ids stay unique on one page */}
          <NewsletterSignupInline idBase={`nl-${a}`} />
        </div>
      ))}
    </div>
  ),
};
