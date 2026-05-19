import { buildSitemapXml } from "@/lib/seo";
import { getSiteContext } from "@/lib/site-context";

// Per-domain sitemap.xml (ADR-009): static + category + published-article +
// listable-business + event URLs for the resolved site only. (site) group so
// proxy injects host/site context. With no content seeded the sitemap is
// still valid — just the static + category routes (correct, not a failure;
// articles arrive from the Editor agent, Commit 2.6).
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const site = await getSiteContext();
  if (!site) {
    return new Response("Not found", { status: 404 });
  }
  const xml = await buildSitemapXml({ id: site.id, domain: site.domain });
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
