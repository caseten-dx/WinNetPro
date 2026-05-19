# WinNetPro — Claude Code Project Contract

## Identity

WinNetPro is an **agentic-engineering "Hello World"** that happens to be a Windows network-interface profile manager. The product is real and useful; the deeper purpose is to demonstrate that an AI coding agent — driven from BDDs, ADRs, and specs — can build inspectable, testable, safe software without any human writing implementation code.

The audience for any given demo session is **engineers learning how to drive an agent**. They are watching the artifacts, not just the output. Treat the documentation as the load-bearing surface; treat the code as the byproduct.

WinNetPro is developed exclusively by Claude Code, against this contract.

## Session start: read this only

On session start, read `STATUS.md`. That's the entire required read set.

`STATUS.md` is the single source for current phase, current demo (if any), and the last 5 sessions of context.

Do not read other docs unless the work requires them. The doc map below tells you when to load what.

## Doc map

| Question | Read |
|---|---|
| What's the current state of WinNetPro? | `STATUS.md` |
| What is WinNetPro, architecturally? | `docs/architecture/winnetpro-architecture.md` |
| Why did we decide X? | `docs/decisions/NNNN-*.md` (ADRs; one per decision) |
| What does the product do? | `docs/specs/product-spec.md` |
| What does the CLI do? | `docs/specs/cli-spec.md` |
| What does the GUI do? | `docs/specs/gui-spec.md` |
| What does a profile look like? | `docs/specs/profile-schema.md` |
| What are the safety rules? | `docs/specs/safety-spec.md` |
| What are the BDDs? | `docs/bdd/*.feature` |
| How does a demo work? | `demos/README.md` |
| What slash commands exist? | `.claude/commands/` |
| What subagents exist? | `.claude/agents/` |

If the question doesn't fit the table, ask. Don't guess.

## Invariants (load-bearing; do not violate)

These survive every refactor and every demo. They are WinNetPro's contract with the user, the audience, and the Windows machine it runs on.

1. **Fake provider is the default.** All write paths and all tests run against the fake provider unless `--real` is explicitly passed. The fake provider is the substrate for BDD evals.
2. **Dry-run before mutation.** Every mutating command supports `--dry-run` and prints a change plan. Real apply requires an explicit confirmation (`--yes`) or admin-detected interactive prompt.
3. **Rollback before write.** Before any real mutation, a snapshot of the current adapter configuration is captured. Failed applies auto-restore from snapshot.
4. **No ambiguous adapter mutation.** A profile must resolve to exactly one adapter before any mutation. Ambiguous matches stop with a clear error.
5. **Inspectable behavior.** Every test produces a human-inspectable evidence artifact (or readable JSON output) the user can scan to verify BDD scenarios were satisfied.
6. **CLI is the source of behavior.** The GUI calls the same application services as the CLI. There is no networking logic inside the GUI.
7. **Specs are the source of truth.** When code and spec disagree, fix one of them and commit the resolution. Never let them drift silently.

For the deep "why" behind each, see ADRs 0001–0008.

## Workflow

### Three layers of correctness proof — all required

| Layer | Owns | When | Format |
|---|---|---|---|
| **Unit tests (red/green TDD)** | Failure paths, edge cases, regression net | Every code change; failing tests block commit | `node --test` output |
| **BDD evidence** | User-facing happy path + catastrophic/irreversible failures | After feature work; user reviews | Markdown evidence file derived from `.feature` scenarios |
| **Anchor artifact** | The simplest concrete observable version of the feature | Built first, before supporting code | A runnable CLI command, a passing JSON output, a `.exe` |

Skipping any of the three is a known failure mode of agentic engineering. Do not skip.

### BDD scope

Happy path by default. Failure-path BDDs only when failure is **catastrophic, irreversible, or safety-critical** — for WinNetPro that means: destructive network mutation, ambiguous adapter matching, lost rollback snapshot, silent DNS modification. Other failure paths are red/green TDD's job. Don't bog BDDs down with edge cases.

### Scoping discipline

For every scoping decision: apply **Theory of Constraints first** (what's the bottleneck for the next observable thing — usually "a runnable `.exe` on the demo machine"?), then apply a **Pareto check** (does the TOC-minimal scope deliver 80% of intended value?).

Safety invariants (above) are explicit overrides — TOC/Pareto cannot defer them.

### Latency & demo discipline

The audience is watching live. Builds need to finish inside the demo budget.

- **CLI .exe** target: under 30 seconds to build via Node SEA.
- **GUI .exe** target: not assumed live-buildable. Pre-build before the demo unless the audience is OK waiting.
- The agent should narrate what it's doing as it works (one short sentence per tool batch), so the audience can follow.

### Slash commands

| Command | Purpose |
|---|---|
| `/startup [WinNetPro]` | Drift check + read STATUS.md + identify next work |
| `/closeout` | Update STATUS.md (rolling 5-entry log) + commit + promote demo-local BDDs if any |
| `/create-demo N "<slug>"` | Scaffold `demos/N-<slug>/` with own src/ and build config |
| `/adr <name>` | Scaffold a new ADR with auto-numbering and template |
| `/spec <name>` | Scaffold a new spec from template |
| `/research <topic>` | Scaffold a new research note |

Slash commands are in `.claude/commands/`.

### Subagents

| Agent | When to use |
|---|---|
| `arch-reviewer` | Before completing a non-trivial implementation, run against the diff to flag invariant violations |
| `bdd-evidence-reviewer` | After a test run, run against the spec + evidence file to confirm each scenario was hit |

Subagents are in `.claude/agents/`. Use them — they catch what code review misses, and they protect context by isolating the review pass.

## Build & test

Working toolchain: Node 24 ESM + pnpm + TypeScript + `tsx --test` (Node's built-in test runner via tsx).

Each demo lives at `demos/N-<slug>/` and is a self-contained build target. The canonical `docs/` are shared; only `src/` and build output are demo-local.

```bash
pnpm install                         # restore node_modules at repo root
pnpm --filter demo-001 test          # run tests for a specific demo
pnpm --filter demo-001 typecheck     # tsc --noEmit for that demo
pnpm --filter demo-001 build:cli     # Node SEA → demos/001-…/dist/WinNetPro-CLI-demo-001.exe
pnpm --filter demo-001 build:gui     # Electron-builder → demos/001-…/dist/WinNetPro-GUI-demo-001.exe
pnpm --filter demo-001 check         # typecheck + test
```

Until the first demo is created, `pnpm test` at root is a no-op. That's expected.

## Commit norms

- One commit per coherent change. Commit messages describe **why**, not just what.
- ADRs: include `[ADR-NNNN]` prefix in commit message.
- Specs: include `[spec:<name>]` prefix.
- Demo work: include `[demo:NNN]` prefix.
- Implementation against a spec: reference the spec file in the commit body.

## What is out of scope (now)

- Reimplementing IP Shifter's full feature set (LAN scanner, public-IP detector, proxy management). Those are deferred — see `docs/specs/product-spec.md` "Deferred."
- IPv6 mutation. v1 is IPv4-mutation + IPv6-inherit-only. See ADR-0005.
- Code signing of `.exe` artifacts. Demo binaries are unsigned. Audience members must trust the demo machine, not the binary.
- A Python implementation. Possibly later; not now. See decision in `STATUS.md` if/when it changes.

## When in doubt

Ask the user. Architectural decisions are the user's call. Implementation details are yours. If a spec is ambiguous, surface the ambiguity in chat and write the resolution into the spec before coding.

END OF FILE: CLAUDE.md
