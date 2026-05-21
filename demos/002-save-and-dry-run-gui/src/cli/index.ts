// Real CLI entry. Bundled into WinNetPro-CLI-demo-001.exe via Node SEA.
// All behavior lives in `run.ts` so tests can call the same surface in-process.
// No top-level await — the SEA bundle is CJS and esbuild rejects TLA there.

import { run } from './run.js';

run(process.argv.slice(2), {
  stdin: process.stdin,
  stdout: process.stdout,
  stderr: process.stderr,
  cwd: () => process.cwd(),
}).then(
  (code) => process.exit(code),
  (err) => {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`internal error: ${msg}\n`);
    process.exit(1);
  },
);
