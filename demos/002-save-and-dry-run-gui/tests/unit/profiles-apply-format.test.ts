// Unit test guarding the rendered output of `profiles apply --dry-run` against
// non-ASCII characters. Windows PowerShell 5.1 and cmd.exe default to OEM/ANSI
// code pages on most installs and will mojibake any non-ASCII bytes the .exe
// writes, even when those bytes are valid UTF-8. Keeping the human-readable
// formatter ASCII-only side-steps the entire mess.
//
// Surfaced by the x64 smoke harness (scripts/smoke-x64-cli.ps1, 2026-05-20):
// the formatter previously emitted U+2014 EM DASH on the `dns:` and `ipv6:`
// lines, which rendered as garbage (`�?"`) on default Windows consoles.

import { describe, it } from 'node:test';
import { ok, strictEqual } from 'node:assert/strict';

import { formatPlan } from '../../src/cli/commands/profiles-apply.js';
import type { ChangePlan } from '../../src/domain/types.js';

function samplePlan(overrides: Partial<ChangePlan> = {}): ChangePlan {
  const base: ChangePlan = {
    kind: 'ChangePlan',
    createdAt: '2026-05-19T12:00:00.000Z',
    sourceProfileId: 'profile-x',
    targetAdapterId: 'ad-02',
    match: { confidence: 'exact', criteria: ['interfaceGuid'] },
    ipv4: {
      from: { mode: 'dhcp', address: '10.0.0.1', prefixLength: 24, gateway: '10.0.0.254' },
      to: { mode: 'static', address: '192.168.1.5', prefixLength: 24, gateway: '192.168.1.1' },
      willChange: true,
    },
    dns: {
      from: [],
      to: [],
      willChange: false,
      reason: 'profile DNS mode is inherit',
    },
    ipv6: { willChange: false, reason: 'v1 does not mutate IPv6' },
    rollback: {
      snapshotWillBeCreated: true,
      snapshotPath: './snapshots/ad-02-2026-05-19T12-00-00-000Z.json',
    },
  };
  return { ...base, ...overrides };
}

function firstNonAsciiCodepoint(s: string): { index: number; codepoint: number } | null {
  for (let i = 0; i < s.length; i++) {
    const cp = s.codePointAt(i);
    if (cp !== undefined && cp > 0x7f) return { index: i, codepoint: cp };
  }
  return null;
}

describe('formatPlan output encoding', () => {
  it('produces ASCII-only output for a typical static-from-dhcp plan', () => {
    const plan = samplePlan();
    const rendered = formatPlan(plan);
    const offender = firstNonAsciiCodepoint(rendered);
    ok(
      offender === null,
      offender === null
        ? 'unreachable'
        : `non-ASCII codepoint U+${offender.codepoint.toString(16).toUpperCase().padStart(4, '0')} at index ${offender.index}; rendered output:\n${rendered}`,
    );
  });

  it('still renders the dns: and ipv6: separator lines (regression guard for em-dash swap)', () => {
    const plan = samplePlan();
    const rendered = formatPlan(plan);
    ok(rendered.includes('dns:'), 'dns: line missing');
    ok(rendered.includes('ipv6:'), 'ipv6: line missing');
    // The reason text still appears, just via an ASCII separator.
    ok(rendered.includes('profile DNS mode is inherit'), 'dns reason missing');
    ok(rendered.includes('v1 does not mutate IPv6'), 'ipv6 reason missing');
  });

  it('renders dns: line with -- separator (not em-dash)', () => {
    const plan = samplePlan();
    const rendered = formatPlan(plan);
    // The rendered dns: line must contain `no change -- profile DNS mode is inherit`
    // (with an ASCII double-hyphen separator).
    ok(
      rendered.includes('no change -- profile DNS mode is inherit'),
      `expected ASCII -- separator on dns: line; got:\n${rendered}`,
    );
  });
});
