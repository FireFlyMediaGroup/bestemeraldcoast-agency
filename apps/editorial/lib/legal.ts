// Server-side loader for the ADR-014 legal pages (Commit 2.10). Content
// lives in @bec/content/legal; this thin wrapper exists so the page
// component imports a single editorial-side function (and so we have a
// place to attach per-site overrides for Editorial Standards later).

import { LEGAL_PAGES, LEGAL_SLUGS, getLegalPage } from "@bec/content";
import type { LegalPage } from "@bec/content";

export type { LegalPage };

export function listLegalPages(): readonly LegalPage[] {
  return LEGAL_PAGES;
}

export function getEditorialLegalPage(slug: string): LegalPage | undefined {
  return getLegalPage(slug);
}

export function isLegalSlug(slug: string): boolean {
  return LEGAL_SLUGS.includes(slug);
}
