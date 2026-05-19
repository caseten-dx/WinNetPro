#!/usr/bin/env node
// Build a WinNetPro demo GUI as a single Windows .exe via electron-builder.
//
// Usage:   node scripts/build-gui-electron.mjs <NNN> <slug>
// Example: node scripts/build-gui-electron.mjs 002 multi-adapter-rollback
//
// Shared across demos (ADR-0007). Defensive stub for now; the real pipeline
// (electron + electron-builder, portable target, unsigned) lands when the
// first GUI-bearing demo is implemented. Demo-001 is CLI-only.

import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [nnn, slug] = process.argv.slice(2);
if (!nnn || !slug) {
  console.error('Usage: node scripts/build-gui-electron.mjs <NNN> <slug>');
  process.exit(2);
}

if (!/^\d{3}$/.test(nnn)) {
  console.error(`[build-gui-electron] NNN must be a zero-padded 3-digit number, got: "${nnn}"`);
  process.exit(2);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const demoDir = resolve(repoRoot, `demos/${nnn}-${slug}`);
const guiEntry = resolve(demoDir, 'src/gui/main.ts');
const distDir = resolve(demoDir, 'dist');
const exeName = `WinNetPro-GUI-demo-${nnn}.exe`;

if (!existsSync(demoDir)) {
  console.error(`[build-gui-electron] Demo dir not found: ${demoDir}`);
  process.exit(1);
}

if (!existsSync(guiEntry)) {
  console.error(`[build-gui-electron] GUI entry not found: ${guiEntry}`);
  console.error('Demo-001 is CLI-only; GUI scaffolding starts in demo-002 (or wherever GUI work begins).');
  process.exit(1);
}

console.error(`[build-gui-electron] electron-builder pipeline not yet implemented.`);
console.error(`  demo:   ${nnn}-${slug}`);
console.error(`  entry:  ${guiEntry}`);
console.error(`  output: ${resolve(distDir, exeName)}`);
console.error('');
console.error('Intended pipeline:');
console.error('  1. tsc/esbuild compile src/gui/** -> dist/gui/.');
console.error('  2. electron-builder --win portable, unsigned, single-file output.');
console.error('  3. Rename to <exeName>.');
console.error('');
console.error('Not assumed live-buildable in a demo (CLAUDE.md): pre-build before the session.');
process.exit(1);
