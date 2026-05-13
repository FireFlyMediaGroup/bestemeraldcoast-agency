// Shared ESLint flat config (ESLint 9+) — placeholder for Phase 0 / Commit 0.1.
// Real rule sets land in Phase 0 / Commit 0.6 (CI baseline) alongside lint plugins.
// Consuming packages import this as: import bec from "@bec/config-eslint";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/build/**",
      "**/coverage/**"
    ]
  }
];
