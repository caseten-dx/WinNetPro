# WinNetPro Architecture

> One document. The full architecture overview. Read this once; let ADRs and specs carry the per-decision detail.

## Purpose

WinNetPro lists Windows network adapters, edits their IPv4 configuration, and saves named profiles that can be reapplied when devices reconnect. The product is real; the deeper purpose is to demonstrate that an AI coding agent — driven from BDDs, ADRs, and specs — can produce inspectable, testable, safe software without a human writing implementation code.

The architecture is therefore optimized for **two simultaneous readers**:

1. The **agent** that has to build the code from these artifacts.
2. The **audience** that has to follow the agent live during a demo, and trust the binary that drops out the other side.

## Shape of the system

```
┌─────────────────────────────────────────────────────────────┐
│                       Interface Layer                       │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │   CLI (Node SEA .exe)   │  │ GUI (Electron .exe)      │  │
│  │   commander + tables    │  │ TS frontend, no net      │  │
│  └─────────────┬───────────┘  └────────────┬─────────────┘  │
│                │                            │                │
│                └──────────────┬─────────────┘                │
│                               │                              │
│                               ▼                              │
│                    Application Services                      │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  ListAdapters, GetAdapter, SaveProfile,              │    │
│  │  ApplyProfile, SetStaticIPv4, SetDhcp,               │    │
│  │  CreateRollbackSnapshot, RestoreFromSnapshot,        │    │
│  │  ValidateChangePlan, BuildDryRunPlan                 │    │
│  └────────────┬─────────────────────────────┬───────────┘    │
│               │                             │                │
│               ▼                             ▼                │
│       Domain Layer                  Ports (interfaces)       │
│  ┌────────────────────┐      ┌─────────────────────────┐     │
│  │ NetworkAdapter     │      │ NetworkProvider         │     │
│  │ IPv4Config         │      │ ProfileRepository       │     │
│  │ IPv6ConfigSummary  │      │ SnapshotStore           │     │
│  │ Profile            │      │ Clock                   │     │
│  │ ChangePlan         │      └────────────┬────────────┘     │
│  │ ValidationResult   │                   │                  │
│  └────────────────────┘                   │                  │
│                                            ▼                 │
│                            Infrastructure (adapters)         │
│                  ┌──────────────────────────────────────┐    │
│                  │ FakeProvider (DEFAULT — tests + demo)│    │
│                  │ PowerShellProvider (--real opt-in)   │    │
│                  │ JsonProfileRepository (CWD)          │    │
│                  │ JsonSnapshotStore (CWD)              │    │
│                  └──────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Layer rules

### Domain
- Pure TypeScript. No `import` of `node:child_process`, `fs`, or anything OS-shaped.
- All validation lives here: IPv4 address, prefix length, gateway, DNS, profile schema.
- Pure functions return `ValidationResult` discriminated unions, never throw for invalid input.

### Application
- Orchestrates domain logic and depends only on **ports** (interfaces), never concrete adapters.
- A `BuildDryRunPlan` use case is required for every mutating use case; no use case bypasses dry-run construction.
- `ApplyProfile` always calls `CreateRollbackSnapshot` first, then `BuildDryRunPlan`, then `ValidateChangePlan`, then the provider, then verifies — and restores on failure.

### Infrastructure
- One adapter per port.
- `FakeProvider` is the default the application is wired to. `PowerShellProvider` only activates when the user passes `--real`.
- All adapters are independently testable.

### Interface
- CLI is the canonical surface. Output supports `--json` for evals. **Arg parsing**: `commander` is the planned library once a demo's CLI surface justifies the SEA bundle cost; demo-001 ships an inline parser per ADR-0009.
- GUI is Electron. It calls the same application services as the CLI. The GUI must contain **zero** Windows-network logic.

## Per-demo source-tree pattern (ADR-0007)

```
WinNetPro/
├── docs/                  ← CANONICAL. Read by every demo.
│   ├── architecture/
│   ├── decisions/
│   ├── specs/
│   └── bdd/
└── demos/
    ├── README.md
    ├── 001-radio-dock-static/
    │   ├── package.json
    │   ├── src/
    │   │   ├── domain/
    │   │   ├── application/
    │   │   ├── infrastructure/
    │   │   └── cli/
    │   ├── tests/
    │   ├── evidence/        ← BDD evidence artifacts
    │   ├── spec-overrides.md   (optional)
    │   ├── bdd-additions/   (optional, demo-local feature files)
    │   └── dist/
    │       ├── WinNetPro-CLI-demo-001.exe
    │       └── WinNetPro-GUI-demo-001.exe
    └── 002-…/
```

Each demo is a self-contained pnpm workspace package. The canonical `docs/` are shared across demos; demo-local tweaks live in `demos/N-<slug>/spec-overrides.md` and `demos/N-<slug>/bdd-additions/`. At `/closeout`, demo-local BDDs may be promoted to canonical with an explicit step.

## Critical adjacency: the demo loop

The architecture exists in service of a repeating loop:

1. **Read canonical docs** — agent loads `docs/architecture/`, `docs/decisions/`, `docs/specs/`, `docs/bdd/`.
2. **Read demo overrides** — any `spec-overrides.md` or `bdd-additions/*.feature` for the current demo.
3. **Plan + scaffold** — generate the slice of code that satisfies the BDDs.
4. **Red/Green TDD** — failing test → minimal impl → green → refactor.
5. **BDD evidence** — run scenarios against the fake provider, emit a Markdown evidence file under `demos/N-<slug>/evidence/`.
6. **Build .exe** — Node SEA for CLI, Electron-builder for GUI.
7. **Audience verifies** — runs the .exe, compares to BDDs on screen.
8. **/closeout** — STATUS.md updated, demo-local BDDs reviewed for promotion.

The architecture is only correct if it makes this loop fast, inspectable, and safe.

## Key safety properties (full detail in `docs/specs/safety-spec.md`)

- **Fake-by-default.** `--real` is the only way to touch Windows.
- **Dry-run gate.** Every mutating CLI command supports `--dry-run`, defaulting to it when stdin is not a TTY (so evals never mutate).
- **Snapshot before write.** No mutation without a captured snapshot.
- **Auto-rollback.** Failed apply restores the snapshot and exits non-zero.
- **Admin detection.** `--real` write paths verify admin privilege and refuse with a clear message otherwise.
- **No ambiguous matching.** A profile must resolve to exactly one adapter (by GUID, MAC, or alias-with-confirmation).

## Open architectural questions

- Whether `JsonSnapshotStore` should keep all snapshots or only the most recent per adapter. (Default: most recent per adapter, with a `--keep-history` opt-in for advanced demos. Revisit if Demo 2+ shows the need.)
- Whether GUI auto-apply (ADR-0008 says off by default) should ever be exposed in the demo build at all. (Default: yes, off by default, opt-in toggle visible.)
- Whether to ship a Python sibling implementation (`winnetpro-py`) for cross-language teaching comparison. Deferred; revisit after Demo 2.
