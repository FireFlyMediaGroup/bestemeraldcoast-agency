import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { verifyTurnstile } from "./turnstile.js";

// Mutable mock object so individual tests can flip the secret on/off.
const mockEnv = { TURNSTILE_SECRET_KEY: undefined as string | undefined };

vi.mock("@bec/config", () => ({
  get serverEnv() {
    return mockEnv;
  },
}));

vi.mock("@bec/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

beforeEach(() => {
  mockEnv.TURNSTILE_SECRET_KEY = undefined;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("verifyTurnstile", () => {
  it("rejects when the token is null/undefined/empty", async () => {
    for (const t of [null, undefined, ""]) {
      const r = await verifyTurnstile(t);
      expect(r.success).toBe(false);
      expect(r.errorCodes).toContain("missing-input-response");
    }
  });

  it("returns success=true when TURNSTILE_SECRET_KEY is unset (fail-open in dev/CI)", async () => {
    const r = await verifyTurnstile("any-token");
    expect(r.success).toBe(true);
  });

  it("returns success=true when Cloudflare reports success", async () => {
    mockEnv.TURNSTILE_SECRET_KEY = "0xAAAA";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ success: true })));

    const r = await verifyTurnstile("good-token", "203.0.113.1");
    expect(r.success).toBe(true);

    // Body should include secret + response + remoteip — verify we posted it.
    const body = fetchSpy.mock.calls[0]?.[1]?.body as string;
    expect(body).toContain("secret=0xAAAA");
    expect(body).toContain("response=good-token");
    expect(body).toContain("remoteip=203.0.113.1");
  });

  it("returns success=false with error-codes when Cloudflare rejects", async () => {
    mockEnv.TURNSTILE_SECRET_KEY = "0xAAAA";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: false, "error-codes": ["invalid-input-response"] })),
    );

    const r = await verifyTurnstile("bad-token");
    expect(r.success).toBe(false);
    expect(r.errorCodes).toEqual(["invalid-input-response"]);
  });

  it("fails closed on fetch errors", async () => {
    mockEnv.TURNSTILE_SECRET_KEY = "0xAAAA";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    const r = await verifyTurnstile("any-token");
    expect(r.success).toBe(false);
    expect(r.errorCodes).toContain("internal-error");
  });
});
