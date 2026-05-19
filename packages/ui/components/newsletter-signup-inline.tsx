// Inline newsletter capture (mid/end of article). Real, accessible <form>:
// a programmatically-associated <label> (visually hidden, not placeholder-
// only — WCAG 2.2 AA 1.3.1/3.3.2), required email input, single submit.
// Action is wired by the consuming app (Phase 3 newsletter); defaults to a
// no-op-safe POST target. Tokenized, framework-neutral.

export interface NewsletterSignupInlineProps {
  /** Form POST target; the app supplies the real endpoint. */
  action?: string;
  heading?: string;
  blurb?: string;
  /** Stable id base so label/input association is unique on a page. */
  idBase?: string;
  className?: string;
}

export function NewsletterSignupInline({
  action = "/api/newsletter/subscribe",
  heading = "Get the weekly local guide",
  blurb = "One email a week. The best of what's happening, no spam.",
  idBase = "nl",
  className,
}: NewsletterSignupInlineProps) {
  const inputId = `${idBase}-email`;
  return (
    <section
      aria-labelledby={`${idBase}-heading`}
      className={["border border-border bg-muted text-foreground p-6", className]
        .filter(Boolean)
        .join(" ")}
      style={{ borderRadius: "var(--bec-radius-lg)" }}
    >
      <h2
        id={`${idBase}-heading`}
        className="m-0 font-heading text-xl font-semibold"
      >
        {heading}
      </h2>
      <p className="mt-1 font-body text-sm text-muted-fg">{blurb}</p>
      <form
        action={action}
        method="post"
        className="mt-4 flex flex-col gap-3 sm:flex-row"
      >
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <input
          id={inputId}
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="min-h-11 flex-1 border border-border bg-background px-3 py-2 font-body text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          style={{ borderRadius: "var(--bec-radius-md)" }}
        />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center bg-primary px-5 py-2 font-medium text-primary-fg hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          style={{ borderRadius: "var(--bec-radius-md)" }}
        >
          Subscribe
        </button>
      </form>
    </section>
  );
}
