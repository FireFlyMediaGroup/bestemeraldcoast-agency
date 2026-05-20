// Legal pages manifest (ADR-014). Five pages shared across all 8 sites
// in the editorial network; editorial-standards is the only one allowed
// per-site overrides (ADR-014 — future commit work). Editorial app
// consumes this via @bec/content/legal and renders the markdown content
// through its existing markdown renderer.

import { advertiserDisclosure } from "./advertiser-disclosure.js";
import { cookiePolicy } from "./cookie-policy.js";
import { editorialStandards } from "./editorial-standards.js";
import { privacy } from "./privacy.js";
import { terms } from "./terms.js";

export interface LegalPage {
  readonly slug: string;
  readonly title: string;
  /** ISO date (YYYY-MM-DD) of the last substantive update. */
  readonly updatedAt: string;
  /** Markdown source rendered through the editorial markdown pipeline. */
  readonly content: string;
}

// Order matches the canonical footer link order (Privacy → Terms →
// Advertiser → Cookies → Editorial Standards). Don't reorder casually —
// downstream UI may iterate this for the footer nav.
export const LEGAL_PAGES: readonly LegalPage[] = [
  privacy,
  terms,
  advertiserDisclosure,
  cookiePolicy,
  editorialStandards,
];

export const LEGAL_SLUGS: readonly string[] = LEGAL_PAGES.map((p) => p.slug);

/** Lookup by slug (returns `undefined` for an unknown one — caller 404s). */
export function getLegalPage(slug: string): LegalPage | undefined {
  return LEGAL_PAGES.find((p) => p.slug === slug);
}

export { advertiserDisclosure, cookiePolicy, editorialStandards, privacy, terms };
