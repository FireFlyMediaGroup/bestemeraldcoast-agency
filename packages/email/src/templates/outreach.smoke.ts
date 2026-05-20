// Real `test:unit` for @bec/email (the repo has no vitest harness yet, so
// this is a standalone tsx assertion runner — ADR-016 "every email template
// renders to HTML and is checked"). Renders all three archetypes and
// asserts the inbox-safety + compliance invariants. Exits non-zero on any
// failure so CI's `pnpm test:unit` gates it.

import { renderOutreachEmail } from "../render.js";
import { outreachSubject } from "./outreach.js";
import type { OutreachArchetype } from "../types.js";

const ARCHETYPES: OutreachArchetype[] = ["magazine", "coastal", "premium"];
const TRACKING = "trk_abc123";
const BODY =
  "Saw your shop on Palafox Street and noticed the site is hard to read on a phone.\n\nWe build fast local sites for Pensacola businesses. Worth a quick look?";

let failed = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${name}`);
  } else {
    console.log(`ok    ${name}`);
  }
}

for (const archetype of ARCHETYPES) {
  // Render once with a monitored Reply-To, once with the mailto fallback —
  // both paths must produce a working opt-out (CAN-SPAM; cubic P1).
  const monitored = await renderOutreachEmail({
    archetype,
    businessName: "Joe's Coffee",
    city: "Pensacola",
    bodyCopy: BODY,
    fromName: "Best Pensacola",
    siteUrl: "https://bestpensacola.com#hero", // includes fragment (CR finding)
    trackingCode: TRACKING,
    postalAddress: "123 Example St, Pensacola, FL 32502",
    unsubscribeAddress: "replies@ops.bestemeraldcoast.com",
    isReplyToMonitored: true,
  });
  const fallback = await renderOutreachEmail({
    archetype,
    businessName: "Joe's Coffee",
    city: "Pensacola",
    bodyCopy: BODY,
    fromName: "Best Pensacola",
    siteUrl: "https://bestpensacola.com?utm=x", // includes pre-existing query
    trackingCode: TRACKING,
    postalAddress: "123 Example St, Pensacola, FL 32502",
    unsubscribeAddress: "unsubscribe@ops.bestemeraldcoast.com",
    isReplyToMonitored: false,
  });

  for (const [variant, rendered] of [
    ["monitored", monitored],
    ["fallback", fallback],
  ] as const) {
    const { html, text } = rendered;
    const tag = `${archetype}/${variant}`;
    check(`${tag}: renders non-empty html`, html.length > 200);
    check(`${tag}: tracking code embedded in a link`, html.includes(`ref=${TRACKING}`));
    check(`${tag}: no javascript: URLs`, !/javascript:/i.test(html));
    check(`${tag}: no <script>`, !/<script/i.test(html));
    check(`${tag}: no <form>`, !/<form/i.test(html));
    check(`${tag}: dark-mode meta present`, /color-scheme/i.test(html));
    check(`${tag}: 600px max width`, html.includes("600px"));
    check(
      `${tag}: CAN-SPAM address present`,
      html.includes("123 Example St, Pensacola, FL 32502"),
    );
    check(`${tag}: opt-out instruction present`, /unsubscribe/i.test(html));
    check(
      `${tag}: body copy preserved verbatim`,
      text.includes("Palafox Street") && text.includes("Worth a quick look?"),
    );
    check(
      `${tag}: subject is non-empty + names the business`,
      outreachSubject(archetype, "Joe's Coffee").includes("Joe's Coffee"),
    );
  }

  // Variant-specific footer wording — never tell the recipient to reply
  // when no monitored Reply-To exists.
  check(
    `${archetype}: monitored variant invites reply`,
    /Reply\s+with\s+["“]unsubscribe["”]/i.test(monitored.html),
  );
  check(
    `${archetype}: fallback variant uses mailto:`,
    fallback.html.includes("mailto:unsubscribe@ops.bestemeraldcoast.com"),
  );
  check(
    `${archetype}: fallback variant does NOT invite a reply`,
    !/Reply\s+with\s+["“]unsubscribe["”]/i.test(fallback.html),
  );
  // tracked() preserves URL fragments and existing queries (CR finding).
  check(
    `${archetype}: tracked URL preserves #fragment`,
    monitored.html.includes(`?ref=${TRACKING}#hero`),
  );
  // React serializes `&` in href attributes as `&amp;`, so accept either
  // form when verifying that an existing query string is preserved.
  check(
    `${archetype}: tracked URL preserves existing ?query`,
    new RegExp(`utm=x&(amp;)?ref=${TRACKING}`).test(fallback.html),
  );
}

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nall outreach template invariants hold");
