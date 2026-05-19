// Adapter matching algorithm — see ADR-0006.
//
// Priority order (first non-empty criterion that yields a unique adapter wins):
//   1. interfaceGuid -> confidence "exact"
//   2. macAddress    -> confidence "mac"
//   3. description   -> confidence "description"
//   4. alias         -> confidence "alias"
//   5. (no preferredAdapter, with explicit adapter selection) -> "global"
//
// If a criterion is present in the profile but matches multiple adapters, the
// result is "ambiguous" — refused by the apply pipeline (safety invariant 4).
// If no criterion matches, returns no-match.
//
// Pure function. No I/O.

import type { Adapter, MatchConfidence, MatchResult, Profile } from './types.js';

interface Step {
  criterion: 'interfaceGuid' | 'macAddress' | 'description' | 'alias';
  confidence: MatchConfidence;
  value: string | undefined;
  matches: (adapter: Adapter, value: string) => boolean;
}

export function matchProfileToAdapter(
  profile: Profile,
  adapters: Adapter[],
  options?: { restrictToAdapterId?: string },
): MatchResult {
  const candidates = options?.restrictToAdapterId
    ? adapters.filter((a) => a.id === options.restrictToAdapterId)
    : adapters;

  if (options?.restrictToAdapterId && candidates.length === 0) {
    return {
      kind: 'no-match',
      reason: `no adapter with id ${options.restrictToAdapterId}`,
    };
  }

  const pref = profile.preferredAdapter;

  // Global profile: must have an explicit adapter to apply to.
  if (!pref || Object.keys(pref).length === 0) {
    if (options?.restrictToAdapterId && candidates.length === 1) {
      return {
        kind: 'matched',
        adapter: candidates[0]!,
        confidence: 'global',
        criteria: [],
      };
    }
    return {
      kind: 'no-match',
      reason: 'profile is global; --adapter <id> is required',
    };
  }

  const steps: Step[] = [
    {
      criterion: 'interfaceGuid',
      confidence: 'exact',
      value: pref.interfaceGuid,
      matches: (a, v) => a.interfaceGuid === v,
    },
    {
      criterion: 'macAddress',
      confidence: 'mac',
      value: pref.macAddress,
      matches: (a, v) => a.macAddress === v,
    },
    {
      criterion: 'description',
      confidence: 'description',
      value: pref.interfaceDescription,
      matches: (a, v) => a.description === v,
    },
    {
      criterion: 'alias',
      confidence: 'alias',
      value: pref.windowsAliasAtSaveTime,
      matches: (a, v) => a.windowsAlias === v,
    },
  ];

  for (const step of steps) {
    if (step.value === undefined) continue;
    const hits = candidates.filter((a) => step.matches(a, step.value as string));
    if (hits.length === 0) continue;
    if (hits.length > 1) {
      return { kind: 'ambiguous', candidates: hits, criterion: step.confidence };
    }
    return {
      kind: 'matched',
      adapter: hits[0]!,
      confidence: step.confidence,
      criteria: [step.criterion],
    };
  }

  return {
    kind: 'no-match',
    reason: `profile "${profile.name}" does not match any visible adapter`,
  };
}
