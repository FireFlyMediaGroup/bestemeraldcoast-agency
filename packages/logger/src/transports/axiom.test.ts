import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildAxiomStream } from "./axiom.js";

describe("buildAxiomStream", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("posts each line to the dataset ingest URL with bearer auth", () => {
    const stream = buildAxiomStream({ token: "axm_secret", dataset: "bec-logs" });
    stream.write('{"msg":"hi"}\n');
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.axiom.co/v1/datasets/bec-logs/ingest",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer axm_secret",
          "Content-Type": "application/x-ndjson",
        }),
        body: '{"msg":"hi"}\n',
      }),
    );
  });

  it("URL-encodes the dataset name", () => {
    const stream = buildAxiomStream({ token: "t", dataset: "my logs/v1" });
    stream.write("{}\n");
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("my%20logs%2Fv1");
  });

  it("honors a custom endpoint", () => {
    const stream = buildAxiomStream({
      token: "t",
      dataset: "ds",
      endpoint: "https://api.eu.axiom.co",
    });
    stream.write("{}\n");
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url.startsWith("https://api.eu.axiom.co/")).toBe(true);
  });

  it("swallows fetch failures (logs to stderr but does not throw)", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("network down"));
    const stderrSpy = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    const stream = buildAxiomStream({ token: "t", dataset: "ds" });
    expect(() => stream.write("{}\n")).not.toThrow();
    // Give the rejected promise a tick to flow through .catch().
    await new Promise((resolve) => setImmediate(resolve));
    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining("[bec-logger] axiom ingest failed"),
    );
    stderrSpy.mockRestore();
  });
});
