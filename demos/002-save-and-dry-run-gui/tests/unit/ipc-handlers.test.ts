// Unit tests for the IPC handler factory. No Electron in the test surface —
// createIpcHandlers takes plain deps, so we exercise the same code path
// main.ts wires to ipcMain.handle, without spinning the runtime.
//
// The point is to lock in the contract: every channel in IPC_CHANNELS maps
// to a function on the returned WindowApi object, and each function routes
// to the in-process application service with no behavior of its own. If a
// channel ever drifts from its service, this catches it.

import { describe, it } from 'node:test';
import { strictEqual, deepStrictEqual, ok } from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createIpcHandlers } from '../../src/gui/ipc-handlers.js';
import { IPC_CHANNELS, type WindowApi } from '../../src/gui/api-types.js';
import { FakeProvider } from '../../src/infrastructure/fake-provider.js';
import { JsonProfileRepository } from '../../src/infrastructure/json-profile-repository.js';
import { fixedClock } from '../../src/infrastructure/system-clock.js';
import type { Adapter } from '../../src/domain/types.js';

const FIXTURE_ADAPTER: Adapter = {
  id: 'ad-02',
  interfaceGuid: '{guid-02}',
  windowsAlias: 'Ethernet 5',
  description: 'USB 10/100/1000 LAN',
  macAddress: '00-11-22-33-44-55',
  appAlias: null,
  linkState: 'up',
  ipv4: {
    mode: 'dhcp',
    address: '192.168.1.42',
    prefixLength: 24,
    gateway: '192.168.1.1',
    dns: { servers: [] },
  },
  ipv6: {
    mode: 'auto',
    addresses: [],
    gateway: null,
    dns: { servers: [] },
  },
  lastAppliedProfileId: null,
};

function setupDeps(): { handlers: WindowApi; configDir: string } {
  const root = mkdtempSync(join(tmpdir(), 'wn-ipc-handlers-test-'));
  const fixtureDir = join(root, 'fixtures');
  const configDir = join(root, 'config');

  mkdirSync(fixtureDir, { recursive: true });
  mkdirSync(configDir, { recursive: true });
  writeFileSync(
    join(fixtureDir, 'adapters.json'),
    JSON.stringify([FIXTURE_ADAPTER]),
    'utf8',
  );

  const handlers = createIpcHandlers({
    provider: new FakeProvider({ fixtureDir }),
    repository: new JsonProfileRepository(configDir),
    clock: fixedClock('2026-05-21T12:00:00.000Z'),
  });

  return { handlers, configDir };
}

describe('createIpcHandlers', () => {
  it('exposes a function for every channel listed in IPC_CHANNELS', () => {
    const { handlers } = setupDeps();
    for (const channel of IPC_CHANNELS) {
      strictEqual(
        typeof handlers[channel],
        'function',
        `expected handler "${channel}" to be a function`,
      );
    }
  });

  it('listAdapters returns adapters from the provider', async () => {
    const { handlers } = setupDeps();
    const adapters = await handlers.listAdapters();
    strictEqual(adapters.length, 1);
    strictEqual(adapters[0]?.id, 'ad-02');
  });

  it('loadAllProfiles returns [] when no profiles.json exists yet', async () => {
    const { handlers } = setupDeps();
    const profiles = await handlers.loadAllProfiles();
    deepStrictEqual(profiles, []);
  });

  it('validateProfileSaveInput surfaces validation errors without saving', async () => {
    const { handlers } = setupDeps();
    const result = await handlers.validateProfileSaveInput({
      name: '', // empty name is invalid
    });
    strictEqual(result.ok, false);
    ok(result.errors.some((e) => e.includes('name is required')));
  });

  it('saveProfile persists a valid profile and returns it', async () => {
    const { handlers } = setupDeps();
    const result = await handlers.saveProfile({
      name: 'smoke-profile',
      fromAdapterId: 'ad-02',
    });
    strictEqual(result.ok, true);
    if (!result.ok) return;
    strictEqual(result.value.name, 'smoke-profile');

    // Round-trip: loadAllProfiles should now see it.
    const profiles = await handlers.loadAllProfiles();
    strictEqual(profiles.length, 1);
    strictEqual(profiles[0]?.name, 'smoke-profile');
  });

  it('buildDryRunPlan returns unknown-profile failure for an unsaved name', async () => {
    const { handlers } = setupDeps();
    const result = await handlers.buildDryRunPlan({ profileName: 'nonexistent' });
    strictEqual(result.ok, false);
    if (result.ok) return;
    strictEqual(result.reasonKind, 'unknown-profile');
  });

  it('buildDryRunPlan returns a ChangePlan for a saved profile against its adapter', async () => {
    const { handlers } = setupDeps();
    const saveResult = await handlers.saveProfile({
      name: 'plan-profile',
      fromAdapterId: 'ad-02',
      ipv4Mode: 'static',
      ipv4Address: '10.0.0.5',
      ipv4Prefix: 24,
    });
    strictEqual(saveResult.ok, true);

    const planResult = await handlers.buildDryRunPlan({
      profileName: 'plan-profile',
    });
    strictEqual(planResult.ok, true);
    if (!planResult.ok) return;
    strictEqual(planResult.value.kind, 'ChangePlan');
    strictEqual(planResult.value.targetAdapterId, 'ad-02');
    strictEqual(planResult.value.ipv4.to.address, '10.0.0.5');
  });
});
