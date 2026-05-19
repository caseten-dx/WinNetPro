#!/usr/bin/env node
// Build a WinNetPro demo CLI as a single .exe via Node SEA.
//
// Usage:   node scripts/build-cli-sea.mjs <NNN> <slug>
// Example: node scripts/build-cli-sea.mjs 001 save-and-dry-run-cli
//
// Pipeline:
//   1. esbuild bundles src/cli/index.ts into a CJS bundle.
//   2. node --experimental-sea-config generates the SEA blob.
//   3. Copy the host's node binary to dist/<exeName>.
//   4. postject injects the blob into the binary.
//   5. macOS: strip the existing signature before injection, re-sign after.
//
// Target platform is the host that runs this script:
//   - GH Actions windows-latest produces the shippable WinNetPro-CLI-demo-NNN.exe
//   - macOS host produces a Mac binary for local sanity-checking
//
// Build target: under 30 seconds on a warm cache (CLAUDE.md).

import { existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const [nnn, slug] = process.argv.slice(2);
if (!nnn || !slug) {
  console.error('Usage: node scripts/build-cli-sea.mjs <NNN> <slug>');
  process.exit(2);
}

if (!/^\d{3}$/.test(nnn)) {
  console.error(`[build-cli-sea] NNN must be a zero-padded 3-digit number, got: "${nnn}"`);
  process.exit(2);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const demoDir = resolve(repoRoot, `demos/${nnn}-${slug}`);
const entry = resolve(demoDir, 'src/cli/index.ts');
const distDir = resolve(demoDir, 'dist');
const isWindows = process.platform === 'win32';
const isDarwin = process.platform === 'darwin';
const exeName = isWindows
  ? `WinNetPro-CLI-demo-${nnn}.exe`
  : `WinNetPro-CLI-demo-${nnn}`;
const exePath = resolve(distDir, exeName);
const bundlePath = resolve(distDir, 'cli.cjs');
const blobPath = resolve(distDir, 'cli.blob');
const seaConfigPath = resolve(distDir, 'sea-config.json');

if (!existsSync(demoDir)) {
  console.error(`[build-cli-sea] Demo dir not found: ${demoDir}`);
  process.exit(1);
}

if (!existsSync(entry)) {
  console.error(`[build-cli-sea] CLI entry not found: ${entry}`);
  console.error('Implement src/cli/index.ts before building the .exe.');
  process.exit(1);
}

const demoRequire = createRequire(resolve(demoDir, 'package.json'));

let esbuild;
let postject;
try {
  esbuild = demoRequire('esbuild');
  postject = demoRequire('postject');
} catch (err) {
  console.error('[build-cli-sea] missing build dependency:', err.message);
  console.error('Run `pnpm install` at the repo root first.');
  process.exit(1);
}

mkdirSync(distDir, { recursive: true });

const t0 = Date.now();

console.error(`[build-cli-sea] esbuild ${entry} -> ${bundlePath}`);
await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'cjs',
  outfile: bundlePath,
  legalComments: 'none',
  logLevel: 'warning',
});

writeFileSync(
  seaConfigPath,
  JSON.stringify(
    {
      main: bundlePath,
      output: blobPath,
      disableExperimentalSEAWarning: true,
      useSnapshot: false,
      useCodeCache: true,
    },
    null,
    2,
  ),
);

console.error('[build-cli-sea] generating SEA blob');
const blobRes = spawnSync(
  process.execPath,
  ['--experimental-sea-config', seaConfigPath],
  { stdio: 'inherit', cwd: demoDir },
);
if (blobRes.status !== 0) {
  console.error('[build-cli-sea] SEA blob generation failed');
  process.exit(blobRes.status ?? 1);
}

console.error(`[build-cli-sea] copying ${process.execPath} -> ${exePath}`);
copyFileSync(process.execPath, exePath);

// macOS signs its node binary by default; postject can't inject into a signed
// Mach-O. Strip the signature first, re-sign after injection so the binary
// runs locally.
if (isDarwin) {
  const r = spawnSync('codesign', ['--remove-signature', exePath], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error('[build-cli-sea] codesign --remove-signature failed');
    process.exit(r.status ?? 1);
  }
}

console.error('[build-cli-sea] postject inject NODE_SEA_BLOB');
const blob = readFileSync(blobPath);
const injectOpts = {
  sentinelFuse: 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
};
if (isDarwin) {
  injectOpts.machoSegmentName = 'NODE_SEA';
}
await postject.inject(exePath, 'NODE_SEA_BLOB', blob, injectOpts);

if (isDarwin) {
  const r = spawnSync('codesign', ['--sign', '-', exePath], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error('[build-cli-sea] codesign --sign failed');
    process.exit(r.status ?? 1);
  }
}

const dt = Date.now() - t0;
console.error(`[build-cli-sea] ${exePath} (built in ${(dt / 1000).toFixed(1)}s)`);
