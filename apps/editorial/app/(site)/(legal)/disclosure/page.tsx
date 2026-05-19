import type { Metadata } from "next";

import { LegalPlaceholder } from "../legal-placeholder";

export const metadata: Metadata = { title: "Advertising Disclosure" };

export default function DisclosurePage() {
  return <LegalPlaceholder title="Advertising Disclosure" />;
}
