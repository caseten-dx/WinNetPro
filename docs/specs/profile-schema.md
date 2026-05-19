# Profile Schema — WinNetPro v1

All persistent data and all inter-layer data structures in WinNetPro are specified here. The agent should treat this as the canonical type definition; TypeScript types in `src/domain/` mirror these shapes.

## On-disk files (under CWD; ADR-0003)

```
./profiles.json           # array of Profile
./snapshots/              # one JSON file per Snapshot
   ad-001-2026-05-19T12-00-00Z.json
   ad-002-2026-05-19T13-15-22Z.json
./fixtures/               # FakeProvider input (demo + dev contexts)
   adapters.json          # array of Adapter — what the FakeProvider "sees"
./logs/winnetpro.log      # operational log
```

## `Adapter`

What the provider returns. Identical shape from `FakeProvider` and `PowerShellProvider`.

```json
{
  "id": "ad-002",
  "interfaceGuid": "{a1b2c3d4-1234-5678-9abc-def012345678}",
  "windowsAlias": "Ethernet 5",
  "description": "USB 10/100/1000 LAN",
  "macAddress": "00-11-22-33-44-55",
  "appAlias": "Dock Radio",
  "linkState": "up",

  "ipv4": {
    "mode": "static",
    "address": "192.168.132.10",
    "prefixLength": 24,
    "gateway": null,
    "dns": { "servers": [] }
  },

  "ipv6": {
    "mode": "auto",
    "addresses": [
      { "address": "fe80::a1b2:c3d4:e5f6:0001", "prefixLength": 64, "kind": "link-local" }
    ],
    "gateway": null,
    "dns": { "servers": [] }
  },

  "lastAppliedProfileId": "profile-dock-132"
}
```

Field notes:

