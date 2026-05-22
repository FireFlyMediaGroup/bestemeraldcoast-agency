// ADR-014 legal section — narrow measure for long-form policy copy.

export default function LegalSectionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="legal-prose">{children}</div>;
}
