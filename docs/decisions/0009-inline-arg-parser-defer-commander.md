# ADR-0009: Inline arg parser in demo-001; commander adoption deferred

- **Status:** Accepted
- **Date:** 2026-05-19
- **Decider:** Mike (architectural call); Claude Code (implementer)

## Context

`docs/architecture/winnetpro-architecture.md` (Interface layer) names `commander` as the CLI's arg-parsing library. While building demo-001 ("save-and-dry-run-cli"), the agent considered three options for argv parsing:

1. **Add `commander` as a runtime dependency** of `demos/001-save-and-dry-run-cli/`. Idiomatic and matches the architecture doc.
2. **Roll a tiny inline parser** (`src/cli/args.ts`) that handles the small surface demo-001 needs: `<command> <subcommand> [--flag value | --bool-flag]...` with a hard-coded set of bool flags.
3. **Defer the CLI surface entirely** by exposing only the `run()` function and a tests-only driver. Rejected: the audience needs to see a runnable CLI in the demo.

The demo-001 surface is two commands (`profiles save`, `profiles apply`) with about a dozen flags between them. Commander pulls in ~700 lines of CJS that must be re-bundled into every `Node SEA` `.exe` build. The CLAUDE.md "Latency & demo discipline" rule sets a **30-second budget** for the CLI `.exe` build — small bundles matter.

Choosing (1) means accepting a larger SEA bundle for every demo, including those that may further reduce the CLI surface area. Choosing (2) defers the dependency until a demo's CLI actually grows beyond what a 40-line parser can handle.

This is an intentional, audience-visible divergence from a spec line in the architecture document. CLAUDE.md invariant 7 ("Specs are the source of truth ... never let them drift silently") requires the divergence to be recorded.

## Decision

**Demo-001 ships with an inline arg parser at `demos/001-save-and-dry-run-cli/src/cli/args.ts`. `commander` is not added as a dependency in this demo.**

Adoption of `commander` (or any larger arg-parsing library) is **deferred** until a demo introduces a CLI command set that justifies the bundle cost — qualitatively, when the agent attempts to add a third top-level command and the inline parser begins growing argument-shape logic that duplicates what `commander` provides for free (sub-subcommands, mutually exclusive flags, automatic `--help` generation, typed coercions).

The architecture doc is updated to phrase commander as "the planned arg-parsing library" rather than a current invariant, so this ADR is the authoritative resolution.

The inline parser's known limitations (deliberately) include:

- No automatic `--help` per-command. The CLI prints a global usage string only.
- No mutually-exclusive flag declarations (e.g., the conflict between `--ipv4-mode dhcp` and `--ipv4-address` is enforced inside `domain/validation.ts`, not at the parser layer).
- No typed coercion. The parser returns strings; commands coerce.
- No subcommand suggestions ("did you mean ...").
- Bool-flag names are hard-coded in a set; adding a new bool flag requires editing the parser.

These limitations are acceptable for demo-001's two-command surface. They are the trigger conditions for revisiting this decision.

## Consequences

**Positive**

- Demo-001's `.exe` build avoids a non-trivial third-party dep, helping us stay under the 30-second demo budget for the CLI build target.
- The arg parser is ~40 lines that the audience can read end-to-end in the demo. No magic.
- Future demos can adopt commander cleanly by adding it to that demo's `package.json` — the inline parser is per-demo, not shared.

**Negative**

- The architecture doc previously said "commander" without qualification. Until this ADR, an agent reading only the architecture doc would have planned against commander. Documented divergence; resolved by this ADR + an architecture-doc edit.
- Every new top-level CLI command in this or a derivative demo requires touching the parser. This is the explicit trigger for revisiting.

**Neutral**

- The decision is scoped to demo-001. A later demo electing to use commander does not need to "undo" this ADR — it just adds the dep locally and writes a one-line note in its README that it adopts commander.
- The `run(argv, streams, overrides)` boundary is identical regardless of which parser is used. Swapping parsers in a future demo is a local change behind that boundary.
