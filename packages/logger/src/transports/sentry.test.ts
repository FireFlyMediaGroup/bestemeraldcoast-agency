import { beforeEach, describe, expect, it, vi } from "vitest";

import * as Sentry from "@sentry/node";

import { buildSentryStream } from "./sentry.js";

vi.mock("@sentry/node", () => ({
  init: vi.fn(),
  captureMessage: vi.fn(),
  captureException: vi.fn(),
  flush: vi.fn().mockResolvedValue(true),
}));

function line(obj: Record<string, unknown>): string {
  return JSON.stringify(obj) + "\n";
}

describe("buildSentryStream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes Sentry once with the provided dsn + environment", () => {
    buildSentryStream({ dsn: "https://abc@o0.ingest.sentry.io/0", environment: "test" });
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://abc@o0.ingest.sentry.io/0",
        environment: "test",
      }),
    );
  });

  it("captures a warn-level message via captureMessage", () => {
    const stream = buildSentryStream({
      dsn: "https://abc@o0.ingest.sentry.io/0",
      environment: "test",
    });
    stream.write(line({ level: "warn", msg: "something looks off", traceId: "t-1" }));
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "something looks off",
      expect.objectContaining({ level: "warning", extra: { traceId: "t-1" } }),
    );
  });

  it("captures an error-level message with err object via captureException", () => {
    const stream = buildSentryStream({
      dsn: "https://abc@o0.ingest.sentry.io/0",
      environment: "test",
    });
    stream.write(
      line({
        level: "error",
        msg: "boom",
        err: { message: "wrapped failure", type: "DbError", stack: "stack-frame" },
        traceId: "t-2",
      }),
    );
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const capturedError = (Sentry.captureException as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(capturedError.message).toBe("wrapped failure");
    expect(capturedError.name).toBe("DbError");
  });

  it("drops lines below the warn threshold even if upstream sends them", () => {
    const stream = buildSentryStream({
      dsn: "https://abc@o0.ingest.sentry.io/0",
      environment: "test",
    });
    stream.write(line({ level: "info", msg: "noisy" }));
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("never throws on malformed input", () => {
    const stream = buildSentryStream({
      dsn: "https://abc@o0.ingest.sentry.io/0",
      environment: "test",
    });
    expect(() => stream.write("not valid json\n")).not.toThrow();
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it("maps each pino numeric level to the right sentry severity", () => {
    const stream = buildSentryStream({
      dsn: "https://abc@o0.ingest.sentry.io/0",
      environment: "test",
    });
    stream.write(line({ level: 40, msg: "w" }));
    stream.write(line({ level: 50, msg: "e" }));
    stream.write(line({ level: 60, msg: "f" }));
    const calls = (Sentry.captureMessage as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.map((c) => c[1].level)).toEqual(["warning", "error", "fatal"]);
  });
});
