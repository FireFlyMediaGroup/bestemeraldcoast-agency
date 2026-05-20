// Cookie Policy — ADR-014.
//
// V1 operator-authored placeholder. Lawyer review per ADR-014 is a
// DEFERRED operator action; this is the structural scaffold paired with
// the vanilla-cookieconsent banner shipped at Commit 2.10.

export const cookiePolicy = {
  slug: "cookie-policy",
  title: "Cookie Policy",
  updatedAt: "2026-05-20",
  content: `# Cookie Policy

_Last updated: May 20, 2026._

This page lists the cookies and similar storage we use, why we use them,
and how you can control them. It pairs with the consent banner you see
the first time you visit, where you can accept all, reject all, or
manage individual categories.

## What's a cookie?

A small piece of data a site stores in your browser to remember
something between page loads — a session, a preference, a consent
choice. Some are set by us; some by the services we use (e.g.,
PostHog for analytics). All can be cleared from your browser settings.

## The categories we use

### Strictly necessary

These are required for the site to work — they remember your consent
choice and basic preferences. We never gate these behind consent because
without them, the site can't function. They contain no tracking data.

| Name | Purpose | Storage | Duration |
|---|---|---|---|
| \`cc_cookie\` | Stores your consent decision for this site. | First-party cookie | 6 months |

### Analytics _(optional — opt-in or opt-out via the banner)_

Anonymous usage statistics that help us understand which pages people
read and what's broken. We use **PostHog** with IP-address anonymization
and no cross-site identifiers. Analytics cookies only load **after you
accept** the analytics category in the banner.

| Name | Provider | Purpose | Duration |
|---|---|---|---|
| \`ph_*\` | PostHog | Anonymous page-view and event analytics. | Up to 12 months |

## How to control them

- **The consent banner** — accept, reject, or manage by category. You
  can re-open it any time from the "Cookie preferences" link in the
  site footer.
- **Your browser settings** — every major browser lets you delete
  existing cookies and block future ones. Doing so for the strictly-
  necessary cookies above will not break the site, but you'll see the
  consent banner again on your next visit.
- **Global Privacy Control** — if your browser sends a GPC signal, we
  treat it as a request to opt out of analytics, regardless of the
  banner state.

## Regional behavior

- **In the EU / UK / EEA:** the banner appears with **opt-in** defaults
  — analytics is off until you accept it, per the GDPR / ePrivacy
  Directive.
- **In the US and elsewhere:** the banner appears with the same
  controls; analytics defaults follow your local jurisdiction's rules
  (where opt-out is the standard, such as California, the banner still
  honors a rejection).

## Changes

If we add or remove a cookie category we update this page and refresh
the consent banner so you can re-choose.

## Contact

**privacy@bestemeraldcoast.com**
`,
} as const;
