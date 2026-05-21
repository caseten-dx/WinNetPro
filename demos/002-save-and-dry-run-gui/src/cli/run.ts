// The canonical CLI surface. `index.ts` wires `process.*` into this; tests
// call it directly with mock streams. Returning a number instead of calling
// `process.exit` lets the same entry point be both a real binary and an
// in-process testable function.

import { resolve } from 'node:path';

import { parseArgs } from './args.js';
import { runProfilesSave } from './commands/profiles-save.js';
import { runProfilesApply } from './commands/profiles-apply.js';
import { FakeProvider } from '../infrastructure/fake-provider.js';
import { JsonProfileRepository } from '../infrastructure/json-profile-repository.js';
import { systemClock } from '../infrastructure/system-clock.js';
import type { Clock, NetworkProvider, ProfileRepository } from '../application/ports.js';

export interface Streams {
  stdin: { isTTY?: boolean };
  stdout: { write(s: string): unknown };
  stderr: { write(s: string): unknown };
  cwd: () => string;
}

export interface RunOverrides {
  // Tests may inject deterministic ports without touching `--real`.
  provider?: NetworkProvider;
  repository?: ProfileRepository;
  clock?: Clock;
}

export async function run(
  argv: readonly string[],
  streams: Streams,
  overrides: RunOverrides = {},
): Promise<number> {
  const parsed = parseArgs(argv);

  if (parsed.bools.has('--real')) {
    // demo-001 is fake-provider-only. Surface this clearly; future demos
    // wire in PowerShellProvider here.
    streams.stderr.write('--real is not supported in demo-001 (CLI-only, fake provider).\n');
    return 1;
  }

  if (parsed.command === undefined) {
    streams.stderr.write(usage());
    return 2;
  }

  const configDir = resolve(streams.cwd(), parsed.flags.get('--config-dir') ?? '.');
  const fixtureDir = resolve(
    streams.cwd(),
    parsed.flags.get('--fixture-dir') ?? './fixtures',
  );

  const provider = overrides.provider ?? new FakeProvider({ fixtureDir });
  const repository = overrides.repository ?? new JsonProfileRepository(configDir);
  const clock = overrides.clock ?? systemClock;

  try {
    if (parsed.command === 'profiles' && parsed.subcommand === 'save') {
      return await runProfilesSave(parsed, streams, { provider, repository, clock });
    }
    if (parsed.command === 'profiles' && parsed.subcommand === 'apply') {
      return await runProfilesApply(parsed, streams, { provider, repository, clock });
    }
    streams.stderr.write(`unknown command: ${parsed.command} ${parsed.subcommand ?? ''}\n`);
    streams.stderr.write(usage());
    return 2;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    streams.stderr.write(`internal error: ${msg}\n`);
    return 1;
  }
}

function usage(): string {
  return [
    'Usage:',
    '  WinNetPro-CLI profiles save --name "<name>" [--from-adapter <id>] [--ipv4-mode static|dhcp] [--ipv4-address <ip>] [--ipv4-prefix <0-32>] [--ipv4-gateway <ip>] [--global] [--description "<text>"] [--json]',
    '  WinNetPro-CLI profiles apply --profile "<name>" [--adapter <id>] [--dry-run] [--json]',
    '',
    'Global flags: --config-dir <path>, --fixture-dir <path>',
    '',
  ].join('\n');
}
