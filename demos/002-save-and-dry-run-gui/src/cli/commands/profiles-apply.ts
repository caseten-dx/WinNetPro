import type { ParsedArgs } from '../args.js';
import type { Streams } from '../run.js';
import { buildDryRunPlan } from '../../application/build-dry-run-plan.js';
import type { Clock, NetworkProvider, ProfileRepository } from '../../application/ports.js';

export interface CommandDeps {
  provider: NetworkProvider;
  repository: ProfileRepository;
  clock: Clock;
}

export async function runProfilesApply(
  args: ParsedArgs,
  streams: Streams,
  deps: CommandDeps,
): Promise<number> {
  const profileName = args.flags.get('--profile');
  if (profileName === undefined) {
    streams.stderr.write('--profile is required\n');
    return 2;
  }

  // Per ADR-0004: --dry-run is default when stdin is not a TTY. Demo-002
  // implements the dry-run path only (same as demo-001); the explicit
  // non-dry-run path lands with the real apply pipeline in demo-003.
  const dryRun = args.bools.has('--dry-run') || streams.stdin.isTTY !== true;
  if (!dryRun) {
    streams.stderr.write(
      'demo-002 supports --dry-run only; the real apply pipeline lands in demo-003.\n',
    );
    return 1;
  }

  const adapterId = args.flags.get('--adapter');
  const planResult = await buildDryRunPlan(
    {
      profileName,
      ...(adapterId !== undefined ? { adapterId } : {}),
    },
    deps,
  );

  if (!planResult.ok) {
    for (const e of planResult.errors) streams.stderr.write(`${e}\n`);
    if (planResult.reasonKind === 'unknown-profile') return 3;
    if (planResult.reasonKind === 'no-match') return 3;
    if (planResult.reasonKind === 'ambiguous-match') return 3;
    return 3;
  }

  const plan = planResult.value;
  if (args.bools.has('--json')) {
    streams.stdout.write(JSON.stringify(plan, null, 2) + '\n');
  } else {
    streams.stdout.write(formatPlan(plan));
  }
  return 0;
}

function formatPlan(plan: import('../../domain/types.js').ChangePlan): string {
  const lines: string[] = [];
  lines.push(`Change plan for profile "${plan.sourceProfileId}" -> adapter "${plan.targetAdapterId}"`);
  lines.push(`  match:    ${plan.match.confidence} (${plan.match.criteria.join(', ') || 'global'})`);
  lines.push(
    `  ipv4:     ${describeIpv4(plan.ipv4.from)} -> ${describeIpv4(plan.ipv4.to)} ${plan.ipv4.willChange ? '(changes)' : '(no change)'}`,
  );
  lines.push(`  dns:      ${plan.dns.willChange ? 'will change' : 'no change'} — ${plan.dns.reason}`);
  lines.push(`  ipv6:     no change — ${plan.ipv6.reason}`);
  lines.push(
    `  rollback: snapshot ${plan.rollback.snapshotWillBeCreated ? 'will be created at' : 'disabled'} ${plan.rollback.snapshotPath}`,
  );
  lines.push('');
  return lines.join('\n');
}

function describeIpv4(s: {
  mode: string;
  address: string | null;
  prefixLength: number | null;
  gateway: string | null;
}): string {
  if (s.mode === 'dhcp') return 'dhcp';
  const addr = s.address ?? '?';
  const px = s.prefixLength ?? '?';
  const gw = s.gateway ? ` gw ${s.gateway}` : '';
  return `static ${addr}/${px}${gw}`;
}
