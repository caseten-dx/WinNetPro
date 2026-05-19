import { describe, it } from 'node:test';
import { strictEqual } from 'node:assert/strict';

import { buildDryRunPlan } from '../../src/application/build-dry-run-plan.js';
import { fixedClock } from '../../src/infrastructure/system-clock.js';
import type { Adapter, Profile } from '../../src/domain/types.js';
import type { NetworkProvider, ProfileRepository } from '../../src/application/ports.js';

function memProvider(adapters: Adapter[]): NetworkProvider {
  return { kind: 'fake', listAdapters: async () => adapters };
}

function memRepo(profiles: Profile[]): ProfileRepository {
  return {
    async loadAll() {
      return profiles.slice();
    },
    async findByName(name) {
      return profiles.find((p) => p.name === name) ?? null;
    },
    async save() {
      /* not used here */
    },
  };
}

const dockProfile: Profile = {
  id: 'profile-dock-132',
  name: 'DOCK 132',
  createdAt: '2026-05-19T12:00:00.000Z',
  updatedAt: '2026-05-19T12:00:00.000Z',
  preferredAdapter: {
    macAddress: '00-11-22-33-44-55',
    interfaceGuid: '{a1b2c3d4-...-345678}',
  },
  ipv4: {
    mode: 'static',
    address: '192.168.132.10',
    prefixLength: 24,
    gateway: null,
    dns: { mode: 'inherit', servers: [] },
  },
  ipv6: { mode: 'inherit' },
  rollback: { enabled: true },
};

function dhcpAdapter(): Adapter {
  return {
    id: 'ad-02',
    interfaceGuid: '{a1b2c3d4-1234-5678-9abc-def012345678}',
    windowsAlias: 'Ethernet 5',
    description: 'USB 10/100/1000 LAN',
    macAddress: '00-11-22-33-44-55',
    appAlias: 'Dock Radio',
    linkState: 'up',
    ipv4: {
      mode: 'dhcp',
      address: '192.168.1.42',
      prefixLength: 24,
      gateway: '192.168.1.1',
      dns: { servers: ['192.168.1.1'] },
    },
    ipv6: { mode: 'auto', addresses: [], gateway: null, dns: { servers: [] } },
    lastAppliedProfileId: null,
  };
}

describe('buildDryRunPlan', () => {
  it('emits a complete ChangePlan with DHCP->static delta and willChange=true', async () => {
    const r = await buildDryRunPlan(
      { profileName: 'DOCK 132', adapterId: 'ad-02' },
      {
        provider: memProvider([dhcpAdapter()]),
        repository: memRepo([dockProfile]),
        clock: fixedClock('2026-05-19T12:00:00.000Z'),
      },
    );
    strictEqual(r.ok, true);
    if (r.ok) {
      strictEqual(r.value.kind, 'ChangePlan');
      strictEqual(r.value.sourceProfileId, 'profile-dock-132');
      strictEqual(r.value.targetAdapterId, 'ad-02');
      strictEqual(r.value.match.confidence, 'mac');
      strictEqual(r.value.ipv4.from.mode, 'dhcp');
      strictEqual(r.value.ipv4.to.mode, 'static');
      strictEqual(r.value.ipv4.to.address, '192.168.132.10');
      strictEqual(r.value.ipv4.to.prefixLength, 24);
      strictEqual(r.value.ipv4.willChange, true);
      strictEqual(r.value.dns.willChange, false);
      strictEqual(r.value.ipv6.willChange, false);
      strictEqual(r.value.rollback.snapshotWillBeCreated, true);
    }
  });

  it('returns unknown-profile when the profile does not exist', async () => {
    const r = await buildDryRunPlan(
      { profileName: 'DOES NOT EXIST', adapterId: 'ad-02' },
      {
        provider: memProvider([dhcpAdapter()]),
        repository: memRepo([]),
        clock: fixedClock('2026-05-19T12:00:00.000Z'),
      },
    );
    strictEqual(r.ok, false);
    if (!r.ok) strictEqual(r.reasonKind, 'unknown-profile');
  });

  it('returns ambiguous-match when two adapters share the same MAC', async () => {
    const twin: Adapter = { ...dhcpAdapter(), id: 'ad-02b' };
    const r = await buildDryRunPlan(
      { profileName: 'DOCK 132' },
      {
        provider: memProvider([dhcpAdapter(), twin]),
        repository: memRepo([dockProfile]),
        clock: fixedClock('2026-05-19T12:00:00.000Z'),
      },
    );
    strictEqual(r.ok, false);
    if (!r.ok) strictEqual(r.reasonKind, 'ambiguous-match');
  });
});
