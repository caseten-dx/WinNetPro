# WinNetPro

**An agentic-engineering "Hello World."**

WinNetPro is a small Windows network-interface profile manager — list adapters, edit IPv4 settings, save named profiles, reapply them when devices are reconnected. It was inspired by the discontinued [IP Shifter](https://www.majorgeeks.com/files/details/ipshifter.html) utility.

But the product is not the point.

The point is to teach engineers how to build software **agentically** — by writing specifications, BDD scenarios, and architecture decisions *first*, and letting an AI coding agent (here, [Claude Code](https://claude.com/claude-code)) implement the code against those artifacts using Red/Green TDD and BDD evals.

Every demo of this project starts the same way: open the docs, walk the team through the BDDs and ADRs, optionally tweak them, then ask the agent to build a fresh Windows executable from those specifications. The team runs the resulting `.exe` and verifies the behavior matches what the docs promised.

The code is the byproduct. The specifications are the source of truth.

## What's in this repo

| Path | What it holds |
|---|---|
| `CLAUDE.md` | The project contract Claude Code loads on every session |
| `STATUS.md` | Rolling log of the last few work sessions |
| `docs/architecture/` | The single architecture overview |
| `docs/decisions/` | ADRs — one per architectural decision, numbered and dated |
| `docs/specs/` | Product, CLI, GUI, profile-schema, and safety specs |
| `docs/bdd/` | Gherkin `.feature` files — the canonical user-facing behaviors |
| `demos/` | One subdirectory per live demo session (`001-<slug>/`, `002-<slug>/`, …), each with its own `src/` and built executables |
| `.claude/commands/` | Slash commands (`/startup`, `/closeout`, `/create-demo`, …) |
| `.claude/agents/` | Specialized review agents (architecture, BDD evidence) |

## How a demo works

1. **Open the project.** Run `/startup WinNetPro` in Claude Code. The agent does a drift check, reads `STATUS.md`, and grounds itself in the current state.
2. **Walk the docs with the audience.** Review the canonical BDDs, ADRs, and specs in `docs/`. The audience proposes any tweaks; tweaks land as demo-local overlays in `demos/N-<slug>/spec-overrides.md`.
3. **Create the demo.** Run `/create-demo N "<slug>"`. A new `demos/N-<slug>/` tree is scaffolded with its own `src/` and a build configuration.
4. **Implement.** Ask the agent to build the CLI, the GUI, or both. The agent reads the canonical docs + any overrides and writes code under `demos/N-<slug>/src/` using Red/Green TDD. Tests run; BDD evals run.
5. **Build the executable.** `pnpm --filter demo-N build:cli` produces `demos/N-<slug>/dist/WinNetPro-CLI-demo-N.exe`; `build:gui` produces `…-GUI-demo-N.exe`.
6. **Distribute and verify.** Hand the `.exe` to the team. They run it. They compare actual behavior against the BDD scenarios on screen.
7. **Close out.** Run `/closeout`. Demo-local BDD additions get reviewed for promotion to the canonical set.

## Safety

WinNetPro can change Windows network settings, which is a privileged operation that can disrupt connectivity.

- The **fake provider is the default.** Real Windows mutation requires an explicit `--real` flag.
- All write operations support `--dry-run` and print a change plan before mutating anything.
- A rollback snapshot is captured before any real mutation; failed applies auto-restore.
- Auto-apply in the GUI is **off by default** and must be explicitly enabled per session.

See `docs/specs/safety-spec.md` for the full safety model.

## License

TBD.
