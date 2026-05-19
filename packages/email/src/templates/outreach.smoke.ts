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
  const { html, text } = await renderOutreachEmail({
    archetype,
    businessName: "Joe's Coffee",
    city: "Pensacola",
    bodyCopy: BODY,
    fromName: "Best Pensacola",
    siteUrl: "https://bestpensacola.com",
    trackingCode: TRACKING,
    postalAddress: "123 Example St, Pensacola, FL 32502",
  });

  check(`${archetype}: renders non-empty html`, html.length > 200);
  check(`${archetype}: tracking code embedded in a link`, html.includes(`ref=${TRACKING}`));
  check(`${archetype}: no javascript: URLs`, !/javascript:/i.test(html));
  check(`${archetype}: no <script>`, !/<script/i.test(html));
  check(`${archetype}: no <form>`, !/<form/i.test(html));
  check(`${archetype}: dark-mode meta present`, /color-scheme/i.test(html));
  check(`${archetype}: 600px max width`, html.includes("600px"));
  check(
    `${archetype}: CAN-SPAM address present`,
    html.includes("123 Example St, Pensacola, FL 32502"),
  );
  check(`${archetype}: opt-out line present`, /unsubscribe/i.test(html));
  check(
    `${archetype}: body copy preserved verbatim`,
    text.includes("Palafox Street") && text.includes("Worth a quick look?"),
  );
  check(
    `${archetype}: subject is non-empty + names the business`,
    outreachSubject(archetype, "Joe's Coffee").includes("Joe's Coffee"),
  );
}

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nall outreach template invariants hold");
