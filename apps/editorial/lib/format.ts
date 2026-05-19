// Shared slug → human-readable title. Used for both the page <h1> and the
// metadata <title> so they never diverge (CodeRabbit: kebab slug leaked into
// the browser tab while the heading was spaced).
export function titleize(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
