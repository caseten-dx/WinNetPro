import { describe, it } from 'node:test';
import { strictEqual, deepStrictEqual } from 'node:assert/strict';

import {
  isValidIPv4Address,
  isRejectedIPv4,
  isValidPrefixLength,
  validateProfileSaveInput,
} from '../../src/domain/validation.js';

describe('isValidIPv4Address', () => {
  it('accepts a normal address', () => strictEqual(isValidIPv4Address('192.168.1.42'), true));
  it('accepts the lowest octet (0.0.0.0 is shape-valid even if semantically rejected)', () =>
    strictEqual(isValidIPv4Address('0.0.0.0'), true));
  it('rejects a 4th octet above 255', () =>
    strictEqual(isValidIPv4Address('192.168.1.999'), false));
  it('rejects malformed dotted-quad', () => strictEqual(isValidIPv4Address('999.0.0.1'), false));
  it('rejects extra-octet input', () => strictEqual(isValidIPv4Address('1.2.3.4.5'), false));
  it('rejects empty string', () => strictEqual(isValidIPv4Address(''), false));
  it('rejects non-numeric octets', () => strictEqual(isValidIPv4Address('a.b.c.d'), false));
});

describe('isRejectedIPv4', () => {
  it('rejects 0.0.0.0', () => strictEqual(isRejectedIPv4('0.0.0.0'), true));
  it('rejects 255.255.255.255', () => strictEqual(isRejectedIPv4('255.255.255.255'), true));
  it('rejects 127/8', () => strictEqual(isRejectedIPv4('127.0.0.1'), true));
  it('accepts a normal address', () => strictEqual(isRejectedIPv4('192.168.1.42'), false));
});

describe('isValidPrefixLength', () => {
  it('accepts /24', () => strictEqual(isValidPrefixLength(24), true));
  it('accepts /0', () => strictEqual(isValidPrefixLength(0), true));
  it('accepts /32', () => strictEqual(isValidPrefixLength(32), true));
  it('rejects /-1', () => strictEqual(isValidPrefixLength(-1), false));
  it('rejects /33', () => strictEqual(isValidPrefixLength(33), false));
  it('rejects non-integer', () => strictEqual(isValidPrefixLength(24.5), false));
});

describe('validateProfileSaveInput', () => {
  it('accepts a from-adapter save with just a name', () => {
    const r = validateProfileSaveInput({ name: 'DOCK 132', fromAdapterId: 'ad-02' });
    strictEqual(r.ok, true);
  });

  it('rejects empty name', () => {
    const r = validateProfileSaveInput({ name: '' });
    strictEqual(r.ok, false);
    if (!r.ok) deepStrictEqual(r.errors[0], 'profile name is required');
  });

  it('rejects an invalid IPv4 address', () => {
    const r = validateProfileSaveInput({
      name: 'Bad',
      ipv4Mode: 'static',
      ipv4Address: '999.0.0.1',
      ipv4Prefix: 24,
    });
    strictEqual(r.ok, false);
    if (!r.ok) strictEqual(r.errors.some((e) => e.includes('invalid IPv4 address')), true);
  });

  it('rejects dhcp + ipv4-address conflict', () => {
    const r = validateProfileSaveInput({
      name: 'Bad',
      ipv4Mode: 'dhcp',
      ipv4Address: '192.168.1.1',
      ipv4Prefix: 24,
    });
    strictEqual(r.ok, false);
    if (!r.ok)
      strictEqual(
        r.errors.some((e) => e === 'dhcp mode does not allow ipv4 address'),
        true,
      );
  });

  it('rejects static without address+prefix when no from-adapter', () => {
    const r = validateProfileSaveInput({ name: 'Bad', ipv4Mode: 'static' });
    strictEqual(r.ok, false);
    if (!r.ok)
      strictEqual(
        r.errors.some((e) => e.includes('static ipv4 mode requires')),
        true,
      );
  });

  it('accepts dhcp + global', () => {
    const r = validateProfileSaveInput({ name: 'Office DHCP', ipv4Mode: 'dhcp', global: true });
    strictEqual(r.ok, true);
  });
});
