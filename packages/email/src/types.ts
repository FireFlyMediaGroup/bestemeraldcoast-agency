// Public contract for the outreach email surface. Kept dependency-free so
// the ops-console route can import these types without pulling React.

/** ADR-032 design archetypes — drives the email's voice + font stack. */
export type OutreachArchetype = "magazine" | "coastal" | "premium";

export interface OutreachEmailProps {
  /** ADR-032 archetype of the lead's primary site. Defaults to magazine. */
  archetype: OutreachArchetype;
  /** The business we're pitching (used in greeting + subject only). */
  businessName: string;
  /** City for the human, local greeting (ADR-034 local-reference value). */
  city: string;
  /**
   * The Checker-approved pitch text, verbatim. The template is presentation
   * only — it MUST NOT alter this copy (Checker graded this exact string;
   * ADR-034). Paragraph breaks are split on blank lines.
   */
  bodyCopy: string;
  /** Brand/site display name, becomes the signature + "From name" (ADR-013). */
  fromName: string;
  /** Absolute site URL the tracked CTA points at (e.g. https://bestpensacola.com). */
  siteUrl: string;
  /** Unique per-message tracking code; embedded as `?ref=` on every link. */
  trackingCode: string;
  /** Physical mailing address — CAN-SPAM requirement (ADR-014/031). */
  postalAddress: string;
  /**
   * Where the recipient's "unsubscribe" actually lands — either the
   * monitored Reply-To inbox (then the footer says "reply 'unsubscribe'")
   * or an explicit unsubscribe inbox (the footer renders a `mailto:`
   * link). The send route resolves this from OUTREACH_REPLY_TO ||
   * OUTREACH_UNSUBSCRIBE_EMAIL || OPERATOR_EMAIL and refuses to send if
   * none are configured (CAN-SPAM: a working opt-out is mandatory).
   */
  unsubscribeAddress: string;
  /**
   * `true` when the address above is the monitored Reply-To; `false` when
   * it's a fallback inbox. Drives the footer wording so we never tell a
   * recipient to reply when no one is reading replies.
   */
  isReplyToMonitored: boolean;
}

export interface SendOutreachInput {
  to: string;
  /** Rendered "Name <email>" is composed by the caller per ADR-013. */
  fromName: string;
  fromEmail: string;
  /** Optional monitored reply inbox. Omitted ⇒ no Reply-To header. */
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}
