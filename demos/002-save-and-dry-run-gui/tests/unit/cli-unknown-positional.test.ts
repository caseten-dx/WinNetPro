// Unit tests for the unknown-positional-argument rejection in run().
//
// Surfaced by the x64 smoke harness (scripts/smoke-x64-cli.ps1, 2026-05-20):
// PowerShell 5.1's Start-Process -ArgumentList does not quote arguments
// containing spaces. Passing --description "lab bench" arrived at the .exe
// as the three tokens --description, lab, bench — the parser took 'lab' as
// the description value and silently dropped 'bench' as an unrecognised
// positional. The saved profile ended up with description="lab" and the
// audience had no signal that anything was wrong.
//
// Fix: any positional argument beyond <command> <subcommand> is rejected
// with exit 2 and a "unknown argument: <token>" stderr message. If a future
// command needs to accept positionals, it should relax this check in its
// own handler.

import { describe, it } from 'node:test';
import { ok, strictEqual } from 'node:assert/strict';

import { run } from '../../src/cli/run.js';
import type { Streams } from '../../src/cli/run.js';

interface CapturedStreams extends Streams {
  out: string;
  err: string;
}

function makeStreams(opts: { isTTY?: boolean; cwd?: string } = {}): CapturedStreams {
  const s: CapturedStreams = {
    stdin: { isTTY: opts.isTTY ?? false },
    stdout: { write: () => true },
    stderr: { write: () => true },
    cwd: () => opts.cwd ?? '/tmp',
    out: '',
    err: '',
  };
  s.stdout.write = (text: string) => {
    s.out += text;
    return true;
  };
  s.stderr.write = (text: string) => {
    s.err += text;
    return true;
  };
  return s;
}

describe('unknown positional argument rejection', () => {
  it('rejects a stray positional after profiles save and exits 2', async () => {
    const s = makeStreams();
    const code = await run(
      // The --description value `lab` would normally have been "lab bench"
      // had PowerShell quoted it. Without quoting, `bench` arrives as an
      // unknown positional. We assert the .exe surfaces this rather than
      // dropping it silently.
      ['profiles', 'save', '--name', 'lab-static', '--description', 'lab', 'bench'],
      s,
    );
    strictEqual(code, 2, `expected exit 2, got ${code}\nstderr: ${s.err}`);
    ok(
      s.err.includes('unknown argument: bench'),
      `expected stderr to contain "unknown argument: bench"; got:\n${s.err}`,
    );
    // Usage block follows the error so the audience knows how to recover.
    ok(s.err.includes('Usage:'), `expected stderr to include "Usage:"; got:\n${s.err}`);
  });

  it('rejects a stray positional after profiles apply and exits 2', async () => {
    const s = makeStreams();
    const code = await run(
      ['profiles', 'apply', '--profile', 'foo', '--dry-run', 'extra-token'],
      s,
    );
    strictEqual(code, 2);
    ok(s.err.includes('unknown argument: extra-token'));
  });

  it('reports only the first unknown positional (one error is enough to fail)', async () => {
    const s = makeStreams();
    const code = await run(['profiles', 'save', '--name', 'x', 'first', 'second'], s);
    strictEqual(code, 2);
    ok(s.err.includes('unknown argument: first'));
    // We deliberately do not enumerate every offender — failing on the first
    // is enough to bring the audience back to a working command line.
    ok(!s.err.includes('unknown argument: second'));
  });

  it('still accepts a clean profiles save invocation (regression guard)', async () => {
    const s = makeStreams();
    // No fixture or config available; we just need the parser path to clear
    // the unknown-positional check. The downstream save will fail (no
    // fixture for --from-adapter resolution, no name validation issue), but
    // the failure mode will NOT be the new exit-2-on-positional path. The
    // assertion is on what the code DID NOT do: did not return 2 with
    // 'unknown argument:' for a clean invocation.
    const code = await run(
      ['profiles', 'save', '--name', 'clean'],
      s,
    );
    // We don't care about the exit code per se — only that it's not the
    // unknown-positional rejection masquerading as a real error.
    ok(
      !s.err.includes('unknown argument:'),
      `clean invocation should not trigger unknown-positional path; got:\n${s.err}`,
    );
    // Sanity: exit code is at least defined.
    ok(typeof code === 'number');
  });
});
