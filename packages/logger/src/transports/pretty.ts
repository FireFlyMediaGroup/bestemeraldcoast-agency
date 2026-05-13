// Pretty-print transport for local development.
//
// Pino's worker-thread transport model can't resolve `./*.ts` paths in tsx,
// so we use sync streams via `pino.multistream()` everywhere. `pino-pretty`
// has a programmatic factory that returns a Transform stream we can drop in.

import PinoPretty from "pino-pretty";
import type { DestinationStream } from "pino";

export function buildPrettyStream(): DestinationStream {
  return PinoPretty({
    colorize: true,
    translateTime: "HH:MM:ss.l",
    ignore: "pid,hostname",
    singleLine: false,
  });
}
