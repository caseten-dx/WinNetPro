import { test, before } from 'node:test';
import { strictEqual } from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

import {
  appendScenario,
  cleanup,
  makeScenarioEnv,
  readFileIfExists,
  resetEvidence,
  runCli,
} from './_runner.js';
import type { Adapter, Profile } from '../../src/domain/types.js';

const FEATURE = 'profile-save';
const FEATURE_TITLE = 'Save a profile';

let evidencePath: string;
before(() => {
  evidencePath = resetEvidence(FEATURE, FEATURE_TITLE);
});

const adapterStatic: Adapter = {
  id: 'ad-02',
  interfaceGuid: '{a1b2c3d4-...-345678}',
  windowsAlias: 'Ethernet 5',
  description: 'USB 10/100/1000 LAN',
  macAddress: '00-11-22-33-44-55',
  appAlias: 'Dock Radio',
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
};

test('Save the current state of an adapter as a new profile with preferred-adapter binding', async () => {
  const env = makeScenarioEnv({ adapters: [adapterStatic] });
  try {
    const steps: string[] = [];
    steps.push('Given the fake provider is loaded from `./fixtures/adapters.json` — fixture written to scenario temp dir');
    steps.push('And the working directory is `./demo-config` (no profiles.json yet) — confirmed: `profiles.json` does not exist before run');
    steps.push(
      'And the fixture defines an adapter "ad-02" with windowsAlias "Ethernet 5", macAddress "00-11-22-33-44-55", interfaceGuid "{a1b2c3d4-...-345678}", description "USB 10/100/1000 LAN", ipv4.mode static, ipv4.address 192.168.132.10, ipv4.prefixLength 24, ipv4.gateway null — set up via scenario env',
    );
    strictEqual(existsSync(env.profilesPath), false);

    const cmd = 'profiles save --name "DOCK 132" --from-adapter ad-02 --json';
    steps.push(`When the user runs \`${cmd}\``);
    const result = await runCli(env, cmd);

    steps.push(`Then the exit code is 0 — got ${result.exitCode}`);
    strictEqual(result.exitCode, 0);

    steps.push(`And the file "./demo-config/profiles.json" exists — ${existsSync(env.profilesPath)}`);
    strictEqual(existsSync(env.profilesPath), true);

    const profiles = JSON.parse(readFileSync(env.profilesPath, 'utf8')) as Profile[];
    const dock = profiles.find((p) => p.name === 'DOCK 132');
    steps.push(`And profiles.json contains a profile with name "DOCK 132" — ${dock !== undefined}`);
    strictEqual(dock?.name, 'DOCK 132');

    steps.push(`And the saved profile's ipv4.address is "192.168.132.10" — got "${dock?.ipv4.address}"`);
    strictEqual(dock?.ipv4.address, '192.168.132.10');
    steps.push(`And the saved profile's ipv4.prefixLength is 24 — got ${dock?.ipv4.prefixLength}`);
    strictEqual(dock?.ipv4.prefixLength, 24);
    steps.push(`And the saved profile's ipv4.gateway is null — got ${dock?.ipv4.gateway}`);
    strictEqual(dock?.ipv4.gateway, null);
    steps.push(`And the saved profile's preferredAdapter.macAddress is "00-11-22-33-44-55" — got "${dock?.preferredAdapter?.macAddress}"`);
    strictEqual(dock?.preferredAdapter?.macAddress, '00-11-22-33-44-55');
    steps.push(`And the saved profile's preferredAdapter.interfaceGuid is "{a1b2c3d4-...-345678}" — got "${dock?.preferredAdapter?.interfaceGuid}"`);
    strictEqual(dock?.preferredAdapter?.interfaceGuid, '{a1b2c3d4-...-345678}');
    steps.push(`And the saved profile's ipv6.mode is "inherit" — got "${dock?.ipv6.mode}"`);
    strictEqual(dock?.ipv6.mode, 'inherit');

    appendScenario(evidencePath, {
      scenario: 'Save the current state of an adapter as a new profile with preferred-adapter binding',
      status: 'PASS',
      steps,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      files: [{ path: 'profiles.json', contents: readFileSync(env.profilesPath, 'utf8') }],
    });
  } finally {
    cleanup(env);
  }
});

