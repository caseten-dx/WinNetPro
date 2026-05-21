import { describe, it } from 'node:test';
import { strictEqual, deepStrictEqual } from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { JsonProfileRepository } from '../../src/infrastructure/json-profile-repository.js';
import type { Profile } from '../../src/domain/types.js';

function profile(overrides: Partial<Profile> = {}): Profile {
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

describe('JsonProfileRepository', () => {
  it('returns [] when no profiles.json exists', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'winnetpro-repo-'));
    try {
      const repo = new JsonProfileRepository(dir);
      deepStrictEqual(await repo.loadAll(), []);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('round-trips a profile by save + findByName', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'winnetpro-repo-'));
    try {
      const repo = new JsonProfileRepository(dir);
      const p = profile({ name: 'DOCK 132' });
      await repo.save(p);
      const found = await repo.findByName('DOCK 132');
      strictEqual(found?.id, p.id);
      strictEqual(found?.ipv4.address, '192.168.132.10');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('replaces an existing profile by name on second save', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'winnetpro-repo-'));
    try {
      const repo = new JsonProfileRepository(dir);
      await repo.save(profile({ name: 'X', ipv4: { ...profile().ipv4, address: '1.1.1.1' } }));
      await repo.save(profile({ name: 'X', ipv4: { ...profile().ipv4, address: '2.2.2.2' } }));
      const all = await repo.loadAll();
      strictEqual(all.length, 1);
      strictEqual(all[0]?.ipv4.address, '2.2.2.2');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
