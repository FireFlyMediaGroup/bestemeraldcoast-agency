import type { Metadata } from "next";

import { LegalDocument, legalMetadata } from "@/components/legal-document";

export async function generateMetadata(): Promise<Metadata> {
  return legalMetadata("advertiser-disclosure");
}

export default function AdvertiserDisclosurePage() {
  return <LegalDocument slug="advertiser-disclosure" />;
}
