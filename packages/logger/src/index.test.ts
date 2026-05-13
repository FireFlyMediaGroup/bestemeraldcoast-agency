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
