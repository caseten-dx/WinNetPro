# Demo 001 — save-and-dry-run-cli

The first WinNetPro live demo. Vertical slice through the CLI: discover adapters from the fake provider, save a static IPv4 profile bound to a preferred adapter, then dry-run apply that profile and emit a complete `ChangePlan`. **No real Windows mutation; no GUI; no `.exe` build target for the GUI.**

## What this demo proves

- The agent can read canonical specs (`docs/specs/*`) and BDDs (`docs/bdd/*`) and produce inspectable code without a human writing any of it.
- The fake provider is a credible substrate for BDD evals.
- Dry-run is the default mutation path (ADR-0004): a `ChangePlan` is emitted; the provider's mutation log stays empty.
- Adapter matching (ADR-0006) resolves a profile to exactly one adapter, or fails loud.

## BDDs implemented

Canonical, from `docs/bdd/`:

- [`profile-save.feature`](../../docs/bdd/profile-save.feature) — save a static profile and a global DHCP profile; reject invalid IPv4; reject conflicting flags.
- [`profile-apply-dry-run.feature`](../../docs/bdd/profile-apply-dry-run.feature) — dry-run emits a complete change plan, no mutation; default-dry-run when stdin is not a TTY; ambiguous match refused; unknown profile refused.

Demo-local additions (if any) land under `bdd-additions/` and are promoted to canonical via `/closeout`.

## Out of scope for demo-001

- Real `apply` (write path through the fake provider's mutation log). Demo-002 territory.
- Rollback / snapshot capture flow. Demo-002+.
- Multi-adapter ambiguity beyond the BDD's basic refusal. Demo-002+.
- The GUI. Demo-002+ unless deferred further.
- Real PowerShell provider. Manually tested on a Windows machine, post-demo.

## Layout

```
demos/001-save-and-dry-run-cli/
├── src/
│   ├── domain/           # types + validation (Profile, Adapter, ChangePlan)
│   ├── application/      # use cases: SaveProfile, BuildDryRunPlan
│   ├── infrastructure/   # FakeProvider, JSON file store
│   └── cli/              # entry point + command parsing
├── tests/                # node --test (via tsx) — unit + BDD evidence runners
├── evidence/             # BDD evidence artifacts land here after test runs
├── fixtures/
│   └── adapters.json     # 3 adapters: built-in Ethernet, USB radio NIC (ad-02), Wi-Fi
└── bdd-additions/        # demo-local BDD scenarios pending promotion
```

## Starter fixture

`fixtures/adapters.json` defines three adapters. The USB radio NIC (`ad-02`, MAC `00-11-22-33-44-55`, GUID `{a1b2c3d4-...-345678}`) starts in DHCP at `192.168.1.42/24` — the "fresh dock" starting state assumed by the dry-run BDD. The profile-save scenarios that need a static starting state override per-scenario via `Given` setup.

## Build

```
pnpm --filter demo-001 check         # typecheck + tests
pnpm --filter demo-001 build:cli     # Node SEA → dist/WinNetPro-CLI-demo-001.exe
```

The CLI .exe target is < 30 seconds via Node SEA. The build script (`scripts/build-cli-sea.mjs`) is currently a defensive stub — implementation lands as part of finishing the demo's vertical slice.
