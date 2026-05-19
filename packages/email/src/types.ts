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
