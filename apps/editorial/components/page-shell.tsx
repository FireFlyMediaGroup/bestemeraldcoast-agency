// Minimal accessible page scaffold for the Commit 2.1 shell. Real archetype
// layouts (ArticleLayout, ListicleSection, BusinessCard, …) arrive in
// Commit 2.2 from @bec/ui; this keeps every shell route a valid, single-h1,
// landmark-correct, theme-variable-only placeholder so the 8-domain routing
// + Lighthouse acceptance can be proven now without pre-empting 2.2.

import type { ReactNode } from "react";

export function PageShell({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children?: ReactNode;
}) {
  return (
    <article>
      {kicker ? (
        <p
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontSize: "0.75rem",
            color: "var(--bec-color-muted-fg)",
            margin: 0,
          }}
        >
          {kicker}
        </p>
      ) : null}
      <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", lineHeight: 1.2 }}>
        {title}
      </h1>
      <div style={{ color: "var(--bec-color-muted-fg)", lineHeight: 1.6 }}>
        {children ?? (
          <p>
            This section is part of the editorial shell (Commit 2.1). Content
            and the archetype layout land in later Phase 2 commits.
          </p>
        )}
      </div>
    </article>
  );
}
