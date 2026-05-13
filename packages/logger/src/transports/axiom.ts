// Axiom transport (ADR-012).
//
// Fire-and-forget POSTs to Axiom's NDJSON ingest endpoint. We use a custom
// transport rather than `@axiomhq/pino` because the official package routes
// through pino's worker-thread transport API, which conflicts with our sync
// `pino.multistream()` approach (see also: ./pretty.ts comment). Trade-off
// accepted: no built-in batching; per-line POSTs. Volume is server logs at
// BEC scale (small) so this is fine; revisit if log volume climbs.

import type { DestinationStream } from "pino";

export interface AxiomStreamOptions {
  token: string;
  dataset: string;
  endpoint?: string;
}

const DEFAULT_ENDPOINT = "https://api.axiom.co";

export function buildAxiomStream(opts: AxiomStreamOptions): DestinationStream {
  const endpoint = opts.endpoint ?? DEFAULT_ENDPOINT;
  const url = `${endpoint}/v1/datasets/${encodeURIComponent(opts.dataset)}/ingest`;

  return {
    write(chunk: string): void {
      // Pino already provides a trailing newline; Axiom expects NDJSON.
      void fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.token}`,
          "Content-Type": "application/x-ndjson",
        },
        body: chunk,
      }).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        process.stderr.write(`[bec-logger] axiom ingest failed: ${msg}\n`);
      });
    },
  };
}
