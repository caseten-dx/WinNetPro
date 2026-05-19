// Real CLI entry. Bundled into WinNetPro-CLI-demo-001.exe via Node SEA.
// All behavior lives in `run.ts` so tests can call the same surface in-process.

import { run } from './run.js';

const exitCode = await run(process.argv.slice(2), {
  stdin: process.stdin,
  stdout: process.stdout,
  stderr: process.stderr,
  cwd: () => process.cwd(),
});

process.exit(exitCode);
