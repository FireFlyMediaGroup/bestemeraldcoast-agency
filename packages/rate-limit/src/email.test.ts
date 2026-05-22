import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:dns", async () => {
  const actual = await vi.importActual<typeof import("node:dns")>("node:dns");
  return {
    ...actual,
    promises: {
      ...actual.promises,
      resolveMx: vi.fn(),
    },
  };
});

import { promises as dnsPromises } from "node:dns";

import { __resetDisposableDomainCacheForTesting, validateEmail } from "./email.js";

beforeEach(() => {
  __resetDisposableDomainCacheForTesting();
  // Default: every domain has an MX record. Individual tests override.
  vi.mocked(dnsPromises.resolveMx).mockResolvedValue([
    { exchange: "mx.example.com", priority: 10 },
  ]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("validateEmail — syntax", () => {
  it("rejects empty / whitespace input", async () => {
    const r = await validateEmail("   ");
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("syntax");
  });

  it("rejects missing @", async () => {
    const r = await validateEmail("notanemail");
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("syntax");
  });

  it("rejects missing TLD", async () => {
    const r = await validateEmail("a@b");
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("syntax");
  });

  it("rejects multiple @", async () => {
    const r = await validateEmail("a@b@c.com");
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("syntax");
  });

  it("normalizes whitespace + casing", async () => {
    const r = await validateEmail("  Hello@Example.COM ");
    expect(r.normalized).toBe("hello@example.com");
  });
});

describe("validateEmail — disposable-domain blocklist", () => {
  it("rejects mailinator.com (a known disposable provider)", async () => {
    const r = await validateEmail("user@mailinator.com");
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("disposable");
    // Disposable check short-circuits before DNS.
    expect(dnsPromises.resolveMx).not.toHaveBeenCalled();
  });

  it("rejects disposable domains case-insensitively", async () => {
    const r = await validateEmail("user@MAILINATOR.COM");
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("disposable");
  });
});

describe("validateEmail — MX lookup", () => {
  it("rejects when DNS returns no MX records", async () => {
    vi.mocked(dnsPromises.resolveMx).mockResolvedValueOnce([]);
    const r = await validateEmail("user@no-mx.test");
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("no_mx");
  });

  it("rejects when DNS lookup throws (ENOTFOUND/SERVFAIL)", async () => {
    vi.mocked(dnsPromises.resolveMx).mockRejectedValueOnce(
      Object.assign(new Error("nope"), { code: "ENOTFOUND" }),
    );
    const r = await validateEmail("user@no-such-domain.invalid");
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("no_mx");
  });

  it("accepts a valid address whose domain has MX records", async () => {
    const r = await validateEmail("hello@gmail.com");
    expect(r.valid).toBe(true);
    expect(r.reason).toBeUndefined();
    expect(r.normalized).toBe("hello@gmail.com");
  });
});
