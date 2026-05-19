"use client";

// Top-level error boundary. Next renders this WITHOUT the root layout, so it
// must be a self-contained client component: its own <html>/<body>, no
// @bec/ui, no headers()/site context. Kept minimal and dependency-free.

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100dvh",
          margin: 0,
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#fbfbfc",
          color: "#141519",
        }}
      >
        <main style={{ textAlign: "center", padding: "2rem", maxWidth: "32rem" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#555", marginBottom: "1.5rem" }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              minHeight: 44,
              minWidth: 44,
              padding: "0.5rem 1.25rem",
              borderRadius: 8,
              border: "1px solid #141519",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
