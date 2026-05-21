# Handoff — WinNetPro demo-002 GUI

## Overview

This bundle is the **design pass for demo-002**, WinNetPro's first GUI demo. The
GUI is a thin Electron shell over the application services demo-001 already
ships — it contains zero Windows-networking logic. Everything goes through the
same use cases the CLI calls (per `docs/architecture/winnetpro-architecture.md`
and ADR-0001).

In scope for demo-002 (per the brief):

- Adapter list (fixture provider; 3 adapters)
- Adapter detail panel with App-alias field
- IPv4 profile editor (DHCP / Static + address / prefix / gateway)
- Live "Pending change plan" panel
- Save Profile button + modal
- Adapter Profiles / All Profiles surfaces
- Auto-apply toggle in title bar (visible, **no-op** in demo-002)
- **Apply** button **visible but disabled** — "this lands in demo-003"
- Safe Mode signaling, prominent and structural
- All empty states with teaching microcopy

Out of scope (do **not** implement here):

- Apply confirmation modal
- Revert-to-DHCP, rollback chrome
- Admin / elevation prompts
- WindowsProvider (real) refresh
- IPv6 / DNS edit controls

## About the design files

The files in this bundle are **design references created in HTML / React** —
prototypes showing intended look and behavior. They are **not** production code
to copy directly into the Electron app.

The task is to **recreate these designs inside `demos/002-save-and-dry-run-gui/`**
using the patterns the repo already establishes:

- TypeScript front-end inside the demo's `src/` (per ADR-0007 per-demo source-tree)
- Electron packaged via `electron-builder` (per `docs/specs/gui-spec.md`)
- The renderer should call only the application services exposed by the same
  in-process layer the CLI uses — never spawn PowerShell directly from the GUI
- Styling: vanilla CSS using the token contract defined below. Tailwind is fine
  if the demo team prefers; the tokens map cleanly. **Do not** introduce
  a heavyweight component library — these views are first-party.

If you adopt React (recommended for the renderer), keep the component
boundaries from the design files (Window shell, SafeBanner, AdapterList,
DetailPanel, ChangePlan, SaveModal, StatusBar) — they correspond 1:1 to the
acceptance criteria in §11 of the brief.

## Window chrome — Windows 11 custom title bar

This is a **Windows 11 application**, and the design draws its own title bar
rather than using the native OS frame. To match what the screenshots show:

- Electron `BrowserWindow` config: `frame: false` + `titleBarStyle: 'hidden'`
  with `titleBarOverlay` left off — we draw all three caption buttons
  ourselves so they can theme-switch with the rest of the UI.
- Title bar is **32 px tall**, sits flush against the top of an 8 px-rounded
  window (matches Windows 11 Mica).
- Caption buttons are **46 × 32 px** each, no border-radius, flush against
  the right edge. Close hover = `#e81123` (light) / `#c42b1c` (dark), white
  glyph. Minimise / Maximise hover = ~6% black overlay (light) / ~8% white
  (dark).
- The left edge of the title bar has a small 16 × 16 app glyph (a 3 px-radius
  square with a teal→green gradient — placeholder for the real app icon).
  Replace with the bundled app icon at implementation time.
- The entire title-bar surface is `-webkit-app-region: drag`, with
  `no-drag` on the caption-buttons group, the auto-apply toggle, and the
  theme toggle so they remain clickable.

**If you want to fall back to the native Windows frame** instead, that's
a defensible choice — drop the custom title bar, lose the in-window
auto-apply / theme-toggle controls (move them to a menu), keep everything
below the title bar unchanged. The Safe-Mode banner, body, and status bar
don't need the custom-frame to read correctly. The trade-off: native frame
gives users the exact Win11 window controls they expect, but you lose the
ability to put the auto-apply toggle (a gui-spec.md requirement) flush in
the title bar without inventing a secondary toolbar.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, radii, semantic tokens,
and component-level states are all specified. The developer should match
pixel-for-pixel within the tolerances browsers and platform shells allow.

## Files in this bundle

