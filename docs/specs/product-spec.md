# Product Spec — WinNetPro v1

## What WinNetPro is

WinNetPro is a Windows network-interface profile manager. It lists adapters, edits IPv4 settings, saves named profiles, and reapplies those profiles when devices are reconnected. It ships as a single unsigned `.exe` (CLI), with an optional second `.exe` (GUI) layered over the same application services.

The product is real and useful. The deeper purpose is to demonstrate **agentic engineering**: building software from specifications by directing an AI coding agent, with the resulting code inspectable by the audience.

## Who it is for

The user-facing audience is **field engineers and operators** working with networked equipment — radios, PLCs, dock stations, embedded test gear — who frequently need to configure static IPv4 settings on adapter-by-adapter basis.

The teaching audience is **engineers learning agentic development workflows**: how to drive an agent with BDDs, ADRs, and specs; how to ensure inspectable Red/Green TDD; how to verify with BDD-derived evals.

## v1 scope

### In

- **List adapters.** Show all network adapters with current IPv4 address, prefix, gateway, DNS, mode (DHCP/static), and link state.
- **Show adapter detail.** Full read of one adapter's IPv4 + IPv6 state, MAC, GUID, description, alias.
- **Save profile.** Persist a profile derived from an adapter's current state, or constructed manually, to local JSON storage.
- **List profiles.** Show all saved profiles with summary fields.
- **Apply profile (dry-run).** Construct and print the change plan without mutating anything. Default mode in non-interactive contexts.
- **Apply profile (real).** Mutate the adapter behind explicit `--real` flag, after dry-run, confirmation, and snapshot.
- **Set DHCP.** Switch an adapter from static to DHCP IPv4.
- **Delete profile.** Remove a profile from storage.
- **Rollback.** Auto-restore from snapshot on failed apply; manual restore by snapshot ID.
- **GUI (separate `.exe`).** All of the above with point-and-click, auto-apply off by default.

### Out (deferred to v2+)

- IPv6 mutation (v1 reads/displays IPv6 but does not modify it — ADR-0005).
- Multiple IPv4 addresses per adapter.
- DHCPv6 configuration.
- Proxy management (was in original IP Shifter; out of scope here).
- LAN scanner.
- Public IP detection.
- Auto-detect-and-apply on adapter plug-in event.
- Code signing.
- Installer.
- A non-Windows port. (Mac/Linux providers could be added behind the same `NetworkProvider` port, but no use case demands it.)
- A Python sibling implementation. (May be added later for cross-language teaching comparison; not now.)

## Critical workflows

### Workflow A — Save a profile for a newly plugged-in device

1. User plugs a radio (USB Ethernet) into the laptop.
2. User runs `WinNetPro-CLI.exe adapters list --real`. New adapter appears.
3. User sets a static IP on the adapter: `WinNetPro-CLI.exe set-static --adapter <id> --ip 192.168.132.10 --prefix 24 --real --yes`.
4. User saves the current configuration: `WinNetPro-CLI.exe profiles save --adapter <id> --name "DOCK 132"`. Profile is written with `preferredAdapter` populated from the adapter's MAC and GUID.
5. Next time the same device is connected, the adapter shows up (possibly with a different Windows alias). The user runs `WinNetPro-CLI.exe profiles apply --profile "DOCK 132" --real --yes`. The matching algorithm (ADR-0006) finds the same physical device by MAC/GUID and applies the saved IPv4 settings.

### Workflow B — Switch between known networks

1. User has profiles "Office DHCP" and "Lab Static" saved.
2. At the office: `WinNetPro-CLI.exe profiles apply --profile "Office DHCP" --adapter <id> --real --yes`. Adapter switches to DHCP.
3. At the lab: `WinNetPro-CLI.exe profiles apply --profile "Lab Static" --adapter <id> --real --yes`. Adapter switches to the saved static config.

### Workflow C — GUI hands-on session

1. User opens `WinNetPro-GUI.exe` from a USB stick on a field laptop.
2. The GUI lists adapters. User picks the one connected to the radio.
3. User enables auto-apply (explicit toggle, off by default).
4. User edits IPv4 fields. Each valid debounced change applies live, with a rollback snapshot captured first.
5. When the configuration works, user clicks "Save profile" with a name. Profile is stored next to the `.exe`.

## Non-functional requirements

- **CLI .exe build time:** < 30 seconds via Node SEA. Demo-budget critical.
- **GUI .exe build time:** unconstrained; pre-built before demo if needed.
- **CLI startup time:** < 500 ms cold start on a modern Windows machine. Demo experience.
- **Footprint:** profiles and snapshots stored in CWD; no `%APPDATA%` writes, no registry writes.
- **Network exposure:** zero. WinNetPro makes no outbound network connections.
- **Crash safety:** any partial mutation rolls back via snapshot.
- **Localization:** US English only in v1.

## Provenance

This spec was scaffolded on 2026-05-19 from a two-message conversation with GPT-5.5 that researched the defunct IP Shifter utility and proposed a modern clone, plus six refinement decisions made by Mike before scaffolding. See `STATUS.md` 2026-05-19 entry.
