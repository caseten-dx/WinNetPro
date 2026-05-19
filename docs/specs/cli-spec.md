# CLI Spec — WinNetPro v1

The CLI is the **canonical surface**. The GUI calls the same use cases the CLI does. BDD evals run against the CLI.

## Binary

`WinNetPro-CLI-demo-NNN.exe` (Node SEA, single file, no dependencies on installed Node).

## Global flags

| Flag | Effect |
|---|---|
| `--real` | Use `PowerShellProvider` instead of `FakeProvider`. Required for any actual Windows mutation. |
| `--dry-run` | Force dry-run mode. Auto-applied when stdin is not a TTY. |
| `--yes` | Skip interactive confirmation for mutating commands. Real mutation still requires `--real`. |
| `--json` | Emit JSON instead of human-readable tables. |
| `--config-dir <path>` | Override the CWD as the location for `profiles.json` and `snapshots/`. |
| `--fixture-dir <path>` | When using FakeProvider, read fixtures from this directory instead of `./fixtures/`. |
| `--help` | Print help for the command. |
| `--version` | Print version + demo number. |

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success. |
| 1 | Generic failure with diagnostic on stderr. |
| 2 | Invalid CLI arguments. |
| 3 | Validation failed (invalid IP, prefix out of range, ambiguous adapter match). |
| 4 | Provider error (PowerShell failed, fixture missing). |
| 5 | Mutation refused — admin required for `--real` but process is not elevated. |
| 6 | Mutation rolled back after failed apply; original state restored. |
| 7 | Mutation failed AND rollback failed. Highest-severity exit; adapter may be in inconsistent state. |

## Commands

### `adapters list`

List all network adapters with summary fields.

```
WinNetPro-CLI.exe adapters list [--json] [--real]
```

Default output (table):

```
ID          ALIAS         MAC                 IPv4              MODE     LINK
ad-001      Ethernet      00-50-56-AA-BB-CC   192.168.1.42/24   dhcp     up
ad-002      Ethernet 5    00-11-22-33-44-55   192.168.132.10/24 static   up
ad-003      Wi-Fi         A0-B1-C2-D3-E4-F5   10.0.0.7/24       dhcp     up
```

`--json` output: an array of adapter objects per `profile-schema.md` adapter shape.

### `adapters show`

Show full detail for a single adapter.

```
WinNetPro-CLI.exe adapters show --id <adapter-id> [--json] [--real]
```

Output includes IPv4 config, IPv6 summary (read-only), MAC, GUID, description, current alias, app alias (if any), link state, last applied profile (if known).

### `profiles list`

```
WinNetPro-CLI.exe profiles list [--json]
```

Lists all saved profiles. Each entry shows name, IPv4 summary, preferredAdapter MAC (if any), createdAt.

### `profiles save`

Save a profile from an adapter's current state, or from explicit values.

```
WinNetPro-CLI.exe profiles save \
  --name "<profile name>" \
  [--from-adapter <adapter-id>] \
  [--ipv4-mode static|dhcp] \
  [--ipv4-address <IP>] \
  [--ipv4-prefix <0-32>] \
  [--ipv4-gateway <IP>] \
  [--global]               # do NOT capture preferredAdapter
  [--description "<text>"] \
  [--real]                 # if --from-adapter, read real state via PowerShell
```

Exit codes: 0 on success, 2 on invalid args, 3 on validation failure (e.g., conflicting flags, invalid IP).

### `profiles apply`

Apply a saved profile to an adapter.

```
WinNetPro-CLI.exe profiles apply \
  --profile "<name>" \
  --adapter <adapter-id> \
  [--dry-run]              # default if non-TTY
  [--real]                 # required for actual mutation
  [--yes]                  # skip confirmation
  [--json]                 # emit change plan + result as JSON
```

Behavior follows ADR-0004 sequence:

1. Build `ChangePlan` from profile + current adapter state.
2. Validate plan; abort with exit 3 on validation failure.
3. Print plan (always, even in dry-run; this *is* the dry-run output).
4. If not dry-run: require confirmation unless `--yes`.
5. If `--real`: verify admin; abort with exit 5 if not elevated.
6. Capture snapshot to `./snapshots/<adapter-id>-<timestamp>.json`.
7. Apply via provider.
8. Verify by re-reading adapter; on mismatch, rollback (exit 6) or escalate (exit 7).

### `profiles delete`

```
WinNetPro-CLI.exe profiles delete --name "<profile name>" [--yes]
```

### `set-static`

Shortcut for "apply a one-off static IPv4 configuration without saving a profile."

```
WinNetPro-CLI.exe set-static \
  --adapter <adapter-id> \
  --ip <IP> \
  --prefix <0-32> \
  [--gateway <IP>] \
  [--dry-run] [--real] [--yes] [--json]
```

Internally constructs an unsaved Profile and runs the apply pipeline.

### `set-dhcp`

```
WinNetPro-CLI.exe set-dhcp --adapter <adapter-id> [--dry-run] [--real] [--yes] [--json]
```

### `rollback`

Manually restore from a snapshot.

```
WinNetPro-CLI.exe rollback --snapshot <snapshot-id> [--real] [--yes] [--json]
```

### `snapshots list`

```
WinNetPro-CLI.exe snapshots list [--json]
```

## Output shapes (JSON)

All `--json` outputs conform to schemas in `profile-schema.md`. Specifically:

- `adapters list --json` → `{ "adapters": Adapter[] }`
- `adapters show --json` → `{ "adapter": Adapter }`
- `profiles list --json` → `{ "profiles": Profile[] }`
- `profiles apply --json` → `{ "plan": ChangePlan, "result": ApplyResult }`

`ChangePlan`, `Adapter`, `Profile`, `ApplyResult` are all defined in `profile-schema.md`.

## Confirmation prompts

When real mutation is required and `--yes` is not passed:

```
About to apply profile "DOCK 132" to adapter "Ethernet 5" (MAC 00-11-22-33-44-55).

Change plan:
  IPv4: dhcp → static 192.168.132.10/24 (gateway: none)
  DNS:  inherit (no change)
  IPv6: inherit (no change)

This will modify Windows network settings.
A rollback snapshot will be captured first.

Proceed? [y/N]
```

Default is **N**. Any input other than `y` or `Y` aborts with exit 0 (user cancelled, not an error).

## What the CLI does NOT do

- Does not auto-detect "best profile" for a newly plugged-in adapter. The user must pick.
- Does not check connectivity after applying. Optional probe deferred.
- Does not write to the registry.
- Does not modify firewall rules.
- Does not modify proxy settings.
- Does not rename Windows adapters. (ADR-0006: alias is internal.)
