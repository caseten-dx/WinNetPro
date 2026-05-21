// Preload script — runs in an isolated context between the Electron renderer
// and main. Exposes a typed `window.api` via contextBridge so the renderer
// can reach the in-process application services without nodeIntegration.
//
// The shape mirrors WindowApi in api-types.ts; TypeScript verifies that this
// preload's exposed object satisfies the contract.

import { contextBridge, ipcRenderer } from 'electron';

import type { WindowApi } from './api-types.js';

const api: WindowApi = {
  listAdapters: () => ipcRenderer.invoke('listAdapters'),
  loadAllProfiles: () => ipcRenderer.invoke('loadAllProfiles'),
  validateProfileSaveInput: (input) =>
    ipcRenderer.invoke('validateProfileSaveInput', input),
  saveProfile: (input) => ipcRenderer.invoke('saveProfile', input),
  buildDryRunPlan: (input) => ipcRenderer.invoke('buildDryRunPlan', input),
};

contextBridge.exposeInMainWorld('api', api);
