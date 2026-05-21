// Shared contract for the `window.api` surface the preload exposes to the
// renderer. Both the preload (typing the exposeInMainWorld payload) and the
// renderer (typing window.api) import from here, so the IPC contract stays
// end-to-end typed without runtime duplication.
//
// The same shape is implemented in main by `ipc-handlers.ts`. If the two
// drift, TypeScript catches it at compile time.

import type { Adapter, Profile, ValidationResult } from '../domain/types.js';
import type { ProfileSaveInput } from '../domain/validation.js';
import type {
  BuildDryRunInput,
  DryRunResult,
} from '../application/build-dry-run-plan.js';

export interface WindowApi {
  listAdapters(): Promise<Adapter[]>;
  loadAllProfiles(): Promise<Profile[]>;
  validateProfileSaveInput(
    input: ProfileSaveInput,
  ): Promise<ValidationResult<ProfileSaveInput>>;
  saveProfile(input: ProfileSaveInput): Promise<ValidationResult<Profile>>;
  buildDryRunPlan(input: BuildDryRunInput): Promise<DryRunResult>;
}

// The set of IPC channels. Used by main.ts to register ipcMain.handle and by
// tests to assert the contract. Keep in lockstep with WindowApi.
export const IPC_CHANNELS = [
  'listAdapters',
  'loadAllProfiles',
  'validateProfileSaveInput',
  'saveProfile',
  'buildDryRunPlan',
] as const satisfies readonly (keyof WindowApi)[];

export type IpcChannel = (typeof IPC_CHANNELS)[number];
