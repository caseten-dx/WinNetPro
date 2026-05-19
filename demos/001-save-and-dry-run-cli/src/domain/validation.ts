// Pure validators. No throws; return ValidationResult discriminated unions.
// See `docs/specs/profile-schema.md` "Validation rules" for the canonical set.

import type { ValidationResult } from './types.js';

const IPV4_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function isValidIPv4Address(s: string): boolean {
  const m = IPV4_REGEX.exec(s);
  if (!m) return false;
  for (let i = 1; i <= 4; i++) {
    const part = m[i];
    if (part === undefined) return false;
    if (part.length > 1 && part.startsWith('0')) return false;
    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) return false;
  }
  return true;
}

export function isRejectedIPv4(s: string): boolean {
  // Per profile-schema.md: reject 0.0.0.0, 255.255.255.255, 127.0.0.0/8.
  if (s === '0.0.0.0' || s === '255.255.255.255') return true;
  if (s.startsWith('127.')) return true;
  return false;
}

export function isValidPrefixLength(n: number): boolean {
  return Number.isInteger(n) && n >= 0 && n <= 32;
}

export interface ProfileSaveInput {
  name: string;
  description?: string;
  fromAdapterId?: string;
  ipv4Mode?: 'static' | 'dhcp';
  ipv4Address?: string;
  ipv4Prefix?: number;
  ipv4Gateway?: string;
  global?: boolean;
}

export function validateProfileSaveInput(
  input: ProfileSaveInput,
): ValidationResult<ProfileSaveInput> {
  const errors: string[] = [];

  if (!input.name || input.name.trim().length === 0) {
    errors.push('profile name is required');
  } else if (input.name.length > 64) {
    errors.push('profile name must be 64 characters or fewer');
  } else if (input.name !== input.name.trim()) {
    errors.push('profile name must not have leading or trailing whitespace');
  }

  // Conflicting flags: dhcp mode + static address/prefix/gateway
  if (input.ipv4Mode === 'dhcp') {
    if (input.ipv4Address !== undefined && input.ipv4Address !== null) {
      errors.push('dhcp mode does not allow ipv4 address');
    }
    if (input.ipv4Prefix !== undefined && input.ipv4Prefix !== null) {
      errors.push('dhcp mode does not allow ipv4 prefix');
    }
    if (input.ipv4Gateway !== undefined && input.ipv4Gateway !== null) {
      errors.push('dhcp mode does not allow ipv4 gateway');
    }
  }

  // Static IPv4 fields, if provided, must be valid.
  if (input.ipv4Address !== undefined) {
    if (!isValidIPv4Address(input.ipv4Address) || isRejectedIPv4(input.ipv4Address)) {
      errors.push(`invalid IPv4 address: ${input.ipv4Address}`);
    }
  }

  if (input.ipv4Prefix !== undefined) {
    if (!isValidPrefixLength(input.ipv4Prefix)) {
      errors.push(`invalid IPv4 prefix length: ${input.ipv4Prefix}`);
    }
  }

  if (input.ipv4Gateway !== undefined) {
    if (!isValidIPv4Address(input.ipv4Gateway) || isRejectedIPv4(input.ipv4Gateway)) {
      errors.push(`invalid IPv4 gateway: ${input.ipv4Gateway}`);
    } else if (
      input.ipv4Address !== undefined &&
      input.ipv4Gateway === input.ipv4Address
    ) {
      errors.push('ipv4 gateway must not equal ipv4 address');
    }
  }

  // Static mode requires address and prefix when constructed from explicit flags
  // (a --from-adapter path may supply them via the adapter snapshot instead).
  if (
    input.ipv4Mode === 'static' &&
    input.fromAdapterId === undefined &&
    (input.ipv4Address === undefined || input.ipv4Prefix === undefined)
  ) {
    errors.push('static ipv4 mode requires --ipv4-address and --ipv4-prefix');
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: input };
}
