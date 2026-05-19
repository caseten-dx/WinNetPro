import { describe, it } from 'node:test';
import { strictEqual } from 'node:assert/strict';

import { saveProfile } from '../../src/application/save-profile.js';
import { fixedClock } from '../../src/infrastructure/system-clock.js';
import type { Adapter, Profile } from '../../src/domain/types.js';
import type { NetworkProvider, ProfileRepository } from '../../src/application/ports.js';

function adapter(overrides: Partial<Adapter> = {}): Adapter {
  return {
    id: 'ad-02',
    interfaceGuid: '{guid-02}',
    windowsAlias: 'Ethernet 5',
    description: 'USB 10/100/1000 LAN',
    macAddress: '00-11-22-33-44-55',
    appAlias: null,
    linkState: 'up',
    ipv4: {
      mode: 'static',
      address: '192.168.132.10',
      prefixLength: 24,
      gateway: null,
      dns: { servers: [] },
    },
    ipv6: { mode: 'auto', addresses: [], gateway: null, dns: { servers: [] } },
    lastAppliedProfileId: null,
    ...overrides,
  };
}

function memProvider(adapters: Adapter[]): NetworkProvider {
  return { kind: 'fake', listAdapters: async () => adapters };
}

function memRepo(): ProfileRepository & { saved: Profile[] } {
  const saved: Profile[] = [];
  return {
    saved,
    async loadAll() {
      return saved.slice();
    },
    async findByName(name) {
      return saved.find((p) => p.name === name) ?? null;
    },
    async save(p) {
      const i = saved.findIndex((x) => x.name === p.name);
      if (i >= 0) saved[i] = p;
      else saved.push(p);
    },
  };
}

describe('saveProfile use case', () => {
  it('captures preferredAdapter when --from-adapter is provided', async () => {
    const repo = memRepo();
    const r = await saveProfile(
      { name: 'DOCK 132', fromAdapterId: 'ad-02' },
      {
        provider: memProvider([adapter()]),
        repository: repo,
        clock: fixedClock('2026-05-19T12:00:00.000Z'),
      },
    );
    strictEqual(r.ok, true);
    if (r.ok) {
      strictEqual(r.value.preferredAdapter?.macAddress, '00-11-22-33-44-55');
      strictEqual(r.value.preferredAdapter?.interfaceGuid, '{guid-02}');
      strictEqual(r.value.ipv4.address, '192.168.132.10');
      strictEqual(r.value.ipv4.prefixLength, 24);
      strictEqual(r.value.ipv4.gateway, null);
      strictEqual(r.value.ipv6.mode, 'inherit');
    }
    strictEqual(repo.saved.length, 1);
  });

  it('produces a global profile when --global is set', async () => {
    const repo = memRepo();
    const r = await saveProfile(
      { name: 'Office DHCP', ipv4Mode: 'dhcp', global: true },
      {
        provider: memProvider([]),
        repository: repo,
        clock: fixedClock('2026-05-19T12:00:00.000Z'),
      },
    );
    strictEqual(r.ok, true);
    if (r.ok) {
      strictEqual(r.value.preferredAdapter, undefined);
      strictEqual(r.value.ipv4.mode, 'dhcp');
      strictEqual(r.value.ipv4.address, null);
    }
  });

  it('refuses invalid IPv4 with a clear error', async () => {
    const repo = memRepo();
    const r = await saveProfile(
      { name: 'Bad', ipv4Mode: 'static', ipv4Address: '999.0.0.1', ipv4Prefix: 24 },
      {
        provider: memProvider([]),
        repository: repo,
        clock: fixedClock('2026-05-19T12:00:00.000Z'),
      },
    );
    strictEqual(r.ok, false);
    strictEqual(repo.saved.length, 0);
    if (!r.ok) strictEqual(r.errors.some((e) => e.includes('invalid IPv4 address')), true);
  });

  it('refuses unknown --from-adapter id', async () => {
    const repo = memRepo();
    const r = await saveProfile(
      { name: 'X', fromAdapterId: 'ad-999' },
      {
        provider: memProvider([adapter()]),
        repository: repo,
        clock: fixedClock('2026-05-19T12:00:00.000Z'),
      },
    );
    strictEqual(r.ok, false);
    strictEqual(repo.saved.length, 0);
  });
});
