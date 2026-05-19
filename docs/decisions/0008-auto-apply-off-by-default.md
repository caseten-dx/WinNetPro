# ADR-0008: Auto-apply on edit is off by default; opt-in with debounce, validation, and rollback

- **Status:** Accepted
- **Date:** 2026-05-19
- **Decider:** Mike (architectural call); Claude Code (implementer)

## Context

The original product brief asked for **auto-apply** in the GUI: as the user edits a field (IP address, prefix length, gateway), the change applies live. This is convenient for the radio-dock workflow — type the IP, see the device respond.

But it is dangerous. Consider what a user types while editing an IP address field:

```
1
19
192
192.
192.1
192.16
192.168
192.168.
192.168.1
192.168.13
192.168.132
192.168.132.
192.168.132.1
192.168.132.10
```

A naïve auto-apply mutates the adapter on every keystroke. Most of those intermediate states are invalid or wildly wrong. Even the "intermediate-valid" ones (`192.168.13` parses as a number but it's not the user's target) can disconnect the machine from the network.

There is a second concern: corporate-managed laptops. We do not want a tool that silently mutates network state every time the user clicks a field. That is the kind of behavior EDR and MDM systems flag.

## Decision

**Auto-apply is OFF by default. The GUI ships with a visible toggle that the user must explicitly enable per session.**

When auto-apply is OFF (default):

- Field edits are validated live (red/green indicators).
- A "pending change plan" is shown as the user edits.
- Mutation happens only when the user clicks **Apply**, with the same dry-run-then-confirm flow as the CLI.

When auto-apply is ON (explicit user opt-in):

1. **Debounce.** No apply attempt until the user has paused typing for ≥ 1500 ms.
2. **Whole-form validation.** Apply only fires when the entire form is valid (all required fields parseable, no domain validation errors).
3. **Snapshot first.** Before each apply, capture a rollback snapshot (per ADR-0004).
4. **Visible state machine.** The GUI shows `idle → pending → applying → applied | failed | rolled-back` so the user always knows what just happened.
5. **No silent retries.** A failed apply auto-rollbacks and surfaces an error; it does not silently retry.
6. **Toggle resets on app restart.** Auto-apply does not persist across sessions. Each launch starts with auto-apply off.

CLI has no auto-apply concept. The CLI is a discrete-command surface; this is a GUI-only feature.

## Consequences

**Positive**

- Default behavior is safe on any machine.
- The user who *wants* auto-apply for a hands-on field session can enable it, accept the implied risk, and rely on rollback when things go wrong.
- The toggle's per-session reset prevents "I forgot it was on" surprise mutations next time the user opens the app.
- BDD scenarios for auto-apply (`docs/bdd/auto-apply-safety.feature`) can exercise the debounce, validation, and rollback behavior against the fake provider.

**Negative**

- The default-off behavior is less "magical" than always-on auto-apply. The radio-dock workflow requires one extra click. Acceptable for the safety win.
- Two GUI code paths (auto-on, auto-off). Both must be tested.

**Neutral**

- Future: a `--persist-auto-apply` config setting could be considered, but only after we have evidence from real demos that the per-session reset is annoying enough to warrant it. Default position: do not add it.
