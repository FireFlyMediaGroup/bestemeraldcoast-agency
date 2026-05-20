"use client";

// Cookie consent banner — Commit 2.10 (ADR-014). Uses vanilla-cookieconsent
// v3 because PostHog Web isn't in editorial yet and a focused consent lib
// is the smallest surface that covers the ADR's "minimal banner non-EU /
// full CMP EU" requirement. Categories defined here are inert until
// downstream consumers (future PostHog client, future ads) gate on them.
//
// Region behavior:
// - vanilla-cookieconsent v3 supports per-category `mode: 'opt-in'`
//   (default OFF until accepted) vs `mode: 'opt-out'` (default ON until
//   rejected). We use opt-in for analytics globally (the most privacy-
//   conservative + GDPR-correct posture). The reject-all path is one
//   click in the banner; the manage-preferences path opens a granular
//   modal — same UI for EU and non-EU. ADR-014's "minimal banner / full
//   CMP" split is satisfied by the library's bar+modal pair: the bar is
//   the minimal default; the modal is the CMP, reachable both from the
//   bar and from a permanent footer link.
//
// Re-open the banner anywhere via `window.__becReopenCookieBanner?.()`
// (wired from the footer's "Cookie preferences" link).

import { useEffect } from "react";

import "vanilla-cookieconsent/dist/cookieconsent.css";
import * as CookieConsent from "vanilla-cookieconsent";

declare global {
  interface Window {
    __becReopenCookieBanner?: () => void;
  }
}

export function CookieConsentBanner() {
  useEffect(() => {
    let cancelled = false;
    void CookieConsent.run({
      guiOptions: {
        consentModal: {
          layout: "bar inline",
          position: "bottom",
          equalWeightButtons: true,
          flipButtons: false,
        },
        preferencesModal: {
          layout: "box",
          position: "right",
          equalWeightButtons: true,
          flipButtons: false,
        },
      },
      categories: {
        necessary: {
          enabled: true,
          readOnly: true,
        },
        analytics: {
          // opt-in default — GDPR-correct + safe everywhere.
          enabled: false,
          readOnly: false,
        },
      },
      language: {
        default: "en",
        translations: {
          en: {
            consentModal: {
              title: "Cookies on this site",
              description:
                "We use essential cookies to run the site. With your consent, we also use anonymous analytics to understand which pages people read so we can write better local coverage. You can change this any time.",
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Reject all",
              showPreferencesBtn: "Manage preferences",
              footer:
                '<a href="/privacy">Privacy</a> · <a href="/cookie-policy">Cookie policy</a>',
            },
            preferencesModal: {
              title: "Cookie preferences",
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Reject all",
              savePreferencesBtn: "Save my choices",
              closeIconLabel: "Close",
              sections: [
                {
                  title: "How we use cookies",
                  description:
                    'We use only the cookies we need to run the site, plus optional anonymous analytics. We never sell your data and we honor a "reject all" choice. Full detail in our <a href="/cookie-policy">Cookie Policy</a>.',
                },
                {
                  title: "Strictly necessary",
                  description:
                    "Required for the site to function — remembering your consent choice and basic preferences. Cannot be disabled.",
                  linkedCategory: "necessary",
                },
                {
                  title: "Analytics",
                  description:
                    "Anonymous, aggregated usage data via PostHog (IP anonymized, no cross-site tracking). Off by default; turn on if you'd like to help us improve the site.",
                  linkedCategory: "analytics",
                },
              ],
            },
          },
        },
      },
    });

    if (!cancelled) {
      window.__becReopenCookieBanner = () => {
        CookieConsent.showPreferences();
      };
    }

    return () => {
      cancelled = true;
      delete window.__becReopenCookieBanner;
    };
  }, []);

  return null;
}

// Default + named export so call sites can `import { CookieConsent }`
// (matches the (site)/layout.tsx mount style).
export { CookieConsentBanner as CookieConsent };
export default CookieConsentBanner;
