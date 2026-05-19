// Render the outreach template to inbox-safe HTML + a plain-text part.
// Both parts ship on every send (text fallback improves deliverability and
// is required for accessible/plain clients).

import { render } from "@react-email/render";

import { OutreachEmail } from "./templates/outreach.js";
import type { OutreachEmailProps } from "./types.js";

export async function renderOutreachEmail(
  props: OutreachEmailProps,
): Promise<{ html: string; text: string }> {
  const element = OutreachEmail(props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}
