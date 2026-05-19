import { notFound } from "next/navigation";

// Explicit target for proxy.ts's unmapped-host rewrite. A literal/static
// path segment outranks the dynamic `(site)/[category]` route, so an
// unknown host reliably reaches HERE (not a category page) and we emit a
// real 404 via notFound() → app/not-found.tsx. Lives OUTSIDE the (site)
// group so it renders under the minimal static root layout with no
// per-site chrome (there is no site).

export default function UnknownHost(): never {
  notFound();
}
