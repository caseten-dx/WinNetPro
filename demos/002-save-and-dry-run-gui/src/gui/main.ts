// Electron main process — the GUI's composition root. Mirrors cli/run.ts's
// wiring: builds a FakeProvider + JsonProfileRepository + systemClock, then
// hands them to createIpcHandlers. The renderer reaches these via the typed
// `window.api` surface exposed in preload.ts.
//
// CLAUDE.md invariant 6: the GUI calls the same application services as the
// CLI. There is zero Windows-networking logic in this file or anywhere under
// src/gui/.
//
// Phase D scope: empty Electron window with a functional IPC bridge. The
// renderer is a throwaway placeholder; Phase E renders the six designed
// frames against tokens.css.

import { app, BrowserWindow, ipcMain } from 'electron';
import { resolve } from 'node:path';

import { FakeProvider } from '../infrastructure/fake-provider.js';
import { JsonProfileRepository } from '../infrastructure/json-profile-repository.js';
import { systemClock } from '../infrastructure/system-clock.js';

import { createIpcHandlers } from './ipc-handlers.js';
import { IPC_CHANNELS } from './api-types.js';

// esbuild's CJS output exposes __dirname at runtime; this declaration keeps
// the TypeScript compiler happy under lib: ["ES2023", "DOM"] without enabling
// the @types/node CJS globals everywhere.
declare const __dirname: string;

// CWD-relative config + fixture dirs mirror the CLI defaults (cli/run.ts).
// Phase G's packaged .exe will resolve these against a writable user-data
// path instead; for Phase D dev (`pnpm dev:gui`), launching from the demo
// directory puts fixtures/ and profiles.json in the expected places.
const configDir = resolve(process.cwd(), '.');
const fixtureDir = resolve(process.cwd(), './fixtures');

const handlers = createIpcHandlers({
  provider: new FakeProvider({ fixtureDir }),
  repository: new JsonProfileRepository(configDir),
  clock: systemClock,
});

function registerIpcHandlers(): void {
  for (const channel of IPC_CHANNELS) {
    const handler = handlers[channel] as (...a: unknown[]) => unknown;
    // createIpcHandlers statically guarantees the per-channel signature via
    // WindowApi; here we just forward the variadic args.
    ipcMain.handle(channel, (_event, ...args: unknown[]) => handler(...args));
  }
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    // Custom Win11 title bar (design hand-off README "Window chrome"). Phase E
    // draws the caption buttons + auto-apply toggle inside this frame.
    frame: false,
    titleBarStyle: 'hidden',
    show: false,
    webPreferences: {
      preload: resolve(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => win.show());
  void win.loadFile(resolve(__dirname, 'renderer', 'index.html'));
  return win;
}

void app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
