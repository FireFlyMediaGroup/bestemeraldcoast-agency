import { getSiteContext } from "@/lib/site-context";
import { PageShell } from "@/components/page-shell";

export default async function HomePage() {
  const site = await getSiteContext();
  return (
    <PageShell
      kicker={site?.tagline ?? "Local guide"}
      title={site?.name ?? "Best Emerald Coast"}
    >
      <p>
        Home shell for <strong>{site?.domain ?? "the editorial network"}</strong>.
        The Magazine / Coastal / Premium archetype layout and real content
        arrive in Phase 2 (Commits 2.2–2.5).
      </p>
    </PageShell>
  );
}