| Path | What it is |
|---|---|
| `WinNetPro demo-002 GUI design.html` | Design canvas — open in a browser, pan/zoom to review all frames. |
| `screenshots/` | 14 PNGs (7 frames × light/dark). See `screenshots/README.md` for the frame index and a note on capture artefacts. |
| `tokens.css`             | **Authoritative token contract.** Light + dark variants. |
| `shell.jsx`              | `WnWindow`, `WnTitleBar`, `WnSafeBanner`, `WnLeftPane`, `WnStatusBar`. |
| `frames.jsx`             | The six artboard frames (states 1–6). |
| `tokens-frame.jsx`       | Token reference card (frame 7). |
| `icons.jsx`              | Inline SVG icons (1.5px stroke, currentColor). |
| `design-canvas.jsx`, `main.jsx` | Canvas-only chrome — not part of the product. |

## Screens

### 1. First launch (no adapter selected, no profiles)
- **Layout** — 1200×800 window. 36px title bar; full-width Safe-Mode banner;
  body grid `380px 1fr`; 28px status bar.
- **Left pane** — adapter list (3 fixture rows) over a Profiles sub-pane whose
  empty state reads: *"No profiles saved yet. Select an adapter and click Save
  profile to capture its IPv4 configuration for re-use."*
- **Right pane** — centered empty state: icon tile, heading *"Select an adapter
  to view and edit its profile."*, two-line description, fixture-provider chip.
- **Status bar** — chip `idle`, meta *"Ready · select an adapter to begin"*,
  `Show log` link far right.

### 2. Adapter selected · IPv4 mode = DHCP
- **Improvement on NetSwitch §4a:** when DHCP is selected, Static fields are
  **hidden entirely** and replaced with a one-line guidance panel:
  *"IP address, prefix, and gateway will be assigned automatically. Switch to
  Static to enter them by hand."* Plus a `Current lease` row in mono.
- DNS + IPv6 collapse into a single read-only fieldset (`inherit (no change)`).
- Pending change plan shows its empty state.
- Action row: `Save profile` (default) + `Apply` **disabled** + `demo-003 pill`.

### 3. Adapter selected · Static mid-edit · live change plan
- IPv4 fieldset reveals Address / Prefix length / Gateway inputs.
  - Address: monospace, tabular figures.
  - Prefix length: small numeric input + computed mask hint
    (*"= 255.255.255.0 · 254 hosts"*).
  - Gateway helper: *"Leave empty for an isolated subnet (e.g. dock radio)."*
- **Pending change plan** populates with rows for IPv4, Gateway, DNS, IPv6,
  Rollback. Old values strike-through, new values bolded. Header reads
  `2 changes` and shows a live pulse dot in amber.
- Status chip flips to `pending`. Status bar meta: *"Pending · 2 fields edited"*
  with a passive tail *"last validate ✓ 11 ms"*.
- `Save profile` becomes the primary action.

### 4. Validation error
- Address field has `error` class — red border, red soft fill, helper text
  *"Not a valid IPv4 address. Each octet must be 0–255."*
- Plan panel reframes itself as a red soft-fill block: *"Plan blocked by
  validation. Fix the highlighted field above to recompute the change plan.
  Nothing has been saved or applied."*
- Both `Save profile` and `Apply` go disabled.
- Status chip: `failed: validation`. Status bar surfaces the short tag with a
  `More` link for the detail pane.

### 5. Save profile modal
- 440px modal centered over a dimmed (blur 0.5 + opacity 0.55) backdrop of
  the current detail view.
- Fields: Name (autoFocus, helper text shows derived profile ID); Description
  (optional); a single bordered checkbox row for *Capture preferred adapter*
  with its description and a mono read-out of the MAC + GUID being captured.
- Footer right-aligns `Cancel` + `Save` (primary). Default focus is on Name
  per the brief / gui-spec §"Save profile modal".

### 6. Demo-003 preview (optional per §11)
- Banner re-keyed to **amber `Real provider · arm to mutate`** so the design's
  future shape is visible.
