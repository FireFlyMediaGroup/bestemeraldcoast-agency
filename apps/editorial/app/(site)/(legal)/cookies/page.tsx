import type { Metadata } from "next";

import { LegalPlaceholder } from "../legal-placeholder";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiesPage() {
  return <LegalPlaceholder title="Cookie Policy" />;
}
