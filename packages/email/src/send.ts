// Resend transactional send (ADR-013: Resend = transactional, SES = bulk).
// The API key is passed in, never read from process.env here — keeps this
// unit-testable and keeps the secret owned by the ops-console route env.

import { Resend } from "resend";

import type { SendOutreachInput } from "./types.js";

export class OutreachSendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OutreachSendError";
  }
}

/**
 * Send one outreach email. Returns Resend's message id (persisted as
 * `outreach_messages.sent_message_id`). Throws `OutreachSendError` on any
 * provider failure so the caller can map it to a 502 without recording a
 * send.
 */
export async function sendOutreachEmail(
  apiKey: string,
  input: SendOutreachInput,
): Promise<{ id: string }> {
  if (!apiKey) throw new OutreachSendError("missing_resend_api_key");

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: `${input.fromName} <${input.fromEmail}>`,
    to: input.to,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    throw new OutreachSendError(error.message || "resend_send_failed");
  }
  if (!data?.id) {
    throw new OutreachSendError("resend_no_message_id");
  }
  return { id: data.id };
}
