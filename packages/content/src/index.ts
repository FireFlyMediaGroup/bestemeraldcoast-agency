// @bec/content public surface. Currently exports the legal pages
// manifest (ADR-014); future commits add editorial taxonomy/rotation
// content (ADR-021, ADR-040 — already cited on the package description).

export {
  LEGAL_PAGES,
  LEGAL_SLUGS,
  getLegalPage,
  type LegalPage,
  advertiserDisclosure,
  cookiePolicy,
  editorialStandards,
  privacy,
  terms,
} from "./legal/index.js";