test('Save a global profile (no preferred adapter)', async () => {
  const env = makeScenarioEnv({ adapters: [adapterStatic] });
  try {
    const steps: string[] = [];
    const cmd = 'profiles save --name "Office DHCP" --ipv4-mode dhcp --global --json';
    steps.push(`When the user runs \`${cmd}\``);
    const result = await runCli(env, cmd);

    steps.push(`Then the exit code is 0 — got ${result.exitCode}`);
    strictEqual(result.exitCode, 0);

    const profiles = JSON.parse(readFileSync(env.profilesPath, 'utf8')) as Profile[];
    const office = profiles.find((p) => p.name === 'Office DHCP');
    steps.push(`And profiles.json contains a profile with name "Office DHCP" — ${office !== undefined}`);
    strictEqual(office?.name, 'Office DHCP');
    steps.push(`And the saved profile's ipv4.mode is "dhcp" — got "${office?.ipv4.mode}"`);
    strictEqual(office?.ipv4.mode, 'dhcp');
    steps.push(`And the saved profile does not have a preferredAdapter field — ${office?.preferredAdapter === undefined}`);
    strictEqual(office?.preferredAdapter, undefined);

    appendScenario(evidencePath, {
      scenario: 'Save a global profile (no preferred adapter)',
      status: 'PASS',
      steps,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      files: [{ path: 'profiles.json', contents: readFileSync(env.profilesPath, 'utf8') }],
    });
  } finally {
    cleanup(env);
  }
});

test('Reject saving with invalid IPv4 address', async () => {
  const env = makeScenarioEnv({ adapters: [adapterStatic] });
  try {
    const steps: string[] = [];
    const cmd = 'profiles save --name "Bad" --ipv4-mode static --ipv4-address 999.0.0.1 --ipv4-prefix 24';
    steps.push(`When the user runs \`${cmd}\``);
    const result = await runCli(env, cmd);

    steps.push(`Then the exit code is 3 — got ${result.exitCode}`);
    strictEqual(result.exitCode, 3);
    steps.push(`And stderr contains "invalid IPv4 address" — got: ${JSON.stringify(result.stderr.trim())}`);
    strictEqual(result.stderr.includes('invalid IPv4 address'), true);
    steps.push(`And profiles.json is not created — exists: ${existsSync(env.profilesPath)}`);
    strictEqual(existsSync(env.profilesPath), false);

    appendScenario(evidencePath, {
      scenario: 'Reject saving with invalid IPv4 address',
      status: 'PASS',
      steps,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      notes: ['profiles.json was never created — confirmed via existsSync.'],
    });
  } finally {
    cleanup(env);
  }
});

test('Reject saving with conflicting flags (dhcp mode + static address)', async () => {
  const env = makeScenarioEnv({ adapters: [adapterStatic] });
  try {
    const steps: string[] = [];
    const cmd = 'profiles save --name "Bad" --ipv4-mode dhcp --ipv4-address 192.168.1.1 --ipv4-prefix 24';
    steps.push(`When the user runs \`${cmd}\``);
    const result = await runCli(env, cmd);

    steps.push(`Then the exit code is 3 — got ${result.exitCode}`);
    strictEqual(result.exitCode, 3);
    steps.push(`And stderr contains "dhcp mode does not allow ipv4 address" — got: ${JSON.stringify(result.stderr.trim())}`);
    strictEqual(result.stderr.includes('dhcp mode does not allow ipv4 address'), true);

    appendScenario(evidencePath, {
      scenario: 'Reject saving with conflicting flags (dhcp mode + static address)',
      status: 'PASS',
      steps,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  } finally {
    cleanup(env);
  }
});
