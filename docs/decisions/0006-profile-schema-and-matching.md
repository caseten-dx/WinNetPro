# ADR-0006: Profile schema with adapter-preferred matching plus global reusability

- **Status:** Accepted
- **Date:** 2026-05-19
- **Decider:** Mike (architectural call); Claude Code (implementer)

## Context

A profile is a saved configuration that the user wants to reapply later. Two distinct user workflows must both work:

1. **The radio plug-in story.** User plugs in a USB Ethernet radio. The adapter appears as "Ethernet 5" (or "Ethernet 7" next time — Windows reuses numbers freely). User configures static IP, saves profile "DOCK 132." Next time *this same physical device* is connected, the user wants "DOCK 132" to be obviously the right profile to apply.

2. **The shared configuration story.** User has profile "Office DHCP" that should be applicable to any adapter the user picks — laptop's built-in Ethernet, a docking station's port, a USB dongle.

Workflow 1 needs adapter identity to survive Windows renumbering and reboots. Workflow 2 needs the profile to be applicable across adapters without re-saving.

A naïve profile shape stores only `interfaceName: "Ethernet 5"`. That breaks both workflows the first time Windows assigns a different number.

## Decision

**Profiles are global by storage and adapter-preferred by intent.** Concretely:

```json
{
  "id": "profile-dock-132",
  "name": "DOCK 132",
  "description": "Static profile for dock radio 132",
  "createdAt": "2026-05-19T12:00:00Z",
  "updatedAt": "2026-05-19T12:00:00Z",

  "preferredAdapter": {
    "macAddress": "00-11-22-33-44-55",
    "interfaceGuid": "{a1b2c3d4-...}",
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

  "ipv6": { "mode": "inherit" }
}
```

`preferredAdapter` is **optional**. A profile saved without it is "global" — applicable to any adapter the user selects.

### Matching algorithm

When applying profile P to adapter A:

1. If P has no `preferredAdapter`, the match is **global** — allowed, but the CLI prints "applying global profile to adapter X" and the GUI shows a confirmation.
2. If P has `preferredAdapter.interfaceGuid` and A's GUID matches, the match is **exact**.
3. Else if P has `preferredAdapter.macAddress` and A's MAC matches, the match is **MAC-confident**.
4. Else if P has `preferredAdapter.interfaceDescription` and A's description matches, the match is **description-likely** (warning).
5. Else if P has `preferredAdapter.windowsAliasAtSaveTime` and A's current alias matches, the match is **alias-only** (warning, plus confirmation required even with `--yes`).
6. Else the match is **mismatch** — refused.

### GUI dropdowns

The GUI shows two dropdowns per adapter row:

- **Adapter profiles** — filtered to profiles whose `preferredAdapter` matches this adapter (categories 2–5).
- **All profiles** — every profile. Selecting one from this dropdown when it does not match this adapter triggers the confirmation.

### Internal alias

The user-editable alias ("Dock Radio") is **internal to WinNetPro**, stored on the profile (or on a per-adapter local entry — TBD in spec) as `appAlias`. It is **never** written to Windows. We do not call `Rename-NetAdapter`. Avoiding adapter renames sidesteps corporate-MDM friction and admin requirements for renames.

## Consequences

**Positive**

- The radio plug-in workflow works across Windows renumbering: MAC and GUID survive.
- The global-profile workflow works without sacrificing adapter-preferred matching.
- Ambiguity (description-only or alias-only matches) surfaces as warnings or confirmations, never silent application — satisfies the "no ambiguous adapter mutation" invariant.
- The alias decision keeps the tool safe on managed corporate machines.

**Negative**

- Five-category match algorithm is more complex than a string compare. Worth it; the BDDs cover each category.
- Profile JSON has nullable optional fields. Validation must distinguish "missing" from "null" cleanly.

**Neutral**

- Future: per-adapter `appAlias` (separate from profile) is captured in a separate local file (`./adapters.json`) at the schema's discretion. Decision deferred to the spec.
