// Editorial Standards (and Contact) — ADR-014 + ADR-027.
//
// V1 operator-authored placeholder. ADR-014 allows per-site overrides on
// THIS page only; future per-site content can shadow this default. The
// CAN-SPAM physical mailing address belongs here and MUST be a real one
// before any outbound newsletter or pitched outreach goes out (ADR-031
// hard send gate). Lawyer review of the rest per ADR-014 is a DEFERRED
// operator action.

export const editorialStandards = {
  slug: "editorial-standards",
  title: "Editorial Standards",
  updatedAt: "2026-05-20",
  content: `# Editorial Standards

_Last updated: May 20, 2026._

Local journalism is only as good as its standards. Ours are short on
purpose so we can actually follow them.

## Who we are

Best Emerald Coast Media is an independent, locally-operated publisher
covering the cities and towns of Florida's Emerald Coast — Pensacola,
Pensacola Beach, Fort Walton Beach, Destin, the South Walton beaches,
30A, and surrounding communities. We are not affiliated with any
chamber of commerce, tourism bureau, or local government.

## What we publish

We publish three kinds of content, and we label them clearly:

1. **Editorial** — articles we chose, researched, and wrote. No
   advertiser paid for placement.
2. **Sponsored** — content paid for by a sponsor. Always labeled
   "PAID PARTNER CONTENT" above the title.
3. **Reader contributions** — letters, tips, and corrections, edited
   only for length and clarity.

See [Advertiser Disclosure](/advertiser-disclosure) for the financial
relationships behind those labels.

## How we use AI

Some of our articles are **drafted with AI assistance and reviewed by a
human editor** before publication. When that's the case, the byline on
the article says so explicitly (e.g., "Drafted with AI assistance,
edited by [Editor name]"). We are responsible for everything we publish
— a draft we couldn't stand behind is a draft we don't publish. AI does
not get a byline of its own; it is a tool, not an author.

## Sourcing and fact-checking

- **Direct sources first.** Names, hours, prices, addresses, and dates
  come from the business's own website, phone call, or an in-person
  visit when we can manage it. We do not paraphrase another publication
  as the primary source.
- **Map data.** Listings and locations are checked against Google Maps
  Places at publish time and re-verified periodically.
- **Quotes.** Quotes are recorded or contemporaneously written down. We
  do not invent quotes or composite multiple speakers.
- **Photographs.** We credit the photographer or source on every photo.
  AI-generated imagery is labeled.

## Corrections

If we get something wrong, we fix it and say so. To request a
correction email **corrections@bestemeraldcoast.com** with the article
URL and what's wrong. We aim to respond the same business day and to
update the article within 48 hours of confirmation, with a dated
correction note appended at the bottom.

## Independence and editorial firewall

Editorial decisions — what we cover, how we frame it, which businesses
appear in "best of" lists — are made independent of advertiser
relationships. Sponsors do not see drafts of editorial pieces, do not
have line-edit rights, and do not get told in advance which articles
will run. If a sponsor pressures us, we say no and we walk away from
the relationship. If a reader spots an apparent conflict we did not
disclose, please tell us — see Corrections above.

## How we handle outreach

When we email a local business about coverage or services, we include a
working unsubscribe path in every message and we honor "remove" requests
within 10 business days. We do not sell, share, or reuse contact
information beyond the conversation thread it appeared in.

## Contact

- **Editor:** **editor@bestemeraldcoast.com**
- **Corrections:** **corrections@bestemeraldcoast.com**
- **Privacy / data requests:** **privacy@bestemeraldcoast.com**
- **Legal / DMCA:** **legal@bestemeraldcoast.com**

**Mailing address (CAN-SPAM):**
_Best Emerald Coast Media — operator address goes here. Set
\`OUTREACH_POSTAL_ADDRESS\` in the production environment AND replace
this paragraph with the real address before the first outreach send._
`,
} as const;
