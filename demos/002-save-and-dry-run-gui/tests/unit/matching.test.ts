import { describe, it } from 'node:test';
import { strictEqual } from 'node:assert/strict';

import { matchProfileToAdapter } from '../../src/domain/matching.js';
import type { Adapter, Profile } from '../../src/domain/types.js';

function adapter(overrides: Partial<Adapter>): Adapter {
  return {
    id: 'ad-x',
    interfaceGuid: '{guid-x}',
    windowsAlias: 'Ethernet X',
    description: 'Generic NIC',
    macAddress: 'AA-BB-CC-00-00-00',
    appAlias: null,
    linkState: 'up',
    ipv4: {
      mode: 'dhcp',
      address: '10.0.0.1',
      prefixLength: 24,
      gateway: '10.0.0.1',
      dns: { servers: [] },
    },
    ipv6: { mode: 'auto', addresses: [], gateway: null, dns: { servers: [] } },
    lastAppliedProfileId: null,
    ...overrides,
  };
}

function profile(overrides: Partial<Profile>): Profile {
  return {
    id: 'profile-test',
    name: 'Test',
    createdAt: '2026-05-19T12:00:00.000Z',
    updatedAt: '2026-05-19T12:00:00.000Z',
    ipv4: {
      mode: 'static',
      address: '192.168.132.10',
      prefixLength: 24,
      gateway: null,
      dns: { mode: 'inherit', servers: [] },
    },
    ipv6: { mode: 'inherit' },
    rollback: { enabled: true },
    ...overrides,
  };
}

describe('matchProfileToAdapter', () => {
  it('matches on interfaceGuid with confidence "exact"', () => {
    const adapters = [
      adapter({ id: 'ad-01' }),
      adapter({ id: 'ad-02', interfaceGuid: '{target}', macAddress: 'aa-bb-cc-dd-ee-ff' }),
    ];
    const p = profile({
      preferredAdapter: { interfaceGuid: '{target}', macAddress: 'zz-zz-zz-zz-zz-zz' },
    });
    const r = matchProfileToAdapter(p, adapters);
    strictEqual(r.kind, 'matched');
    if (r.kind === 'matched') {
      strictEqual(r.confidence, 'exact');
      strictEqual(r.adapter.id, 'ad-02');
    }
  });

  it('falls back to MAC when GUID does not match (profile-apply BDD case)', () => {
    const adapters = [
      adapter({
        id: 'ad-02',
        interfaceGuid: '{a1b2c3d4-1234-5678-9abc-def012345678}',
        macAddress: '00-11-22-33-44-55',
      }),
    ];
    const p = profile({
      preferredAdapter: {
        interfaceGuid: '{a1b2c3d4-...-345678}',
        macAddress: '00-11-22-33-44-55',
      },
    });
    const r = matchProfileToAdapter(p, adapters);
    strictEqual(r.kind, 'matched');
    if (r.kind === 'matched') strictEqual(r.confidence, 'mac');
  });

  it('returns ambiguous when MAC matches two adapters', () => {
    const adapters = [
      adapter({ id: 'ad-01', macAddress: '00-11-22-33-44-55' }),
      adapter({ id: 'ad-02', macAddress: '00-11-22-33-44-55' }),
    ];
    const p = profile({ preferredAdapter: { macAddress: '00-11-22-33-44-55' } });
    const r = matchProfileToAdapter(p, adapters);
    strictEqual(r.kind, 'ambiguous');
    if (r.kind === 'ambiguous') strictEqual(r.criterion, 'mac');
  });

  it('returns no-match when criteria miss every adapter', () => {
    const adapters = [adapter({ id: 'ad-01', macAddress: 'aa-bb-cc-dd-ee-ff' })];
    const p = profile({ preferredAdapter: { macAddress: '00-11-22-33-44-55' } });
    const r = matchProfileToAdapter(p, adapters);
    strictEqual(r.kind, 'no-match');
  });

  it('global match requires an explicit adapter id', () => {
    const adapters = [adapter({ id: 'ad-01' })];
    // Global profile: preferredAdapter is omitted (not present), not set to undefined.
    const p = profile({});
    const noAdapter = matchProfileToAdapter(p, adapters);
    strictEqual(noAdapter.kind, 'no-match');

    const withAdapter = matchProfileToAdapter(p, adapters, { restrictToAdapterId: 'ad-01' });
    strictEqual(withAdapter.kind, 'matched');
    if (withAdapter.kind === 'matched') strictEqual(withAdapter.confidence, 'global');
  });
});
