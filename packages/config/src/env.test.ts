import { describe, expect, it } from "vitest";

import { EnvValidationError, parseEnv, resolveAppEnv } from "./env.js";

const validDev = {
  NODE_ENV: "development",
  DATABASE_URL: "postgres://user:pw@localhost:5432/bec",
} satisfies NodeJS.ProcessEnv;

const validProd = {
  NODE_ENV: "production",
  VERCEL_ENV: "production",
  DATABASE_URL: "postgres://user:pw@db.neon.tech:5432/bec",
  AGENT_API_KEY: "agent-key-xxxxxxxx",
  NEXTAUTH_URL: "https://ops.bestemeraldcoast.com",
  NEXTAUTH_SECRET: "0123456789abcdef0123456789abcdef",
  ANTHROPIC_API_KEY: "sk-ant-xxxxxxxxxxxx",
  RESEND_API_KEY: "re_xxxxxxxxxxxx",
  SENTRY_DSN: "https://abc@o0.ingest.sentry.io/0",
  CRON_SECRET: "0123456789abcdef",
} satisfies NodeJS.ProcessEnv;

describe("resolveAppEnv", () => {
  it("prefers VERCEL_ENV over NODE_ENV", () => {
    expect(resolveAppEnv({ VERCEL_ENV: "preview", NODE_ENV: "production" })).toBe("preview");
  });

  it("falls back to NODE_ENV=production → production", () => {
    expect(resolveAppEnv({ NODE_ENV: "production" })).toBe("production");
  });

  it("defaults to development", () => {
    expect(resolveAppEnv({})).toBe("development");
  });
});

describe("parseEnv — dev", () => {
  it("accepts a minimal dev env (just DATABASE_URL)", () => {
    const result = parseEnv(validDev);
    expect(result.env).toBe("development");
    expect(result.server.DATABASE_URL).toBe(validDev.DATABASE_URL);
  });

  it("rejects a dev env missing DATABASE_URL with a clear field error", () => {
    expect(() => parseEnv({ NODE_ENV: "development" })).toThrow(EnvValidationError);
    try {
      parseEnv({ NODE_ENV: "development" });
    } catch (err) {
      const e = err as EnvValidationError;
      expect(e.fieldErrors.DATABASE_URL).toBeTruthy();
      expect(e.message).toContain("DATABASE_URL");
    }
  });

  it("parses PROD_DB_ALLOWED as a real boolean", () => {
    const result = parseEnv({ ...validDev, PROD_DB_ALLOWED: "true" });
    expect(result.server.PROD_DB_ALLOWED).toBe(true);
  });

  it("parses EMAIL_REAL_SEND_ENABLED=false as boolean false", () => {
    const result = parseEnv({ ...validDev, EMAIL_REAL_SEND_ENABLED: "false" });
    expect(result.server.EMAIL_REAL_SEND_ENABLED).toBe(false);
  });

  it("rejects an invalid DATABASE_URL", () => {
    expect(() => parseEnv({ ...validDev, DATABASE_URL: "not-a-url" })).toThrow(
      EnvValidationError,
    );
  });
});

describe("parseEnv — production", () => {
  it("accepts a full prod env", () => {
    const result = parseEnv(validProd);
    expect(result.env).toBe("production");
    expect(result.server.ANTHROPIC_API_KEY).toBe(validProd.ANTHROPIC_API_KEY);
  });

  it("rejects prod env missing ANTHROPIC_API_KEY", () => {
    const { ANTHROPIC_API_KEY: _, ...rest } = validProd;
    void _;
    expect(() => parseEnv(rest)).toThrow(EnvValidationError);
  });

  it("rejects prod env with a wrong-prefix ANTHROPIC_API_KEY", () => {
    expect(() => parseEnv({ ...validProd, ANTHROPIC_API_KEY: "sk-openai-xxx" })).toThrow(
      EnvValidationError,
    );
  });

  it("rejects prod env with a short NEXTAUTH_SECRET", () => {
    expect(() => parseEnv({ ...validProd, NEXTAUTH_SECRET: "short" })).toThrow(
      EnvValidationError,
    );
  });
});
