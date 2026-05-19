# ADR-0001: CLI-first architecture; GUI is a layer over the same application services

- **Status:** Accepted
- **Date:** 2026-05-19
- **Decider:** Mike (architectural call); Claude Code (implementer)

## Context

WinNetPro will eventually ship a GUI that lets a user click into an adapter, edit IP fields, save a profile, and apply it. A naïve implementation would put the Windows-networking logic directly inside the GUI's event handlers — "the user clicks Apply, we run PowerShell."

Three problems with that:

1. **Untestable.** GUI event handlers are awkward to unit-test, and unit tests are the foundation of the BDD evals that every demo must pass.
2. **Unobservable in a live demo.** Watching a GUI repaint does not show the audience what the agent actually built. Running `winnetpro profiles apply --dry-run --json` does.
3. **Forks the implementation.** Any second surface (a TUI, a future Python port, a remote API) would have to reimplement the same logic.

The agentic teaching goal also matters: we want each demo to produce a runnable artifact in under a few minutes. A CLI .exe via Node SEA builds in seconds. An Electron .exe takes minutes.

## Decision

**The CLI is the source of behavior. The GUI is a thin layer over the same application services the CLI calls.**

Concretely:

- All use cases (`ListAdapters`, `SaveProfile`, `ApplyProfile`, …) live in `src/application/`.
- The CLI (`src/cli/`) imports and invokes use cases. It owns argument parsing, output formatting, and exit codes.
- The GUI (`src/gui/`) imports and invokes the **same** use cases. It owns rendering and user input.
- The GUI contains zero Windows-networking logic. If a GUI event handler is calling `child_process.exec`, that is an architectural violation.
- BDD scenarios are exercised against the CLI. The GUI's behavior is verified by argument that the CLI behavior is correct *and* the GUI calls into the same use cases.

## Consequences

**Positive**

- Every behavior is testable via the CLI without a display server.
- Demos can produce a CLI .exe in under 30 seconds (Node SEA) — fits the live budget.
- A future Python port (or any other surface) reuses the same BDDs and evals; only the interface layer changes.
- The audience sees a JSON output they can read and reason about, not just a GUI that paints.

**Negative**

- The GUI must be intentionally "dumb." A developer used to fat clients may try to add logic there; ADR-0001 forbids it.
- Two interface implementations to maintain. Acceptable cost for the teaching value.

**Neutral**

- The GUI ships later than the CLI in any given demo. CLI is Demo-N step 1; GUI is Demo-N step 2.
