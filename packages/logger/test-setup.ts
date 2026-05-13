// Vitest setup — runs before any test file imports a module.
//
// @bec/config's `parseEnv()` runs at module load and requires DATABASE_URL.
// Inject a placeholder so logger tests don't depend on a real .env. Also
// clear the external-transport vars so the logger uses stdout only (transport
// tests mock @sentry/node and fetch explicitly when they need to).

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test";
delete process.env.SENTRY_DSN;
delete process.env.SENTRY_AUTH_TOKEN;
delete process.env.AXIOM_TOKEN;
delete process.env.AXIOM_DATASET;
