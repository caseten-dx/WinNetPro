#!/usr/bin/env node
// Build a WinNetPro demo CLI as a single Windows .exe via Node SEA.
//
// Usage:   node scripts/build-cli-sea.mjs <NNN> <slug>
// Example: node scripts/build-cli-sea.mjs 001 save-and-dry-run-cli
//
// This script is intentionally shared across all demos (ADR-0007). It is
// currently a defensive stub: it validates args + entry file, prints the
// intended Node SEA pipeline, and exits non-zero. The full pipeline lands
// when the first demo's vertical slice is complete and there is real CLI
// code to bundle.

import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
const exeName = `WinNetPro-CLI-demo-${nnn}.exe`;

if (!existsSync(demoDir)) {
  console.error(`[build-cli-sea] Demo dir not found: ${demoDir}`);
  process.exit(1);
}

if (!existsSync(entry)) {
  console.error(`[build-cli-sea] CLI entry not found: ${entry}`);
  console.error('Implement src/cli/index.ts before building the .exe.');
  process.exit(1);
}

console.error(`[build-cli-sea] Node SEA pipeline not yet implemented.`);
console.error(`  demo:   ${nnn}-${slug}`);
console.error(`  entry:  ${entry}`);
console.error(`  output: ${resolve(distDir, exeName)}`);
console.error('');
console.error('Intended pipeline (lands with demo-001 implementation):');
console.error('  1. esbuild bundle src/cli/index.ts -> dist/cli.cjs (CJS, platform=node, target=node20).');
console.error('  2. node --experimental-sea-config sea-config.json -> dist/cli.blob.');
console.error('  3. Copy node.exe to dist/<exeName>.');
console.error('  4. npx postject dist/<exeName> NODE_SEA_BLOB dist/cli.blob \\');
console.error('       --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2.');
console.error('  5. (Manual, post-demo) signtool sign /a dist/<exeName>.');
console.error('');
console.error('Target build time: under 30 seconds on a warm cache (CLAUDE.md).');
process.exit(1);
