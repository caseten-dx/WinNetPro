// Tiny argv parser scoped to demo-001's surface. We deliberately do not pull
// in `commander` here (architecture doc names it but doesn't gate on it); the
// goal is a small Node SEA bundle. Adoption of `commander` is deferred to a
// later demo if/when the CLI surface grows.
//
// Shape: <command> <subcommand> [--flag value | --bool-flag]...
// Quoted values are handled by the shell, not here.

export interface ParsedArgs {
  command: string | undefined;
  subcommand: string | undefined;
  flags: Map<string, string>;
  bools: Set<string>;
  positionals: string[];
}

const KNOWN_BOOL_FLAGS = new Set([
  '--real',
  '--dry-run',
  '--yes',
  '--json',
  '--global',
  '--help',
  '--version',
]);

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags = new Map<string, string>();
  const bools = new Set<string>();

  let i = 0;
  while (i < argv.length) {
    const tok = argv[i]!;
    if (tok.startsWith('--')) {
      if (KNOWN_BOOL_FLAGS.has(tok)) {
        bools.add(tok);
        i += 1;
        continue;
      }
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        // Treat as a bare bool too (future-proofing) — caller decides if it's an error.
        bools.add(tok);
        i += 1;
        continue;
      }
      flags.set(tok, next);
      i += 2;
      continue;
    }
    positionals.push(tok);
    i += 1;
  }

  const command = positionals[0];
  const subcommand = positionals[1];
  return {
    command,
    subcommand,
    flags,
    bools,
    positionals: positionals.slice(2),
  };
}