- Apply enabled (primary); `Revert to DHCP` added as a ghost danger button.
- Plan panel becomes an "applied · verified" green soft-fill summary with
  rollback armed.
- Profiles list populated. Status chip `applied`.

### 7. Tokens card
- Color swatches (light + dark), type ramp, spacing scale, radii + elevation,
  and all state-chip variants.

## Interactions & behavior

| Interaction | Behavior |
|---|---|
| Click adapter row | Selects, populates right pane. Selected row gets `var(--wn-surface)` background, border, subtle shadow. |
| IPv4 mode toggle | Switching DHCP↔Static reveals/hides Static fields. **No reflow tricks** — animate at 120 ms ease-out if you can, but no-animation is acceptable. |
| Type into a field | Validates inline on every keystroke; updates the Pending change plan within ~50 ms. |
| Click `Save profile` | Opens modal. Default focus = Name. **Enter** in any field commits; **Esc** cancels. |
| Click `Apply` (demo-002) | Button is `disabled`. Tooltip on hover: *"Real apply lands in demo-003."* |
| Theme toggle (title bar) | Flips `data-theme` on the window root. Both themes must be supported. |
| Refresh button (left pane) | demo-002: rebuilds the adapter list from the fixture (≈ instant). Layout must accommodate the demo-003 step-by-step progress treatment (see §4b of the brief). |
| Status bar `Show log` | Opens the perf log path in the OS shell. Path **never** lives in the status bar. |

State machine (per `docs/specs/gui-spec.md` §"Visible state machine"):
`idle → pending → validating → applying → applied | failed | rolled-back`.
Demo-002 only exercises `idle / pending / applied / failed` — but **reserve
visual space for all of them** so demo-003 doesn't need a redesign.

## State management

Renderer-side state needed:

- `selectedAdapterId: string | null`
- `formDraft: { ipv4Mode, address, prefixLength, gateway, alias }`
- `validation: ValidationResult` (live; matches the domain layer's
  discriminated union)
- `changePlan: ChangePlan | null` (live; matches the shape in
  `docs/specs/profile-schema.md`)
- `statusChip: 'idle' | 'pending' | 'validating' | 'applying' | 'applied' | 'failed' | 'rolled-back'`
- `lastError: { tag: string, detail?: string } | null`
- `profiles: Profile[]`
- `theme: 'light' | 'dark'` (window-local; default light)
- `autoApply: boolean` (default **false**; per ADR-0008, **reset on launch**)

Data flow: the renderer never owns business logic. All state derivations
(plan, validation, match) come back from the application services in main
process via IPC. The renderer **does not parse IPv4** — it ships the field
string to the validator and renders the returned `ValidationResult`.

## Design tokens

The complete token contract is in `tokens.css`. Highlights:

### Colors (light → dark)

| Token | Light | Dark |
|---|---|---|
| `--wn-bg` | `oklch(98.6% 0.005 75)` | `oklch(18% 0.006 75)` |
| `--wn-surface` | `#ffffff` | `oklch(22.5% 0.007 75)` |
| `--wn-surface-2` | `oklch(96.5% 0.006 75)` | `oklch(20% 0.006 75)` |
| `--wn-surface-3` | `oklch(94.5% 0.007 75)` | `oklch(25% 0.008 75)` |
| `--wn-ink` | `oklch(22% 0.012 60)` | `oklch(95% 0.006 75)` |
| `--wn-ink-2` | `oklch(40% 0.010 60)` | `oklch(78% 0.006 75)` |
| `--wn-ink-3` | `oklch(56% 0.008 60)` | `oklch(62% 0.006 75)` |
| `--wn-border` | `oklch(89% 0.006 70)` | `oklch(31% 0.008 75)` |
| `--wn-accent` | `oklch(58% 0.10 200)` | `oklch(72% 0.12 200)` |
| `--wn-safe` (banner green) | `oklch(55% 0.13 152)` | `oklch(70% 0.15 152)` |
| `--wn-warn` (pending amber) | `oklch(70% 0.13 75)` | `oklch(78% 0.14 75)` |
| `--wn-danger` (validation red) | `oklch(58% 0.18 28)` | `oklch(70% 0.17 28)` |

