# Safety Spec — WinNetPro v1

This spec collects the full mutation-safety model. It is intentionally separate from CLI/GUI specs so the invariants do not get diluted by surface details. Every mutation path in WinNetPro must satisfy every section here.

## Invariants

1. **No mutation without `--real`.** The PowerShell provider activates *only* when `--real` is explicitly passed. Default is the fake provider.
2. **No mutation without a dry-run pass.** Every `ApplyProfile` use case calls `BuildDryRunPlan` and `ValidateChangePlan` before any provider mutation.
3. **No mutation without a snapshot.** A rollback snapshot is captured immediately before any real mutation.
4. **No mutation without admin.** `--real` write paths verify the process is elevated. Refuses with exit 5 otherwise.
5. **No mutation without confirmation.** Real mutation requires either an interactive TTY confirmation or `--yes`.
6. **No ambiguous adapter mutation.** A profile must resolve to exactly one adapter. Multi-match aborts with exit 3.
7. **No silent DNS modification.** v1 only allows `dns.mode = "inherit"`, which is "no DNS change." DNS is never mutated as a side effect.
8. **No partial-state left behind.** A failed apply auto-rollbacks from snapshot. If rollback also fails, exit 7 surfaces a "may be in inconsistent state" diagnostic.

## Apply pipeline (canonical sequence)

Every `profiles apply`, `set-static`, `set-dhcp` follows this exact order:

```
1. RESOLVE   Profile + adapter ID → ChangePlan candidate.
2. MATCH     Run matching algorithm (ADR-0006). Abort if ambiguous or mismatch.
3. BUILD     Construct full ChangePlan with from/to deltas.
4. VALIDATE  Run domain validation on ChangePlan. Abort with exit 3 on failure.
5. SHOW      Print ChangePlan (this IS the dry-run output).
6. GATE      If --dry-run: STOP HERE with exit 0.
7. ELEVATE   If --real: verify process is admin. Abort with exit 5 otherwise.
8. CONFIRM   If --real: prompt unless --yes.
9. SNAPSHOT  Capture current adapter state to ./snapshots/<id>-<ts>.json.
10. APPLY    Provider executes the mutation.
11. VERIFY   Re-read adapter; compare to ChangePlan.to.
12. RESULT   On match: ApplyResult { outcome: "applied" }.
             On mismatch: ROLLBACK.
```

### Rollback sub-flow (steps 12-rollback)

```
R1. RESTORE  Apply Snapshot → adapter via provider.
R2. RE-VERIFY  Re-read adapter; compare to Snapshot.
R3. RESULT
    R3a. Restore matched: ApplyResult { outcome: "rolled-back" }, exit 6.
    R3b. Restore did not match snapshot: ApplyResult { outcome: "rollback-failed" }, exit 7.
```

Exit 7 is the highest-severity exit. The diagnostic message must:

- State the adapter ID and current observed state.
- State the snapshot ID and intended state.
- Tell the user "the adapter may be in an inconsistent state; manual intervention required."
- Print a concrete suggested PowerShell command to manually inspect the adapter.

## Admin detection

On Windows, the process is elevated if `IsUserAnAdmin()` returns true. We approximate this via:

- Node SEA binary: attempt to read `HKLM\SYSTEM\CurrentControlSet\Services\winnetpro-admin-check` (a probe path); if access is denied with a recognizable error, treat as not-elevated. Concretely, the implementation may use the `is-admin` npm package or a vendored equivalent; the test surface is the same.
- Detection happens at step 7 of the apply pipeline, just before the snapshot.

## Confirmation prompts

When `--real` is set and `--yes` is not:

- The CLI prints the full ChangePlan, then `Proceed? [y/N]`.
- Default is **N**. Only `y` or `Y` proceeds.
- Any other input — including empty/Enter — aborts with exit 0 (user cancelled, not an error).

## Auto-apply (GUI only; ADR-0008)

When auto-apply is enabled:

- The pipeline still runs steps 1–12 unmodified.
- Step 8 (CONFIRM) is satisfied by the toggle being explicitly on; no per-change dialog.
- Debounce ≥ 1500 ms before triggering apply on a valid form.
- A failed auto-apply surfaces the error in the status bar and does not auto-retry.

Auto-apply does **not** exist in the CLI. CLI mutation is always per-command.

## DNS handling

- `dns.mode = "inherit"` is the only v1 value. Meaning: "do not modify DNS." The provider receives no DNS instructions.
- `dns.mode = "dhcp"` and `dns.mode = "static"` are reserved for v2.
- The CLI does **not** allow `--dns` flags in v1. Adding them is a spec change.

## What this spec deliberately does NOT promise

- **Connectivity verification after apply.** v1 verifies adapter *configuration* matches the plan. It does not ping anything. A future connectivity probe is described in ADR-0004 "Neutral" notes.
- **Multi-adapter atomic apply.** Each apply targets one adapter. Applying the same profile to multiple adapters is multiple commands.
- **Per-snapshot retention policy beyond "most recent."** Default keeps one snapshot per adapter; `--keep-history` opts into more. No automated cleanup of `--keep-history` snapshots — user manages disk.
- **VPN-aware safety.** WinNetPro does not detect VPN clients. If applying a profile drops the VPN, that's the user's responsibility to recover from.
- **EDR/MDM-aware safety.** WinNetPro is designed to *not* trigger EDR by being default-safe (fake provider, no DNS changes, no adapter renames). It does not actively negotiate with EDR systems.

## Trust ladder for an audience watching a demo

In ascending order of trust the audience extends:

1. They see the CLI print a dry-run plan in JSON. They can read it.
2. They see the FakeProvider apply succeed against fixtures. They believe the *code* is correct.
3. They watch `--real --yes --dry-run` against their own machine. They see what *would* happen on their hardware.
4. They run `--real --yes` against an adapter they don't depend on for connectivity. They see the actual mutation succeed.
5. They run it on their primary adapter and trust the rollback to save them if it goes wrong.

The audience should never be asked to skip to step 5. Each demo session lands at step 2 or 3 unless explicitly arranged otherwise.
