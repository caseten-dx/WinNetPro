#!/usr/bin/env node
// Bundle a demo's GUI sources (main + preload + renderer) into dist/gui/ so
// `electron dist/gui/main.cjs` can launch the app during development.
//
// Usage:   node scripts/build-gui-dev.mjs <NNN> <slug>
// Example: node scripts/build-gui-dev.mjs 002 save-and-dry-run-gui
//
// Shared across demos (ADR-0007). Phase G replaces this with the packaged
// .exe pipeline (`scripts/build-gui-electron.mjs` + `electron-builder`); this
// dev bundler is what Phase D ships so an Electron window can launch over
// the in-process application services.
//
// Bundle layout under demos/<NNN>-<slug>/dist/gui/:
//   main.cjs                   — Electron main process (Node target, CJS)
//   preload.cjs                — contextBridge preload (Node target, CJS)
//   renderer/index.html        — copied verbatim from src/gui/renderer/
//   renderer/index.js          — bundled renderer (browser target, IIFE)

import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const [nnn, slug] = process.argv.slice(2);
if (!nnn || !slug) {
  console.error('Usage: node scripts/build-gui-dev.mjs <NNN> <slug>');
  process.exit(2);
}

if (!/^\d{3}$/.test(nnn)) {
  console.error(`[build-gui-dev] NNN must be a zero-padded 3-digit number, got: "${nnn}"`);
  process.exit(2);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const demoDir = resolve(repoRoot, `demos/${nnn}-${slug}`);
const guiDir = resolve(demoDir, 'src/gui');
const distGui = resolve(demoDir, 'dist/gui');
const distRenderer = resolve(distGui, 'renderer');

if (!existsSync(demoDir)) {
  console.error(`[build-gui-dev] Demo dir not found: ${demoDir}`);
  process.exit(1);
}

if (!existsSync(guiDir)) {
  console.error(`[build-gui-dev] GUI dir not found: ${guiDir}`);
  console.error('Phase D scaffolding lays this out at demos/<NNN>-<slug>/src/gui/.');
  process.exit(1);
}

const demoRequire = createRequire(resolve(demoDir, 'package.json'));

let esbuild;
try {
  esbuild = demoRequire('esbuild');
} catch (err) {
  console.error('[build-gui-dev] missing esbuild:', err.message);
  console.error('Run `pnpm install` at the repo root first.');
  process.exit(1);
}

mkdirSync(distGui, { recursive: true });
mkdirSync(distRenderer, { recursive: true });

const t0 = Date.now();

// main + preload: Node target, CJS, electron external (provided by the runtime).
// Target node20 is a safe floor — Electron 32+ embeds Node 20.x or newer.
await esbuild.build({
  entryPoints: [
    resolve(guiDir, 'main.ts'),
    resolve(guiDir, 'preload.ts'),
  ],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  external: ['electron'],
  outdir: distGui,
  outExtension: { '.js': '.cjs' },
  legalComments: 'none',
  logLevel: 'warning',
});

// renderer: browser target, IIFE so the <script> tag works without modules.
// jsx: 'automatic' uses the react/jsx-runtime path (no React import needed in
// .tsx files). loader maps both .ts and .tsx so renderer/index.tsx + its
// component tree bundle in one pass.
await esbuild.build({
  entryPoints: [resolve(guiDir, 'renderer/index.tsx')],
  bundle: true,
  platform: 'browser',
  target: 'es2022',
  format: 'iife',
  jsx: 'automatic',
  jsxDev: false,
  loader: { '.ts': 'ts', '.tsx': 'tsx' },
  outfile: resolve(distRenderer, 'index.js'),
  legalComments: 'none',
  logLevel: 'warning',
});

// Copy renderer assets (HTML + CSS) verbatim. Phase E1 ships tokens.css from
// the design hand-off as the renderer's single stylesheet; later phases may
// add more .css files alongside it (or pivot to esbuild's CSS bundler — we
// avoid that for now to keep the renderer's CSP simple).
for (const entry of readdirSync(resolve(guiDir, 'renderer'))) {
  const ext = extname(entry).toLowerCase();
  if (ext === '.html' || ext === '.css') {
    copyFileSync(
      resolve(guiDir, 'renderer', entry),
      resolve(distRenderer, entry),
    );
  }
}

const dt = Date.now() - t0;
console.error(`[build-gui-dev] dist/gui/ ready (built in ${(dt / 1000).toFixed(1)}s)`);
