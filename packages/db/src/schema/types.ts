// JSON payload types for jsonb columns (referenced via Drizzle's $type<>()).
//
// These describe the shape of payloads that live inside jsonb columns. They
// are not enforced by Postgres — application code is responsible for keeping
// the column data conformant. Keep these narrow and explicit; the column-level
// $type<> assertion is what gives consumers compile-time safety when reading
// or writing.
//
// Sources for each type are noted inline.

// sites.themeTokens — locked by ADR-032. Inlined here rather than imported
// from @bec/ui so @bec/db stays independent of the UI package. The shape MUST
// match @bec/ui's `SiteTheme` (packages/ui/theme/tokens.ts); any drift between
// the two is an ADR-032 violation and should be caught in code review or by a
// future shared `@bec/types` package.
export type Archetype = "magazine" | "coastal" | "premium";

export interface SiteTheme {
  archetype: Archetype;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    primaryFg: string;
    accent: string;
    accentFg: string;
    muted: string;
    mutedFg: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono?: string;
    weights: {
      heading: number[];
      body: number[];
    };
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  spacing: {
    contentMaxWidth: string;
    sectionGap: string;
  };
  imagery: {
    style: "editorial" | "lifestyle" | "minimal";
    heroAspect: "16/9" | "4/3" | "21/9" | "3/2";
    treatment?: "duotone" | "desaturated" | "natural";
  };
  voice: {
    tagline: string;
    tone: "casual" | "refined" | "punchy";
    sampleHeadlinePattern: string;
  };
}

// businesses.contactChannels (ADR-024).
export type ContactChannelKind = "email" | "phone" | "sms" | "ig_dm" | "fb_message" | "website_form";

export interface ContactChannel {
  kind: ContactChannelKind;
  value: string;
  /** Free-form provenance (e.g. "scout/google-places", "operator/manual"). */
  source?: string;
  /** ISO 8601 when this channel was last successfully verified. */
  verifiedAt?: string;
  /** Set when this specific channel has been opted-out independently of the DNC flag. */
  optedOutAt?: string;
}

// leads.diagnosis (Diagnoser agent output — populated when status >= 'diagnosed').
export interface Diagnosis {
  /** 0-100 overall opportunity score. */
  gapScore: number;
  /** Component scores that aggregate into gapScore. Keys are stable agent contract. */
  components: {
    websiteAge?: number;
    mobileFriendly?: number;
    seoBasics?: number;
    contentDepth?: number;
    citationConsistency?: number;
    reviewVelocity?: number;
    [key: string]: number | undefined;
  };
  /** Human-readable summary the Builder uses when drafting outreach copy. */
  summary: string;
  /** Specific issues the Builder can quote in the outreach body. */
  findings: Array<{
    code: string;
    severity: "high" | "medium" | "low";
    description: string;
  }>;
  /** Recommended offer template the Pitcher should select. */
  recommendedOffer?: "website-rebuild" | "seo-tuneup" | "content-package" | "review-management";
  scoringVersion: number;
}

// leads.offer (Pitcher agent output — populated when status >= 'build_ready').
export interface Offer {
  type: "website-rebuild" | "seo-tuneup" | "content-package" | "review-management" | "custom";
  headline: string;
  bullets: string[];
  priceCents: number;
  /** ISO 8601 when this offer expires (used in outreach copy + agency follow-up). */
  expiresAt?: string;
  /** When type === 'custom', this carries the bespoke description. */
  customDescription?: string;
}

// projects.brief (ADR-026 — agency project kickoff brief).
export interface ProjectBrief {
  /** Verbatim from the lead's diagnosis at the time of contract signing. */
  diagnosisSnapshot: Diagnosis;
  /** The offer the client accepted. */
  acceptedOffer: Offer;
  /** Goals captured during kickoff call. */
  goals: string[];
  /** Concrete deliverables the BEC team owes. */
  deliverables: Array<{
    title: string;
    dueAt?: string;
    notes?: string;
  }>;
  /** Brand assets supplied by the client (URLs, descriptions). */
  brandAssets?: Array<{
    kind: "logo" | "color" | "font" | "copy" | "image";
    description: string;
    url?: string;
  }>;
  /** Free-form additional context from the kickoff call. */
  kickoffNotes?: string;
}
