import { test, before } from 'node:test';
import { strictEqual } from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  appendScenario,
  cleanup,
  makeScenarioEnv,
  resetEvidence,
  runCli,
} from './_runner.js';
import type { Adapter, ChangePlan, Profile } from '../../src/domain/types.js';

const FEATURE = 'profile-apply-dry-run';
const FEATURE_TITLE = 'Apply a profile in dry-run mode';

let evidencePath: string;
before(() => {
  evidencePath = resetEvidence(FEATURE, FEATURE_TITLE);
});

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

test('Dry-run apply emits a complete change plan and mutates nothing', async () => {
  const env = makeScenarioEnv({ adapters: [dhcpAdapter()], profiles: [dockProfile] });
  try {
    const steps: string[] = [];
    steps.push('Given the fake provider is loaded from `./fixtures/adapters.json` — fixture written (see "Setup file: fixtures/adapters.json" below)');
    steps.push('And a profile "DOCK 132" exists in `./demo-config/profiles.json` — file seeded before the run (see "Setup file: profiles.json" below)');
    steps.push('Given the fixture has adapter "ad-02" currently in DHCP with address 192.168.1.42/24 and gateway 192.168.1.1 — confirmed by the captured fixture');
    steps.push('And the fixture adapter "ad-02" has macAddress "00-11-22-33-44-55" — confirmed by the captured fixture');

    const cmd = 'profiles apply --profile "DOCK 132" --adapter ad-02 --dry-run --json';
    steps.push(`When the user runs \`${cmd}\``);
    const result = await runCli(env, cmd);

    steps.push(`Then the exit code is 0 — got ${result.exitCode}`);
    strictEqual(result.exitCode, 0);

    const plan = JSON.parse(result.stdout) as ChangePlan;
    steps.push(`And stdout is a JSON object with kind "ChangePlan" — got "${plan.kind}"`);
    strictEqual(plan.kind, 'ChangePlan');
    steps.push(`And the change plan's targetAdapterId is "ad-02" — got "${plan.targetAdapterId}"`);
    strictEqual(plan.targetAdapterId, 'ad-02');
    steps.push(`And the change plan's match.confidence is "mac" — got "${plan.match.confidence}"`);
    strictEqual(plan.match.confidence, 'mac');
    steps.push(`And the change plan's ipv4.from.mode is "dhcp" — got "${plan.ipv4.from.mode}"`);
    strictEqual(plan.ipv4.from.mode, 'dhcp');
    steps.push(`And the change plan's ipv4.to.mode is "static" — got "${plan.ipv4.to.mode}"`);
    strictEqual(plan.ipv4.to.mode, 'static');
    steps.push(`And the change plan's ipv4.to.address is "192.168.132.10" — got "${plan.ipv4.to.address}"`);
    strictEqual(plan.ipv4.to.address, '192.168.132.10');
    steps.push(`And the change plan's ipv4.to.prefixLength is 24 — got ${plan.ipv4.to.prefixLength}`);
    strictEqual(plan.ipv4.to.prefixLength, 24);
    steps.push(`And the change plan's ipv4.willChange is true — got ${plan.ipv4.willChange}`);
    strictEqual(plan.ipv4.willChange, true);
    steps.push(`And the change plan's dns.willChange is false — got ${plan.dns.willChange}`);
    strictEqual(plan.dns.willChange, false);
    steps.push(`And the change plan's ipv6.willChange is false — got ${plan.ipv6.willChange}`);
    strictEqual(plan.ipv6.willChange, false);
    steps.push(`And the change plan's rollback.snapshotWillBeCreated is true — got ${plan.rollback.snapshotWillBeCreated}`);
    strictEqual(plan.rollback.snapshotWillBeCreated, true);

    const liveLog = result.provider.mutationLog;
    steps.push(`And the fake provider mutation log is empty — live FakeProvider.mutationLog.length = ${liveLog.length}`);
    strictEqual(liveLog.length, 0);

    appendScenario(evidencePath, {
      scenario: 'Dry-run apply emits a complete change plan and mutates nothing',
      status: 'PASS',
      steps,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      setupFiles: [
        { path: 'fixtures/adapters.json', contents: readFileSync(env.adaptersPath, 'utf8') },
        { path: 'profiles.json', contents: readFileSync(env.profilesPath, 'utf8') },
      ],
      fakeMutationLog: liveLog,
    });
  } finally {
    cleanup(env);
  }
});

