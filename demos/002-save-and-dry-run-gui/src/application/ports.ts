// Application layer depends only on these interfaces, never on concrete
// adapters (architecture doc, "Layer rules" -> Application).

import type { Adapter, Profile } from '../domain/types.js';

export interface NetworkProvider {
  readonly kind: 'fake' | 'powershell';
  listAdapters(): Promise<Adapter[]>;
  // Demo-003 adds applyChangePlan + verify; demo-001 and demo-002 are
  // read-only on the provider, so the surface stays minimal.
}

export interface ProfileRepository {
  loadAll(): Promise<Profile[]>;
  findByName(name: string): Promise<Profile | null>;
  save(profile: Profile): Promise<void>;
}

export interface Clock {
  now(): Date;
}
