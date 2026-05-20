// Privacy Policy — ADR-014.
//
// V1 operator-authored placeholder that meets ADR-014's structural
// requirements (analytics, cookies, newsletter signup, retention, third-
// party processors, CCPA / GDPR rights, contact). Lawyer review per
// ADR-014 is a DEFERRED operator action; this file is the structural
// scaffold, not legal advice. Update copy after lawyer review; bump
// `updatedAt` on each substantive change so the rendered footer shows
// the current effective date.

export const privacy = {
  slug: "privacy",
  title: "Privacy Policy",
  updatedAt: "2026-05-20",
  content: `# Privacy Policy

_Last updated: May 20, 2026._

This Privacy Policy explains what information we collect when you visit
this site or subscribe to our newsletter, how we use it, who we share it
with, and the rights you have over it. The site is operated by Best
Emerald Coast Media (Florida, USA).

## What we collect

- **Site analytics.** Anonymous usage data — pages viewed, referring
  source, country, device class — collected via our analytics provider
  (PostHog). We do **not** collect your name, email, IP address in
  identifiable form, or any cross-site browsing history.
- **Newsletter signups.** When you subscribe, we store the email address
  you provide, the date you confirmed, and the site you signed up on. We
  do not buy or sell email lists.
- **Contact forms / replies.** If you email or reply to one of our
  outreach messages, we keep the conversation thread for the period
  needed to respond and to honor any opt-out request.
- **Cookies.** Only essential cookies (site preferences, your consent
  choice) plus, with your explicit consent, analytics cookies. See our
  [Cookie Policy](/cookie-policy) for the full list.

## How we use it

- To operate, secure, and improve the site.
- To send the newsletter you subscribed to (and only that one).
- To respond to messages you send us.
- To detect abuse and prevent fraud.

We do **not** sell your personal information, share it with advertisers
in identifiable form, or use it to train third-party AI models.

## Who we share it with (processors)

We use a small set of well-known service providers as data processors.
Each is bound by a data-processing agreement and only handles your data
on our instructions:

- **Vercel** — site hosting (United States).
- **Neon** — Postgres database (United States).
- **PostHog** — product analytics (United States).
- **Resend** — transactional email (United States).
- **Amazon SES** — newsletter email (United States).
- **Sentry** — error monitoring (United States).
- **Upstash** — rate limiting and caching (United States).
- **Cloudflare** — bot defense / CAPTCHA on signup forms.

## How long we keep it

- **Newsletter subscriptions:** until you unsubscribe, then 30 days for
  audit logs (so we can prove we honored the unsubscribe).
- **Reply threads:** up to 24 months, then deleted.
- **Site analytics:** up to 24 months in aggregated, anonymous form.
- **Error logs:** 90 days.

## Your rights

Depending on where you live you have specific rights over your data:

- **Everywhere:** you can unsubscribe from any email we send with one
  click (every email has an unsubscribe link or address) and we will
  remove you within 10 business days.
- **EU / UK (GDPR):** access, correction, deletion, restriction,
  portability, and objection rights. Lawful basis: legitimate interest
  for site analytics; consent for marketing emails.
- **California (CCPA / CPRA):** right to know what we collect, right to
  delete, right to opt out of "sale" (we do not sell), right to limit
  use of sensitive personal information.
- **Virginia / Colorado / Connecticut / Utah:** equivalent rights under
  each state's privacy act.

To exercise any right, email the contact address below. We respond
within the legally required window in your jurisdiction.

## Contact

Privacy questions and data requests:
**privacy@bestemeraldcoast.com**

Mailing address:
_Best Emerald Coast Media — see [Editorial Standards](/editorial-standards)
for the current operator mailing address._
`,
} as const;