test('Dry-run is the default when stdin is not a TTY', async () => {
  const env = makeScenarioEnv({ adapters: [dhcpAdapter()], profiles: [dockProfile] });
  try {
    const steps: string[] = [];
    const cmd = 'profiles apply --profile "DOCK 132" --adapter ad-02 --json';
    steps.push(`When the user runs (with no TTY) \`${cmd}\``);
    const result = await runCli(env, cmd, { isTTY: false });

    steps.push(`Then the exit code is 0 — got ${result.exitCode}`);
    strictEqual(result.exitCode, 0);

    const plan = JSON.parse(result.stdout) as ChangePlan;
    steps.push(`And stdout is a ChangePlan with no mutation occurring — kind "${plan.kind}"; mutation observation below`);
    strictEqual(plan.kind, 'ChangePlan');

    const liveLog = result.provider.mutationLog;
    steps.push(`And the fake provider mutation log is empty — live FakeProvider.mutationLog.length = ${liveLog.length}`);
    strictEqual(liveLog.length, 0);

    appendScenario(evidencePath, {
      scenario: 'Dry-run is the default when stdin is not a TTY',
      status: 'PASS',
      steps,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      setupFiles: [
        { path: 'fixtures/adapters.json', contents: readFileSync(env.adaptersPath, 'utf8') },
        { path: 'profiles.json', contents: readFileSync(env.profilesPath, 'utf8') },
      ],
      fakeMutationLog: liveLog,
    });
  } finally {
    cleanup(env);
  }
});

test('Refuse to dry-run an ambiguous adapter match', async () => {
  const twin = { ...dhcpAdapter(), id: 'ad-02b' };
  const env = makeScenarioEnv({
    adapters: [dhcpAdapter(), twin],
    profiles: [dockProfile],
  });
  try {
    const steps: string[] = [];
    steps.push('Given the fixture defines two adapters with the same MAC "00-11-22-33-44-55" (cloned virtual NIC pair) — see captured fixture below: ad-02 and ad-02b both carry that MAC');

    const cmd = 'profiles apply --profile "DOCK 132" --dry-run --json';
    steps.push(`When the user runs \`${cmd}\``);
    const result = await runCli(env, cmd);

    steps.push(`Then the exit code is 3 — got ${result.exitCode}`);
    strictEqual(result.exitCode, 3);
    steps.push(`And stderr contains "ambiguous adapter match" — got: ${JSON.stringify(result.stderr.trim())}`);
    strictEqual(result.stderr.includes('ambiguous adapter match'), true);

    const liveLog = result.provider.mutationLog;
    steps.push(`And the fake provider mutation log is empty — live FakeProvider.mutationLog.length = ${liveLog.length}`);
    strictEqual(liveLog.length, 0);

    appendScenario(evidencePath, {
      scenario: 'Refuse to dry-run an ambiguous adapter match',
      status: 'PASS',
      steps,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      setupFiles: [
        { path: 'fixtures/adapters.json', contents: readFileSync(env.adaptersPath, 'utf8') },
        { path: 'profiles.json', contents: readFileSync(env.profilesPath, 'utf8') },
      ],
      fakeMutationLog: liveLog,
    });
  } finally {
    cleanup(env);
  }
});

test('Refuse to dry-run an unknown profile', async () => {
  const env = makeScenarioEnv({ adapters: [dhcpAdapter()], profiles: [dockProfile] });
  try {
    const steps: string[] = [];
    const cmd = 'profiles apply --profile "DOES NOT EXIST" --adapter ad-02 --dry-run';
    steps.push(`When the user runs \`${cmd}\``);
    const result = await runCli(env, cmd);

    steps.push(`Then the exit code is 3 — got ${result.exitCode}`);
    strictEqual(result.exitCode, 3);
    steps.push(`And stderr contains "no profile named" — got: ${JSON.stringify(result.stderr.trim())}`);
    strictEqual(result.stderr.includes('no profile named'), true);

    appendScenario(evidencePath, {
      scenario: 'Refuse to dry-run an unknown profile',
      status: 'PASS',
      steps,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      setupFiles: [
        { path: 'fixtures/adapters.json', contents: readFileSync(env.adaptersPath, 'utf8') },
        { path: 'profiles.json', contents: readFileSync(env.profilesPath, 'utf8') },
      ],
    });
  } finally {
    cleanup(env);
  }
});
