// Boot-time env validator wired into `pnpm dev` (turbo `dev` task).
//
// Resolves the repo root from this file's location (packages/config/src),
// loads .env from there via dotenv, imports the public entry (which
// triggers parseEnv()), and prints a confirmation line. Any validation
// error bubbles up as a non-zero exit, failing the dev pipeline loudly.

import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

import { EnvValidationError } from "./env.js";

const here = path.dirname(fileURLToPath(import.meta.url));
// packages/config/src → repo root
const repoRoot = path.resolve(here, "..", "..", "..");
dotenv.config({ path: path.join(repoRoot, ".env") });

async function main(): Promise<void> {
  try {
    const mod = await import("./index.js");
    // eslint-disable-next-line no-console
    console.log(`✓ environment validated (env=${mod.currentEnv})`);
  } catch (err) {
    if (err instanceof EnvValidationError) {
      // eslint-disable-next-line no-console
      console.error(`✗ ${err.message}`);
    } else {
      // eslint-disable-next-line no-console
      console.error("✗ unexpected error during env validation:", err);
    }
    process.exit(1);
  }
}

void main();
