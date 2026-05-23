// Renderer-only ambient declarations. Picked up by tsconfig.renderer.json's
// include glob; no .ts/.tsx import needed.
//
// The `window.api` surface is exposed by preload.ts via contextBridge and
// implemented in main by createIpcHandlers. The shared WindowApi type keeps
// the renderer, preload, and main in lockstep — TypeScript catches drift.

import type { WindowApi } from '../api-types.js';

declare global {
  interface Window {
    api: WindowApi;
  }
}

export {};
