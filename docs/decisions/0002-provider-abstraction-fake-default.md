# ADR-0002: Provider abstraction; fake provider is the default, `--real` opts into Windows mutation

- **Status:** Accepted
- **Date:** 2026-05-19
- **Decider:** Mike (architectural call); Claude Code (implementer)

## Context

WinNetPro mutates Windows network settings. That is a privileged, potentially disruptive operation. We have three constraints pulling in different directions:

1. **The audience will run the .exe on their own laptops** during a demo. Some of those are corporate-managed. We cannot have the default behavior change DNS, drop the user off the corporate VPN, or trigger EDR alerts.
2. **Tests must run on developer machines** (not just Windows VMs), in CI, and against fixtures. Real PowerShell calls fail or hang in those contexts.
3. **The agent must be able to build and verify the product without an admin shell.** Otherwise the live demo grinds to a halt the first time it needs to actually run something.

We need a single substitution point that swaps "talk to Windows" for "talk to a fixture."

## Decision

**There is one `NetworkProvider` port. Two concrete adapters implement it:**

- `FakeProvider` — reads adapter state from a JSON fixture, records intended mutations to an in-memory log, never touches the OS. This is the **default** wired into the CLI and the GUI.
- `PowerShellProvider` — shells out to PowerShell cmdlets (`Get-NetAdapter`, `New-NetIPAddress`, `Set-DnsClientServerAddress`, etc.) and parses JSON output. **Only activated when the user passes `--real`.**

The CLI argument plumbing:

```
winnetpro adapters list                       # FakeProvider (default)
winnetpro adapters list --real                # PowerShellProvider
winnetpro profiles apply --profile X          # dry-run by default if non-TTY; FakeProvider
winnetpro profiles apply --profile X --real --yes   # PowerShellProvider, real mutation
```

`--real` is the **only** way to reach the PowerShell provider. There is no environment variable, no config setting, no "remember last choice." It must be typed every time.

When `--real` is passed:

1. The CLI verifies the process is elevated (admin). If not, it exits with a clear error.
2. The change plan is printed and confirmation is required unless `--yes` is also passed.
3. A rollback snapshot is captured before any mutation (see ADR-0004).

## Consequences

**Positive**

- Default behavior is safe on any machine, including corporate laptops.
- Tests, BDD evals, and CI all run against the fake provider — no Windows VM needed for green builds.
- The fake provider's fixture files are themselves a teaching artifact: the audience can read them and see exactly what adapters the demo "sees."
- One word in the docs ("default") and one flag (`--real`) carry the entire safety story. Easy to explain to an audience.

**Negative**

- We maintain two provider implementations. Every new use case must work on both. Acceptable cost.
- `PowerShellProvider` is harder to test deterministically. We test it manually in a Windows VM; we do not gate CI on it.

**Neutral**

- A future `NetshProvider` is possible but not built. The port is shaped to allow it.
- The fake provider's fixture format becomes a public-ish surface (the audience reads them). It is specified in `docs/specs/profile-schema.md` alongside profiles.
