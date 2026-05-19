# GUI Spec — WinNetPro v1

The GUI is a thin layer over the same application services the CLI invokes (ADR-0001). It contains **zero** Windows-networking logic. Every action the GUI takes goes through the same use cases the CLI calls.

## Binary

`WinNetPro-GUI-demo-NNN.exe` (Electron, packaged via electron-builder, single executable).

The GUI is typically pre-built before a demo. When live-built, expect 2–5 minutes.

## Layout (main window)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  WinNetPro — demo NNN — fixture provider (or: real provider)             │
│  Config dir: C:\Users\mike\demo-folder                       [auto-apply ☐]│
├──────────────┬───────────────────────────────────────────────────────────┤
│              │  Adapter detail: Ethernet 5                                │
│  ADAPTERS    │  MAC: 00-11-22-33-44-55                                    │
│              │  Description: USB 10/100/1000 LAN                          │
│  ▸ Ethernet  │  App alias: [Dock Radio                       ] (internal) │
│  ▸ Ethernet5 │                                                            │
│  ▸ Wi-Fi     │  Adapter profiles ▼  [DOCK 132            ]               │
│              │  All profiles    ▼  [—                     ]               │
│              │                                                            │
│              │  IPv4 mode: ( ) DHCP  (•) Static                           │
│              │    Address:  [192.168.132.10]                              │
│              │    Prefix:   [24]                                          │
│              │    Gateway:  [                ] (optional)                 │
│              │    DNS:      inherit (no change)                           │
│              │                                                            │
│              │  IPv6 mode:  inherit (read-only in v1)                     │
│              │                                                            │
│              │  ┌── Pending change plan ─────────────────────────────┐   │
│              │  │ IPv4: dhcp → static 192.168.132.10/24              │   │
│              │  │ DNS:  no change                                    │   │
│              │  │ IPv6: no change                                    │   │
│              │  └────────────────────────────────────────────────────┘   │
│              │                                                            │
│              │  [ Apply ]  [ Save profile ]  [ Revert to DHCP ]           │
│              │                                                            │
│              │  Status: idle                                              │
└──────────────┴───────────────────────────────────────────────────────────┘
```

## Visible state machine

The status bar at the bottom of the detail panel always shows one of:

- `idle` — no pending changes.
- `pending` — fields have been edited but no apply attempted.
- `validating` — domain validation in progress (typically < 100 ms).
- `applying` — provider call in flight (always shown briefly so the audience sees it).
- `applied` — success; last apply completed.
- `failed: <reason>` — apply failed before mutation.
- `rolled-back: <reason>` — apply mutated, then was reversed via snapshot.

## Components

### Title bar

- App name and demo number.
- Provider mode: "fixture provider" (default) or "real provider" — set at launch by `--real` flag passed to the GUI executable, no in-app toggle.
- Config directory: the resolved path where profiles and snapshots live.
- Auto-apply toggle (off by default; see below).

### Adapter list (left pane)

- One row per detected adapter.
- Refresh button at the top.
- Each row shows alias, MAC, current IPv4 summary, link state.
- Selecting a row populates the detail panel.

### Adapter detail panel (right pane)

- **App alias** — text field, editable, internal to WinNetPro. Never written to Windows.
- **Adapter profiles dropdown** — profiles whose `preferredAdapter` matches this adapter (per ADR-0006 categories 2–5).
- **All profiles dropdown** — every profile. Selecting one from here that does not match this adapter triggers a confirmation.
- **IPv4 mode radio** — DHCP vs Static.
- **IPv4 fields** — address, prefix length, gateway (optional). DNS shown as "inherit (no change)" with no edit control in v1.
- **IPv6 mode** — read-only "inherit" in v1 (per ADR-0005).
- **Pending change plan** — live computed from current field state vs adapter's actual state. Identical shape to CLI's `--json` change plan output.
- **Apply button** — triggers the dry-run-then-confirm-then-apply pipeline.
- **Save profile button** — opens a modal asking for profile name and whether to capture `preferredAdapter`.
- **Revert to DHCP button** — shortcut for "build an apply with `ipv4.mode = dhcp`."

### Confirmation dialog (apply)

```
┌─ Apply profile? ──────────────────────────────────────────┐
│  Adapter: Ethernet 5 (MAC 00-11-22-33-44-55)              │
│                                                            │
│  Change plan:                                              │
│    IPv4: dhcp → static 192.168.132.10/24                   │
│    DNS:  no change                                         │
│    IPv6: no change                                         │
│                                                            │
│  This will modify Windows network settings.                │
│  A rollback snapshot will be captured first.               │
│                                                            │
│         [ Cancel ]              [ Apply ]                  │
└────────────────────────────────────────────────────────────┘
```

Default focus is on Cancel. Enter does NOT submit; the user must click or tab-then-space.

### Save profile modal

```
┌─ Save profile ────────────────────────────────────────────┐
│  Name: [                                          ]       │
│  Description (optional): [                        ]       │
│                                                            │
│  Capture preferred adapter? (☑ default)                   │
│    Captures MAC, GUID, description for future matching.    │
│    Uncheck for a globally-applicable profile.             │
│                                                            │
│         [ Cancel ]              [ Save ]                   │
└────────────────────────────────────────────────────────────┘
```

## Auto-apply toggle (ADR-0008)

- **Default:** OFF.
- **Position:** title bar, visible at all times.
- **Reset on launch:** every app start begins with auto-apply off, regardless of last session.

When auto-apply is ON:

- Field edits are validated live.
- When the whole form has been valid for **≥ 1500 ms** of no typing, the apply pipeline auto-runs (snapshot → apply → verify).
- The visible state machine cycles through `pending → applying → applied | rolled-back`.
- A failed auto-apply does not retry. It surfaces an error and waits for the user.

When auto-apply is OFF:

- Field edits update the "Pending change plan" panel live.
- Nothing mutates until the user clicks "Apply."

## Error surfacing

All errors render in the status bar with a short tag and a "More" link that opens a detail pane:

- `validation: invalid IPv4 address` — field rejected before any provider call.
- `match: ambiguous` — profile resolves to multiple adapters; refuses (ADR-0006).
- `admin: required` — `--real` GUI launched without elevation.
- `provider: powershell exit 1` — real provider failed.
- `verify: state did not match plan; rolled back` — apply succeeded but verify failed.

## What the GUI does NOT do

- Does not display a system tray icon. v1 is a foreground app only.
- Does not auto-launch on Windows startup.
- Does not write to the registry.
- Does not call `Rename-NetAdapter`. The app alias is internal.
- Does not have an "advanced" or "expert" mode. Everything is on screen.
- Does not show CLI commands or PowerShell equivalents inline (could be a teaching v2 feature).
