import type { Metadata } from "next";

import { LegalPlaceholder } from "../legal-placeholder";

export const metadata: Metadata = { title: "Editorial Standards" };

export default function EditorialStandardsPage() {
  return <LegalPlaceholder title="Editorial Standards" />;
}
