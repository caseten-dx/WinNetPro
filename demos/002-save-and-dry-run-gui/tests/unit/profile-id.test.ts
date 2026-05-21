import { describe, it } from 'node:test';
import { strictEqual } from 'node:assert/strict';

import { profileIdFromName } from '../../src/domain/profile-id.js';

describe('profileIdFromName', () => {
  it('slugs simple names', () => strictEqual(profileIdFromName('DOCK 132'), 'profile-dock-132'));
  it('collapses runs of non-alnum', () =>
    strictEqual(profileIdFromName('Office  --DHCP'), 'profile-office-dhcp'));
  it('trims leading/trailing hyphens', () =>
    strictEqual(profileIdFromName('--abc--'), 'profile-abc'));
  it('falls back to "unnamed" for an empty slug', () =>
    strictEqual(profileIdFromName('   '), 'profile-unnamed'));
});
