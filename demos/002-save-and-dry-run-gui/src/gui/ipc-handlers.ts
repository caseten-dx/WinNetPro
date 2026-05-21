// Pure IPC handler factory — builds the in-process surface that main.ts wires
// into ipcMain.handle. Implements the same WindowApi contract the preload
// exposes to the renderer, so the bridge is end-to-end typed.
//
// No Electron imports here on purpose. main.ts is the only file that touches
// `electron`; this factory takes plain dependencies and is unit-testable
// without spinning up the runtime.

import { saveProfile } from '../application/save-profile.js';
import { buildDryRunPlan } from '../application/build-dry-run-plan.js';
import { validateProfileSaveInput } from '../domain/validation.js';
import type {
  Clock,
  NetworkProvider,
  ProfileRepository,
} from '../application/ports.js';

import type { WindowApi } from './api-types.js';

export interface IpcDeps {
  provider: NetworkProvider;
  repository: ProfileRepository;
  clock: Clock;
}

export function createIpcHandlers(deps: IpcDeps): WindowApi {
  return {
    listAdapters: () => deps.provider.listAdapters(),
    loadAllProfiles: () => deps.repository.loadAll(),
    validateProfileSaveInput: async (input) => validateProfileSaveInput(input),
    saveProfile: (input) => saveProfile(input, deps),
    buildDryRunPlan: (input) => buildDryRunPlan(input, deps),
  };
}
