// SaveProfile use case. Builds a Profile from either an adapter snapshot
// (--from-adapter) or explicit flag values, validates it, and persists via
// the ProfileRepository port.
//
// Returns ValidationResult<Profile> — the CLI maps errors to exit code 3.

import type { Adapter, Profile, ValidationResult } from '../domain/types.js';
import { profileIdFromName } from '../domain/profile-id.js';
import {
  type ProfileSaveInput,
  validateProfileSaveInput,
} from '../domain/validation.js';
import type { Clock, NetworkProvider, ProfileRepository } from './ports.js';

export interface SaveProfileDeps {
  provider: NetworkProvider;
  repository: ProfileRepository;
  clock: Clock;
}

export async function saveProfile(
  input: ProfileSaveInput,
  deps: SaveProfileDeps,
): Promise<ValidationResult<Profile>> {
  const validation = validateProfileSaveInput(input);
  if (!validation.ok) return validation;

  let sourceAdapter: Adapter | null = null;
  if (input.fromAdapterId !== undefined) {
    const adapters = await deps.provider.listAdapters();
    sourceAdapter = adapters.find((a) => a.id === input.fromAdapterId) ?? null;
    if (sourceAdapter === null) {
      return {
        ok: false,
        errors: [`no adapter with id ${input.fromAdapterId}`],
      };
    }
  }

  const now = deps.clock.now().toISOString();
  const profile: Profile = {
    id: profileIdFromName(input.name),
    name: input.name,
    ...(input.description !== undefined ? { description: input.description } : {}),
    createdAt: now,
    updatedAt: now,
    ...buildPreferredAdapter(input, sourceAdapter),
    ipv4: buildProfileIpv4(input, sourceAdapter),
    ipv6: { mode: 'inherit' },
    rollback: { enabled: true },
  };

  await deps.repository.save(profile);
  return { ok: true, value: profile };
}

function buildPreferredAdapter(
  input: ProfileSaveInput,
  sourceAdapter: Adapter | null,
): Pick<Profile, 'preferredAdapter'> | Record<string, never> {
  if (input.global === true) return {};
  if (sourceAdapter === null) return {};
  return {
    preferredAdapter: {
      macAddress: sourceAdapter.macAddress,
      interfaceGuid: sourceAdapter.interfaceGuid,
      interfaceDescription: sourceAdapter.description,
      windowsAliasAtSaveTime: sourceAdapter.windowsAlias,
    },
  };
}

function buildProfileIpv4(
  input: ProfileSaveInput,
  sourceAdapter: Adapter | null,
): Profile['ipv4'] {
  // Explicit mode wins; otherwise inherit from adapter; otherwise default static
  // (caller should have provided enough to validate). Validator already rejected
  // static-without-address-or-prefix when --from-adapter was absent.
  const mode: 'static' | 'dhcp' =
    input.ipv4Mode ?? sourceAdapter?.ipv4.mode ?? 'static';

  if (mode === 'dhcp') {
    return {
      mode: 'dhcp',
      address: null,
      prefixLength: null,
      gateway: null,
      dns: { mode: 'inherit', servers: [] },
    };
  }

  const address = input.ipv4Address ?? sourceAdapter?.ipv4.address ?? null;
  const prefixLength = input.ipv4Prefix ?? sourceAdapter?.ipv4.prefixLength ?? null;
  const gateway = input.ipv4Gateway ?? sourceAdapter?.ipv4.gateway ?? null;

  return {
    mode: 'static',
    address,
    prefixLength,
    gateway,
    dns: { mode: 'inherit', servers: [] },
  };
}
