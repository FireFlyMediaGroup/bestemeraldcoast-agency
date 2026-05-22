import type { Metadata } from "next";

import { LegalDocument, legalMetadata } from "@/components/legal-document";

export async function generateMetadata(): Promise<Metadata> {
  return legalMetadata("cookie-policy");
}

export default function CookiePolicyPage() {
  return <LegalDocument slug="cookie-policy" />;
}
