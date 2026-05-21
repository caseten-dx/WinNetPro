// BuildDryRunPlan use case — see ADR-0004 and safety-spec.md "Apply pipeline".
//
// Resolves a profile + target adapter into a complete ChangePlan. No provider
// mutation. The CLI prints the plan as JSON; this *is* the dry-run output.

import type { ChangePlan, Profile, ValidationResult } from '../domain/types.js';
import { matchProfileToAdapter } from '../domain/matching.js';
import type { Clock, NetworkProvider, ProfileRepository } from './ports.js';

export interface BuildDryRunInput {
  profileName: string;
  adapterId?: string;
}

export interface BuildDryRunDeps {
  provider: NetworkProvider;
  repository: ProfileRepository;
  clock: Clock;
}

export interface DryRunFailure {
  ok: false;
  errors: string[];
  reasonKind:
    | 'unknown-profile'
    | 'no-match'
    | 'ambiguous-match'
    | 'validation-failed';
}

export type DryRunResult = { ok: true; value: ChangePlan } | DryRunFailure;

export async function buildDryRunPlan(
  input: BuildDryRunInput,
  deps: BuildDryRunDeps,
): Promise<DryRunResult> {
  const profile = await deps.repository.findByName(input.profileName);
  if (profile === null) {
    return {
      ok: false,
      errors: [`no profile named "${input.profileName}"`],
      reasonKind: 'unknown-profile',
    };
  }

  const adapters = await deps.provider.listAdapters();
  const matchOptions =
    input.adapterId !== undefined ? { restrictToAdapterId: input.adapterId } : {};
  const match = matchProfileToAdapter(profile, adapters, matchOptions);

  if (match.kind === 'ambiguous') {
    return {
      ok: false,
      errors: [
        `ambiguous adapter match for profile "${profile.name}" — ${match.candidates.length} adapters match on ${match.criterion}`,
      ],
      reasonKind: 'ambiguous-match',
    };
  }
  if (match.kind === 'no-match') {
    return { ok: false, errors: [match.reason], reasonKind: 'no-match' };
  }

  const adapter = match.adapter;
  const plan: ChangePlan = {
    kind: 'ChangePlan',
    createdAt: deps.clock.now().toISOString(),
    sourceProfileId: profile.id,
    targetAdapterId: adapter.id,
    match: { confidence: match.confidence, criteria: match.criteria },
    ipv4: {
      from: {
        mode: adapter.ipv4.mode,
        address: adapter.ipv4.address,
        prefixLength: adapter.ipv4.prefixLength,
        gateway: adapter.ipv4.gateway,
      },
      to: {
        mode: profile.ipv4.mode,
        address: profile.ipv4.address,
        prefixLength: profile.ipv4.prefixLength,
        gateway: profile.ipv4.gateway,
      },
      willChange: !ipv4Equal(adapter.ipv4, profile.ipv4),
    },
    dns: {
      from: adapter.ipv4.dns.servers.slice(),
      to: adapter.ipv4.dns.servers.slice(),
      willChange: false,
      reason: 'profile DNS mode is inherit',
    },
    ipv6: { willChange: false, reason: 'v1 does not mutate IPv6' },
    rollback: {
      snapshotWillBeCreated: profile.rollback.enabled,
      snapshotPath: snapshotPathFor(adapter.id, deps.clock.now()),
    },
  };

  return { ok: true, value: plan };
}

function ipv4Equal(
  a: { mode: string; address: string | null; prefixLength: number | null; gateway: string | null },
  b: { mode: string; address: string | null; prefixLength: number | null; gateway: string | null },
): boolean {
  return (
    a.mode === b.mode &&
    a.address === b.address &&
    a.prefixLength === b.prefixLength &&
    a.gateway === b.gateway
  );
}

function snapshotPathFor(adapterId: string, when: Date): string {
  const iso = when.toISOString().replace(/[:.]/g, '-').replace('Z', 'Z');
  return `./snapshots/${adapterId}-${iso}.json`;
}