**Color discipline.** Accent (teal) = interactive affordance only. Green =
safe-state messaging. Amber = pending-edit. Red = validation / destructive
(demo-003). Never decorate with color — every coloured surface in this design
means something.

### Type

- Family: **Inter** for UI, **JetBrains Mono** for IPs, MACs, GUIDs, paths.
  On Windows ship Segoe UI Variable / Cascadia Mono as the platform fallback
  pair; metrics are close enough that layouts don't need adjustment.
- Tabular figures (`font-variant-numeric: tabular-nums`) everywhere — IPs and
  prefixes must align column-down.
- Scale: 11, 12, 13, 14, 16, 18, 22 px. Weights 400 / 500 / 600.

### Spacing (multiplicative 4-px scale)

`s-1=2, s-2=4, s-3=6, s-4=8, s-5=12, s-6=16, s-7=20, s-8=24, s-9=32, s-10=40, s-12=56`

### Radii / elevation

`r-1=3, r-2=5, r-3=7, r-4=10, r-5=14`.
Three shadow tiers: hairline (`shadow-1`), card (`shadow-2`), float (`shadow-3`).
Modals use a fourth, heavier tier (`shadow-modal`).

### State chip

Five variants in `tokens.css`: `.wn-status.idle | .pending | .applied | .failed`.
A fifth `rolled-back` style is shown in the tokens frame for completeness.

## Microcopy strings (copy verbatim)

- Safe-Mode banner: *"Fixture provider — **no** real network changes can occur
  in this demo. Real apply lands in demo-003."*
- Apply-disabled chip: *"Apply lands in demo-003"*
- Adapter empty state: *"Select an adapter to view and edit its profile."*
- Profiles empty state: *"No profiles saved yet. Select an adapter and click
  Save profile to capture its IPv4 configuration for re-use."*
- Pending-plan empty state: *"No pending changes. Edit a field above to preview
  the change plan. The plan mirrors the CLI's `--json` output exactly."*
- Validation error (invalid IPv4): *"Not a valid IPv4 address. Each octet must
  be 0–255."*
- Plan blocked by validation: *"Plan blocked by validation. Fix the highlighted
  field above to recompute the change plan. Nothing has been saved or
  applied."*
- DHCP guidance: *"IP address, prefix, and gateway will be assigned
  automatically. Switch to Static to enter them by hand."*
- Save modal subtitle: *"Captures the current IPv4 configuration. The profile
  can be re-applied later from any adapter."*

## Assets

No raster assets. All icons are inline SVG (`icons.jsx`). The window-chrome
dots in the title bar are decorative (the real Electron build uses the OS
frame); leave them off if the app uses a native frame.

## Acceptance checklist (from §11 of the brief)

- [x] First-launch screen (no adapter, no profiles)
- [x] Adapter-selected · DHCP mode
- [x] Adapter-selected · Static mid-edit · live change plan
- [x] Save profile modal
- [x] Disabled Apply with clear "demo-003" affordance
- [x] Safe Mode signaling — structural, full-width banner (not corner chip)
- [x] Invalid IPv4 validation state
- [x] Works at 1000×700 → 1600×1000 (grid is fluid; only the left rail is
      fixed at 380px)
- [x] Explicit color, type, spacing tokens
- [x] Light + dark variants

## Spec resolutions to land in `spec-overrides.md`

Per §4c of the brief, two spec changes are implied by this design pass — file
them as overrides during implementation; promote at `/closeout` if accepted:

1. **Drop the "All profiles" dropdown from the detail panel.** The bottom-left
   Profiles list is the single canonical view of every profile. Keep the
   per-adapter Adapter Profiles dropdown.
2. **Provider mode stays a launch-flag in demo-002.** A runtime toggle is
   designed-in-spirit (demo-003 preview frame shows the banner re-keyed) but
   the gating model (admin detection, confirmation, pre/post-state
   visualization) is not finalized — defer the spec change to demo-003.
