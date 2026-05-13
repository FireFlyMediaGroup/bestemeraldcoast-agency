import { PassThrough } from "node:stream";

import pino from "pino";
import { describe, expect, it } from "vitest";

import { createLogger } from "./index.js";

describe("createLogger", () => {
  it("exposes the standard pino level methods", () => {
    const log = createLogger({ service: "test" });
    for (const level of ["trace", "debug", "info", "warn", "error", "fatal"] as const) {
      expect(typeof log[level]).toBe("function");
    }
  });

  it("merges caller context into the base", () => {
    const log = createLogger({ service: "scout", traceId: "t-1" });
    expect((log.bindings() as { service?: string; traceId?: string }).service).toBe("scout");
    expect((log.bindings() as { service?: string; traceId?: string }).traceId).toBe("t-1");
  });

  it("supports child loggers with extra context", () => {
    const log = createLogger({ service: "scout" });
    const child = log.child({ runId: "r-1" });
    const bindings = child.bindings() as Record<string, unknown>;
    expect(bindings.service).toBe("scout");
    expect(bindings.runId).toBe("r-1");
  });
});

// Standalone smoke test for the redact paths we configure in baseOptions().
// `createLogger()` wires pino.multistream over many destinations, so to assert
// what gets serialized we build a minimal pino with the same redact config
// and write to a buffer we can read back.
describe("redact paths", () => {
  function captureLog(payload: Record<string, unknown>): Record<string, unknown> {
    const buf = new PassThrough();
    const chunks: Buffer[] = [];
    buf.on("data", (c: Buffer) => chunks.push(c));

    const log = pino(
      {
        redact: {
          paths: [
            "password",
            "*.password",
            "apiKey",
            "*.apiKey",
            "api_key",
            "*.api_key",
            "authorization",
            "*.authorization",
            "token",
            "*.token",
            "secret",
            "*.secret",
            "cookie",
            "*.cookie",
            '["set-cookie"]',
            '*["set-cookie"]',
          ],
          remove: true,
        },
      },
      buf,
    );

    log.info(payload, "hi");
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
  }

  it("removes hyphenated set-cookie at the top level", () => {
    const out = captureLog({ "set-cookie": "session=abc", keep: "yes" });
    expect(out["set-cookie"]).toBeUndefined();
    expect(out.keep).toBe("yes");
  });

  it("removes nested set-cookie under any parent", () => {
    const out = captureLog({ headers: { "set-cookie": "session=abc", host: "x" } });
    const headers = out.headers as Record<string, unknown>;
    expect(headers["set-cookie"]).toBeUndefined();
    expect(headers.host).toBe("x");
  });

  it("removes other common secret fields", () => {
    const out = captureLog({
      password: "pw",
      apiKey: "ak",
      authorization: "Bearer x",
      token: "tk",
      secret: "s",
      cookie: "c",
      keep: "yes",
    });
    expect(out.password).toBeUndefined();
    expect(out.apiKey).toBeUndefined();
    expect(out.authorization).toBeUndefined();
    expect(out.token).toBeUndefined();
    expect(out.secret).toBeUndefined();
    expect(out.cookie).toBeUndefined();
    expect(out.keep).toBe("yes");
  });
});
