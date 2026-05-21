# Demo-002 spec overrides

Per ADR-0007, demo-local overrides to canonical specs live here. Each override states what `docs/specs/*` currently says, what this demo does instead, and the rationale. Overrides may be promoted to canonical at `/closeout` — only the closeout step is allowed to edit the canonical spec.

Both overrides on this page were proposed by the design hand-off ([`docs/research/demo-002-gui-design-handoff/README.md`](../../docs/research/demo-002-gui-design-handoff/README.md), §"Spec resolutions to land in `spec-overrides.md`") and §4c of the design brief ([`docs/research/demo-002-gui-design.md`](../../docs/research/demo-002-gui-design.md)).

---

## Override 1 — Drop the "All profiles" dropdown from the adapter detail panel

### Canonical (gui-spec.md §"Adapter detail panel")

> - **Adapter profiles dropdown** — profiles whose `preferredAdapter` matches this adapter (per ADR-0006 categories 2–5).
> - **All profiles dropdown** — every profile. Selecting one from here that does not match this adapter triggers a confirmation.

The detail panel as specified has two dropdowns: one filtered to the selected adapter, one global. Both live inline in the panel.

### Demo-002 deviation

**Keep** the per-adapter `Adapter Profiles` dropdown in the detail panel. It is a filtered view with distinct purpose — picking a profile already known to fit this adapter is the common-case click.

**Drop** the inline `All profiles` dropdown from the detail panel. The lower-left `Profiles` list (a sidebar in the design hand-off) becomes the single canonical view of every saved profile. Selecting a profile from that list populates the detail panel; if the profile's `preferredAdapter` does not match the currently-selected adapter, the existing confirmation behaviour fires there instead.

### Rationale

The gui-spec.md surface puts the same information in two places: the `All profiles` dropdown in the detail panel, and the `Profiles` list in the lower-left. NetSwitch (Codex's parallel implementation) ships both, faithfully — and the result reads as duplication on first glance. The design hand-off resolves it by making the Profiles list the canonical "every profile" view and removing the redundant dropdown. Saves vertical space in the detail panel, eliminates the "which one do I click?" ambiguity, and the cross-adapter confirmation invariant (ADR-0006) still holds because the Profiles list still triggers it on a non-matching selection.

### Promotion candidate

**Yes.** Recommend promoting at `/closeout` after the audience has reviewed the rendered GUI. No safety implication; pure UX clarity.

---

## Override 2 — Provider mode stays a launch flag in demo-002 (runtime toggle deferred)

### Canonical (gui-spec.md §"Title bar")

> Provider mode: "fixture provider" (default) or "real provider" — set at launch by `--real` flag passed to the GUI executable, no in-app toggle.

### Demo-002 deviation

**No deviation in this demo.** Provider mode in demo-002 is fixture-only, set at launch. There is no in-app toggle.

### Why this is here anyway

NetSwitch surfaces a runtime provider switcher in its title bar (Fake / Windows dropdown). That is a real UX improvement over the launch-flag model — more discoverable, lets the audience see the safety boundary cross in real time. The design hand-off's optional sixth frame (`06-demo003-preview-*.png`) shows the layout that *would* accommodate a runtime toggle, with the Safe Mode banner re-keyed to amber when `Real` is selected.

The toggle is **not** implemented in demo-002 because the gating model has not been finalized:

- Admin elevation detection (safety-spec invariant 4) lives in demo-003.
- The pre/post-state visualization when crossing the boundary needs design follow-up.
- The confirmation modal that protects the switch (so a stray click does not arm real mutations) is part of the demo-003 design surface.

Without those, a runtime toggle is a footgun.

### Promotion candidate

**Defer to demo-003.** This override exists to document the intent and the gating list; the canonical spec change waits until demo-003 ships the gating model and the visual frames hold up under it. At that point, gui-spec.md §"Title bar" updates to reflect a runtime toggle with mandatory gating, and this override is removed.

---

## What this file does NOT override

Everything else in `docs/specs/gui-spec.md` stands. In particular:

- The visible state machine (`idle / pending / validating / applying / applied / failed / rolled-back`) — demo-002 only exercises four of these but reserves visual space for all of them.
- The "What the GUI does NOT do" list — no system tray, no auto-launch, no registry writes, no `Rename-NetAdapter` call, no advanced mode, no inline CLI-equivalent display.
- The Save profile modal layout, default focus, and microcopy.
- The auto-apply toggle (off by default, visible in the title bar, **non-functional in demo-002** — see the design hand-off README §"Interactions & behavior").
- The Apply button being the dry-run-then-confirm-then-apply pipeline (but in demo-002 the button is **visible and disabled** with "demo-003 territory" microcopy; the pipeline lives in demo-003).
- All safety invariants from CLAUDE.md (fake provider default, dry-run before mutation, rollback before write, no ambiguous adapter mutation, inspectable behavior, CLI as the source of behavior, specs as the source of truth).
