# ADR-0004: Dry-run before mutation; snapshot before write; auto-rollback on failure

- **Status:** Accepted
- **Date:** 2026-05-19
- **Decider:** Mike (architectural call); Claude Code (implementer)

## Context

Changing a network adapter's IP configuration can disconnect the machine from the network it just used to receive the command, drop the user off a VPN, break a remote-desktop session, or silently fail leaving the adapter in an inconsistent state. The audience for a demo may include people running the `.exe` on machines they cannot afford to disconnect.

Three risks need explicit mitigation:

1. **The user (or agent) intends to apply profile X but the resolved change plan is not what they expected** — e.g., profile X was edited by someone else, or the wrong adapter was matched.
2. **The apply succeeds halfway** — IPv4 address sets, then DNS modification fails, leaving the adapter with the new IP and the old DNS.
3. **The apply succeeds but breaks connectivity** — the new static IP is wrong for this network, and the user is now stranded.

We need a layered defense.

## Decision

Every mutating use case follows this sequence, with no shortcuts:

```
1. BUILD     Construct a ChangePlan from (target adapter, source profile, current state).
2. VALIDATE  Run domain-level validation on the ChangePlan. Reject invalid plans.
3. SHOW      Print the ChangePlan as JSON or formatted text. This is the dry-run output.
4. GATE      If not in dry-run mode, require explicit user confirmation (interactive or --yes).
5. SNAPSHOT  Capture the current adapter configuration to a SnapshotStore entry.
6. APPLY     Execute the plan via the provider.
7. VERIFY    Re-read the adapter state and confirm it matches the plan.
8. ROLLBACK  If apply or verify fails, restore from snapshot and exit non-zero with full context.
```

The CLI defaults:

- `--dry-run` is the default when **stdin is not a TTY** (so scripts and BDD evals never mutate).
- `--dry-run` can be passed explicitly in any context.
- Real mutation requires the user to be on a TTY *or* to pass `--yes`.
- Real mutation also requires `--real` (per ADR-0002).

The GUI defaults:

- "Apply" button always shows the dry-run plan in a confirmation dialog before mutation.
- Auto-apply (when enabled per ADR-0008) still runs steps 1–8 with the same gates, just without the interactive dialog.

Rollback snapshots are stored under `./snapshots/` (per ADR-0003). One snapshot per adapter is retained by default; older snapshots overwrite. `--keep-history` opts into retaining the full series.

## Consequences

**Positive**

- The audience always sees the change plan before any change happens. This is the inspectability invariant in concrete form.
- A failed apply does not leave the machine in a broken state; auto-rollback restores it.
- BDD evals run against dry-run output naturally — the dry-run JSON *is* the eval target.
- The two flags `--real` (ADR-0002) and `--yes` together guard real mutation. Either alone is insufficient.

**Negative**

- Every mutating use case is more code than it would otherwise need. Acceptable — this is the load-bearing safety surface.
- Snapshot capture adds a step on every real apply. Latency cost is negligible (a single `Get-NetIPConfiguration` JSON read).

**Neutral**

- Rollback semantics for **partial** applies — when step 6 fails after some sub-changes succeeded — are: "restore the full snapshot, do not attempt selective undo." This is simpler and safer. Documented in `docs/specs/safety-spec.md`.
- Connectivity-based rollback (apply, ping target, restore on ping failure) is **not** in v1. It's mentioned in the safety spec as a future opt-in probe.
