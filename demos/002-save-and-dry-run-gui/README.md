# Demo 002 — save-and-dry-run-gui

WinNetPro's first GUI demo. Electron shell over the same application services demo-001 ships through the CLI: list adapters from the fake provider, save a static IPv4 profile bound to a preferred adapter, then build a `ChangePlan` and surface it live in the UI. **No real Windows mutation; no real apply pipeline; no admin elevation; no rollback chrome.** All of that lands in demo-003.

## What this demo proves

- The agent can take a designed visual hand-off (Figma-equivalent PNGs + token CSS + microcopy strings) and render it faithfully in Electron without inventing UX.
- CLAUDE.md invariant 6 — the GUI calls the same application services as the CLI, contains zero Windows-networking logic — is structurally enforceable in code, not just spec.
- Safe Mode is a structural affordance (full-width banner), not a corner chip. The audience cannot miss it.
- Progressive disclosure works on the IPv4 mode toggle: DHCP hides Static fields and shows a guidance line; Static reveals them.
- BDD scenarios drive both the application services in-process AND headless Electron snapshots, producing audience-inspectable Markdown + PNG evidence.

## Inputs to this demo

- **Binding behavioral spec**: [`docs/specs/gui-spec.md`](../../docs/specs/gui-spec.md).
- **Design brief**: [`docs/research/demo-002-gui-design.md`](../../docs/research/demo-002-gui-design.md).
- **Design hand-off**: [`docs/research/demo-002-gui-design-handoff/`](../../docs/research/demo-002-gui-design-handoff/) — 6 artboard frames × light/dark, `tokens.css`, microcopy strings, Windows 11 custom title-bar specs, READMEs mapping back to the brief's acceptance criteria.
- **Carry-forward from demo-001** (per STATUS.md "Carry-forward for demo-002"): ASCII-only CLI human output, arg parser unknown-positional rejection, willChange semantic disambiguation. Land alongside the demo-001 → demo-002 copy-forward of `src/domain/`, `src/application/`, `src/infrastructure/`, `src/cli/`.

## BDDs implemented

Canonical, from `docs/bdd/`:

- [`profile-save.feature`](../../docs/bdd/profile-save.feature) — driven through the GUI's Save Profile flow; evidence includes headless screenshots of the save modal.
- [`profile-apply-dry-run.feature`](../../docs/bdd/profile-apply-dry-run.feature) — exercised by the live "Pending change plan" panel; evidence includes a screenshot of the populated plan rendering.

Demo-local additions (if any) land under `bdd-additions/` and are promoted to canonical via `/closeout`.

## Spec overrides (per ADR-0007)

Two spec changes are implied by the design hand-off and tracked in `spec-overrides.md` (to be created at implementation time):

1. **Drop the "All profiles" dropdown from the adapter detail panel.** The lower-left Profiles list is the single canonical view of every profile. The per-adapter Adapter Profiles dropdown is preserved.
2. **Provider mode stays a launch flag in demo-002.** A runtime toggle is designed-in-spirit (the demo-003 preview frame shows the banner re-keyed to amber), but the gating model (admin detection, confirmation modal, pre/post-state visualization) is not finalized — the canonical spec change defers to demo-003.

Promotion to canonical (i.e., editing `docs/specs/gui-spec.md`) happens at `/closeout` after the audience has reviewed.

## Out of scope for demo-002

- Real `apply` pipeline (`FakeProvider.applyChangePlan`, `verify`). Demo-003 territory.
- Snapshot capture / rollback flow (ADR-0004 steps 9-12). Demo-003.
- Admin / elevation detection (safety-spec invariant 4). Demo-003.
- WindowsProvider real adapter enumeration. Demo-003.
- ADR-0006 description/alias matching warning emission. Demo-003.
- Apply confirmation modal, Revert-to-DHCP button. Demo-003.
- IPv6 / DNS edit controls. v1 keeps them as "inherit (no change)" per ADR-0005.

## Layout

```
demos/002-save-and-dry-run-gui/
├── src/
│   ├── domain/           # types + validation (copy-forward from demo-001 + 3 fixes)
│   ├── application/      # use cases: SaveProfile, BuildDryRunPlan
│   ├── infrastructure/   # FakeProvider, JsonProfileRepository
│   ├── cli/              # entry point + command parsing (carries the 3 fixes)
│   └── gui/              # Electron main + preload + renderer
├── tests/                # tsx --test — unit + BDD-with-screenshots
├── evidence/             # Markdown + PNG evidence files
├── fixtures/
│   └── adapters.json     # 3 adapters (copy-forward from demo-001)
└── bdd-additions/        # demo-local BDD scenarios pending promotion
```

## Build

```
pnpm --filter demo-002 check         # typecheck + tests + BDD evidence
pnpm --filter demo-002 build:cli     # Node SEA → dist/WinNetPro-CLI-demo-002.exe
pnpm --filter demo-002 build:gui     # Electron-builder → dist/WinNetPro-GUI-demo-002.exe
```

The CLI build mirrors demo-001 (under-30-second budget via Node SEA). The GUI build is **not** assumed live-buildable during a demo — pre-build before audience time unless the budget is generous. A parallel `.github/workflows/build-gui.yml` workflow ships alongside `build-cli.yml` for CI production of the audience-target `WinNetPro-GUI-demo-002.exe` (x64 Windows).

## Starter fixture

`fixtures/adapters.json` is copied verbatim from demo-001. Three adapters: built-in Intel Ethernet (`ad-01`, DHCP `10.10.20.57/22`), USB Dock Radio NIC (`ad-02`, MAC `00-11-22-33-44-55`, DHCP `192.168.1.42/24`, alias "Dock Radio"), Intel Wi-Fi (`ad-03`, DHCP `10.10.30.118/22`). The design hand-off frames render exactly these three adapters with their alias, IPv4, MAC, and link state.
