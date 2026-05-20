// Cold-outreach email — three archetype voice/typography variants
// (ADR-032 voice, ADR-033 React-Email constraints). The pitch BODY is the
// Checker-approved copy rendered verbatim; only the chrome (greeting,
// sign-off, subject, footer) carries archetype voice. CAN-SPAM footer
// (physical address + opt-out) is non-negotiable (ADR-014/031).
//
// ADR-033 hard constraints baked in: ≤600px, system fonts only (no web
// fonts), `color-scheme: light dark` + dark counterparts, images would
// carry width/height/alt/display:block (none here — text pitch), no JS,
// no <form>, single-column.

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import type { OutreachArchetype, OutreachEmailProps } from "../types.js";

const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', Times, serif";

interface ArchetypeStyle {
  headingFont: string;
  bodyFont: string;
  /** Reversed-weight Premium puts the emphasis weight on body (ADR-033). */
  bodyWeight: number;
  headingWeight: number;
  greeting: (city: string) => string;
  signOff: string;
}

// ADR-032 voice.tone → chrome wording. Magazine = neighborly/trustworthy,
// Coastal = bright/punchy, Premium = refined/spare.
const STYLES: Record<OutreachArchetype, ArchetypeStyle> = {
  magazine: {
    headingFont: SERIF,
    bodyFont: SANS,
    bodyWeight: 400,
    headingWeight: 600,
    greeting: (city) => `Hi from your neighbors in ${city},`,
    signOff: "Talk soon,",
  },
  coastal: {
    headingFont: SANS,
    bodyFont: SANS,
    bodyWeight: 400,
    headingWeight: 700,
    greeting: (city) => `Hey ${city}!`,
    signOff: "Cheers,",
  },
  premium: {
    headingFont: SERIF,
    bodyFont: SERIF,
    bodyWeight: 500,
    headingWeight: 400,
    greeting: (city) => `Hello from ${city},`,
    signOff: "Warm regards,",
  },
};

/** Stable, archetype-toned subject (no schema subject column in v1). */
export function outreachSubject(
  archetype: OutreachArchetype,
  businessName: string,
): string {
  switch (archetype) {
    case "coastal":
      return `${businessName} — a quick local idea`;
    case "premium":
      return `Regarding ${businessName}`;
    case "magazine":
    default:
      return `A quick note about ${businessName}`;
  }
}

/**
 * Append the tracking code as a query param, preserving any existing query
 * AND any URL fragment (`#section`). Naive `${url}?ref=…` concatenation
 * stuffs the param after the fragment for `https://x.com/p#hero`, which
 * the server never sees. Splitting on `#` first keeps the fragment intact.
 */
function tracked(url: string, code: string): string {
  const hashIdx = url.indexOf("#");
  const base = hashIdx === -1 ? url : url.slice(0, hashIdx);
  const fragment = hashIdx === -1 ? "" : url.slice(hashIdx);
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}ref=${encodeURIComponent(code)}${fragment}`;
}

export function OutreachEmail(props: OutreachEmailProps) {
  const {
    archetype,
    businessName,
    city,
    bodyCopy,
    fromName,
    siteUrl,
    trackingCode,
    postalAddress,
    unsubscribeAddress,
    isReplyToMonitored,
  } = props;
  const s = STYLES[archetype] ?? STYLES.magazine;
  const ctaHref = tracked(siteUrl, trackingCode);

  // Verbatim copy → paragraphs on blank lines. Single newlines preserved
  // via whiteSpace: pre-line so the operator-/Pitcher-authored line breaks
  // survive without us editing the graded text.
  const paragraphs = bodyCopy
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const preview = `${s.greeting(city)} ${businessName}`.slice(0, 90);

  return (
    <Html lang="en" dir="ltr">
      <Head>
        {/* ADR-033: declare dark-mode support so clients flip colors. */}
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#f6f6f4", margin: 0, padding: 0 }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "32px 24px",
            backgroundColor: "#ffffff",
            fontFamily: s.bodyFont,
            color: "#1a1a1a",
          }}
        >
          <Heading
            as="h1"
            style={{
              fontFamily: s.headingFont,
              fontWeight: s.headingWeight,
              fontSize: "20px",
              lineHeight: "1.3",
              margin: "0 0 16px",
              color: "#1a1a1a",
            }}
          >
            {s.greeting(city)}
          </Heading>

          <Section>
            {paragraphs.map((p, i) => (
              <Text
                key={i}
                style={{
                  fontFamily: s.bodyFont,
                  fontWeight: s.bodyWeight,
                  fontSize: "16px",
                  lineHeight: "1.6",
                  margin: "0 0 16px",
                  color: "#1a1a1a",
                  whiteSpace: "pre-line",
                }}
              >
                {p}
              </Text>
            ))}
          </Section>

          <Section style={{ margin: "8px 0 24px" }}>
            <Link
              href={ctaHref}
              style={{
                fontFamily: s.bodyFont,
                fontSize: "16px",
                fontWeight: 600,
                color: "#1a5276",
                textDecoration: "underline",
              }}
            >
              See what we put together for {city}
            </Link>
          </Section>

          <Text
            style={{
              fontFamily: s.bodyFont,
              fontSize: "16px",
              margin: "0 0 4px",
              color: "#1a1a1a",
            }}
          >
            {s.signOff}
          </Text>
          <Text
            style={{
              fontFamily: s.headingFont,
              fontWeight: s.headingWeight,
              fontSize: "16px",
              margin: "0 0 24px",
              color: "#1a1a1a",
            }}
          >
            {fromName}
          </Text>

          <Hr style={{ borderColor: "#e2e2dd", margin: "16px 0" }} />

          {/* CAN-SPAM: physical address + a working opt-out. The opt-out
              wording mirrors ADR-031's do-not-contact reply classifier. */}
          <Text
            style={{
              fontFamily: SANS,
              fontSize: "12px",
              lineHeight: "1.5",
              color: "#6b6b6b",
              margin: "0 0 4px",
            }}
          >
            {fromName} · {postalAddress}
          </Text>
          {/* CAN-SPAM opt-out wording must match a path the operator is
              actually monitoring. "Reply unsubscribe" only works when a
              monitored Reply-To is set; otherwise we point at the explicit
              unsubscribe inbox (mailto) so the recipient has a guaranteed
              working channel either way. */}
          <Text
            style={{
              fontFamily: SANS,
              fontSize: "12px",
              lineHeight: "1.5",
              color: "#6b6b6b",
              margin: 0,
            }}
          >
            Not interested?{" "}
            {isReplyToMonitored ? (
              <>
                Reply with “unsubscribe” and we’ll remove you and never
                contact you again.
              </>
            ) : (
              <>
                Email{" "}
                <Link
                  href={`mailto:${unsubscribeAddress}?subject=unsubscribe`}
                  style={{ color: "#6b6b6b", textDecoration: "underline" }}
                >
                  {unsubscribeAddress}
                </Link>{" "}
                with “unsubscribe” and we’ll remove you and never contact
                you again.
              </>
            )}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OutreachEmail;