- `id` is WinNetPro-internal, stable across runs. Constructed from `interfaceGuid` if available, else `macAddress`.
- `appAlias` is read from a per-CWD `adapters.json` overlay (TBD location; v1 puts it under the profile's `preferredAdapter` instead — simpler).
- `linkState`: `"up" | "down" | "disconnected" | "unknown"`.
- `ipv4.mode`: `"static" | "dhcp"`.
- `ipv4.dns.servers`: array of strings. Empty array = inherit-from-DHCP.
- `ipv6.mode`: `"static" | "auto" | "disabled" | "unknown"`. v1 reads but does not mutate.
- `lastAppliedProfileId` is best-effort, written by WinNetPro into a local annotations file; provider does not source it.

## `Profile`

```json
{
  "id": "profile-dock-132",
  "name": "DOCK 132",
  "description": "Static profile for dock radio 132",
  "createdAt": "2026-05-19T12:00:00.000Z",
  "updatedAt": "2026-05-19T12:00:00.000Z",

  "preferredAdapter": {
    "macAddress": "00-11-22-33-44-55",
    "interfaceGuid": "{a1b2c3d4-1234-5678-9abc-def012345678}",
    "interfaceDescription": "USB 10/100/1000 LAN",
    "windowsAliasAtSaveTime": "Ethernet 5"
  },

  "ipv4": {
    "mode": "static",
    "address": "192.168.132.10",
    "prefixLength": 24,
    "gateway": null,
    "dns": { "mode": "inherit", "servers": [] }
  },

  "ipv6": {
    "mode": "inherit"
  },

  "rollback": {
    "enabled": true
  }
}
```

Field notes:

- `id` is `profile-<slug-of-name>` at creation; immutable after that. `name` may change; `id` does not.
- `preferredAdapter` is **optional**. Absent = global profile.
- `preferredAdapter.macAddress` and `preferredAdapter.interfaceGuid` are the primary match keys (ADR-0006).
- `preferredAdapter.windowsAliasAtSaveTime` is recorded for human readability and as the lowest-confidence match key.
- `ipv4.dns.mode`: `"inherit" | "dhcp" | "static"`. v1 only allows `"inherit"`.
- `ipv6.mode` in profiles: v1 only allows `"inherit"`. Schema reserves `"auto" | "static" | "disabled"` for v2+ (ADR-0005).
- `rollback.enabled: true` is the v1 default; the field is present so v2 can add `probe` config without re-shaping.

### DHCP profile example

```json
{
  "id": "profile-office-dhcp",
  "name": "Office DHCP",
  "createdAt": "2026-05-19T12:00:00.000Z",
  "updatedAt": "2026-05-19T12:00:00.000Z",
  "ipv4": {
    "mode": "dhcp",
    "address": null,
    "prefixLength": null,
    "gateway": null,
    "dns": { "mode": "inherit", "servers": [] }
  },
  "ipv6": { "mode": "inherit" },
  "rollback": { "enabled": true }
}
```

Note the absence of `preferredAdapter` — global profile.

## `ChangePlan`

What `BuildDryRunPlan` produces. The audience sees this in `--json` and `--dry-run` output.

```json
{
  "kind": "ChangePlan",
  "createdAt": "2026-05-19T12:00:00.000Z",
  "sourceProfileId": "profile-dock-132",
  "targetAdapterId": "ad-002",

  "match": {
    "confidence": "exact",
    "criteria": ["interfaceGuid"]
  },

  "ipv4": {
    "from": {
      "mode": "dhcp",
      "address": "192.168.1.42",
      "prefixLength": 24,
      "gateway": "192.168.1.1"
    },
    "to": {
      "mode": "static",
      "address": "192.168.132.10",
      "prefixLength": 24,
      "gateway": null
    },
    "willChange": true
  },

  "dns": {
    "from": ["192.168.1.1"],
    "to": ["192.168.1.1"],
    "willChange": false,
    "reason": "profile DNS mode is inherit"
  },

  "ipv6": {
    "willChange": false,
    "reason": "v1 does not mutate IPv6"
  },

  "rollback": {
    "snapshotWillBeCreated": true,
    "snapshotPath": "./snapshots/ad-002-2026-05-19T12-00-00Z.json"
  }
}
```

Field notes:

- `match.confidence`: `"exact" | "mac" | "description" | "alias" | "global"`. Used by the GUI to colour the confirmation dialog.
- `willChange` flags exist per section so the user/agent can quickly see which sections are no-ops.
- `rollback.snapshotPath` is the *intended* path; the actual path is set only after the snapshot is captured.

## `Snapshot`

```json
{
  "kind": "Snapshot",
  "id": "snap-ad-002-2026-05-19T12-00-00Z",
  "capturedAt": "2026-05-19T12:00:00.000Z",
  "adapterId": "ad-002",

  "ipv4": {
    "mode": "dhcp",
    "address": "192.168.1.42",
    "prefixLength": 24,
    "gateway": "192.168.1.1",
    "dns": { "servers": ["192.168.1.1"] }
  },

  "ipv6": {
    "mode": "auto",
    "addresses": [
      { "address": "fe80::a1b2:c3d4:e5f6:0001", "prefixLength": 64, "kind": "link-local" }
    ],
    "gateway": null,
    "dns": { "servers": [] }
  }
}
```

Snapshots are written to `./snapshots/<adapterId>-<isoTimestamp>.json`. The most recent per adapter is retained by default; older overwrite. `--keep-history` opts into retaining all.

## `ApplyResult`

What the apply pipeline emits at the end.

```json
{
  "kind": "ApplyResult",
  "planId": "<changeplan-uuid>",
  "outcome": "applied",
  "snapshotId": "snap-ad-002-2026-05-19T12-00-00Z",
  "elapsedMs": 412,
  "providerKind": "fake",
  "verify": {
    "matched": true,
    "diff": null
  }
}
```

`outcome`: `"applied" | "dry-run" | "validation-failed" | "match-ambiguous" | "admin-required" | "provider-error" | "rolled-back" | "rollback-failed"`. Each maps to a CLI exit code per `cli-spec.md`.

`providerKind`: `"fake" | "powershell"`.

## Validation rules (enforced in domain layer)

- `Profile.name` non-empty, ≤ 64 chars, no leading/trailing whitespace.
- `ipv4.address` matches RFC 791 IPv4 dotted-quad; rejects `0.0.0.0`, `255.255.255.255`, and `127.0.0.0/8` except for explicit test fixtures.
- `ipv4.prefixLength` integer in `[0, 32]`. `0` and `32` accepted but logged as unusual.
- `ipv4.gateway`, if present, must be valid IPv4 and not equal to `ipv4.address`. **Warning** (not error) if gateway is not in the same subnet as address+prefix.
- `ipv4.mode = "dhcp"` implies `address`, `prefixLength`, `gateway` all null. Any non-null with DHCP is a validation error.
- `dns.servers` entries must each be valid IPv4 (v1) or IPv6 (always allowed even in IPv4-only v1, since DNS server addresses are independent of the protocol they resolve names for).
- `ipv6.mode = "inherit"` is the only value valid in v1 profiles.
- `Profile.preferredAdapter.macAddress`, if present, must match `XX-XX-XX-XX-XX-XX` format (uppercase hex, dash-separated).
