import { buildRobotsTxt } from "@/lib/seo";
import { getSiteContext } from "@/lib/site-context";

// Per-domain robots.txt (ADR-009). Lives in the (site) group so proxy.ts
// injects the resolved host/site context (Commit 2.4 removed robots.txt
// from proxy's skip set for exactly this). Per-request, per-domain — never
// statically shared across hosts. Stays dynamic via getSiteContext() (no
// `export const dynamic` — incompatible with cacheComponents in Next 16).

export async function GET(): Promise<Response> {
  const site = await getSiteContext();
  if (!site) {
    // Unknown host: no robots for a domain that isn't part of the network.
    return new Response("Not found", { status: 404 });
  }
  return new Response(buildRobotsTxt(site.domain), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
