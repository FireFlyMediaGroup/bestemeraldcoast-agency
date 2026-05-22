// Vitest setup — runs before any test file imports a module.
//
// @bec/config's `parseEnv()` runs at module load and requires DATABASE_URL.
// Inject a placeholder so rate-limit tests don't depend on a real .env.
// Tests that need Upstash/Turnstile creds set them per-test via vi.stubEnv.

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test";
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.TURNSTILE_SECRET_KEY;
