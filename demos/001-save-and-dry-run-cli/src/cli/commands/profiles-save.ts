import type { ParsedArgs } from '../args.js';
import type { Streams } from '../run.js';
import { saveProfile } from '../../application/save-profile.js';
import type { Clock, NetworkProvider, ProfileRepository } from '../../application/ports.js';
import type { ProfileSaveInput } from '../../domain/validation.js';

export interface CommandDeps {
  provider: NetworkProvider;
  repository: ProfileRepository;
  clock: Clock;
}

export async function runProfilesSave(
  args: ParsedArgs,
  streams: Streams,
  deps: CommandDeps,
): Promise<number> {
  const name = args.flags.get('--name');
  if (name === undefined) {
    streams.stderr.write('--name is required\n');
    return 2;
  }

  const ipv4ModeRaw = args.flags.get('--ipv4-mode');
  if (ipv4ModeRaw !== undefined && ipv4ModeRaw !== 'static' && ipv4ModeRaw !== 'dhcp') {
    streams.stderr.write(`--ipv4-mode must be "static" or "dhcp", got "${ipv4ModeRaw}"\n`);
    return 2;
  }

  const prefixRaw = args.flags.get('--ipv4-prefix');
  let ipv4Prefix: number | undefined;
  if (prefixRaw !== undefined) {
    const n = Number(prefixRaw);
    if (!Number.isFinite(n)) {
      streams.stderr.write(`--ipv4-prefix must be a number, got "${prefixRaw}"\n`);
      return 2;
    }
    ipv4Prefix = n;
  }

  const description = args.flags.get('--description');
  const fromAdapter = args.flags.get('--from-adapter');
  const ipv4Address = args.flags.get('--ipv4-address');
  const ipv4Gateway = args.flags.get('--ipv4-gateway');

  const input: ProfileSaveInput = {
    name,
    ...(description !== undefined ? { description } : {}),
    ...(fromAdapter !== undefined ? { fromAdapterId: fromAdapter } : {}),
    ...(ipv4ModeRaw !== undefined ? { ipv4Mode: ipv4ModeRaw as 'static' | 'dhcp' } : {}),
    ...(ipv4Address !== undefined ? { ipv4Address } : {}),
    ...(ipv4Prefix !== undefined ? { ipv4Prefix } : {}),
    ...(ipv4Gateway !== undefined ? { ipv4Gateway } : {}),
    ...(args.bools.has('--global') ? { global: true } : {}),
  };

  const result = await saveProfile(input, deps);
  if (!result.ok) {
    for (const e of result.errors) streams.stderr.write(`${e}\n`);
    return 3;
  }

  if (args.bools.has('--json')) {
    streams.stdout.write(JSON.stringify(result.value, null, 2) + '\n');
  } else {
    streams.stdout.write(
      `Saved profile "${result.value.name}" (id=${result.value.id}).\n`,
    );
  }
  return 0;
}
