# Demo-002 GUI design brief — for Claude Design web

> Pasteable brief for iterating WinNetPro's first GUI demo (demo-002) in Claude Design web.
> Output of this design pass becomes the visual spec the agent implements in Electron.
> The binding behavioral spec is [`docs/specs/gui-spec.md`](../specs/gui-spec.md). When the
> design and behavior collide, the behavioral spec wins; the design negotiates the *how it looks*.

---

## 1. What is WinNetPro?

A Windows network-interface profile manager. Lists adapters (Ethernet, Wi-Fi, USB dock), lets the user save and re-apply named IPv4 configurations (Static address or DHCP). The product is real and useful; the deeper purpose is to demonstrate that an AI coding agent — driven from BDDs, ADRs, and specs — can build inspectable, testable, safe software without a human writing implementation code.

**The audience for the demo is engineers learning how to drive an agent.** They are watching the artifacts as much as the running app. The GUI must be both (a) credibly real software and (b) legible enough that someone in row 5 can read what's happening.

## 2. Why this design pass

We've shipped demo-001 (CLI-only, 50 tests, runnable `.exe`). Demo-002 is the first **GUI** demo — the audience-facing artifact the audience will compare to other tools they know.

A parallel agent (Codex) shipped a GUI for the same domain called **NetSwitch**. Three reference screenshots are attached to this conversation. Our goal is to ship something that is clearly better-designed: clearer hierarchy, better safety affordances, fewer redundant controls, better empty states, better progress feedback. **This brief tells the designer what "better" means concretely.**

## 3. Demo-002 scope — what the GUI does in this demo

Demo-002's GUI is **a thin shell over demo-001's application services**: list fake adapters, edit a profile, see a live dry-run plan, save the profile. **There is no real Windows mutation in this demo.** That moves to demo-003.

Concretely, demo-002's GUI surface:

| Element | In scope this demo? |
|---|---|
| Adapter list (fake provider; 3 adapters from a JSON fixture) | ✅ |
| Adapter detail panel (ID, MAC, description, alias, link state) | ✅ |
| App alias text field (internal — never written to Windows) | ✅ |
| Profile editor: IPv4 mode (DHCP/Static), address, prefix, gateway | ✅ |
| Live "Pending change plan" panel (computed from form vs adapter state) | ✅ |
| **Save Profile** button + modal (name, description, capture-preferred-adapter) | ✅ |
| Adapter Profiles dropdown (profiles bound to this adapter) | ✅ |
| All Profiles dropdown (every saved profile) | ✅ |
| Auto-apply toggle in title bar (off; **non-functional in this demo**) | ✅ visible, ⚠️ no-op |
| **Apply** button | 🚫 visible but **disabled** — clearly "demo-003 territory" |
| Confirmation modal (only triggered by Apply) | 🚫 don't design |
| **Revert to DHCP** button | 🚫 don't design (depends on Apply) |
| Rollback UI / snapshot history | 🚫 don't design |
| WindowsProvider switcher (real adapters) | 🚫 not in this demo (fixture only) |
| Admin / elevation chrome | 🚫 don't design |
| IPv6 controls | 🚫 read-only "inherit" label, no edit UI |
| DNS controls | 🚫 read-only "inherit (no change)" label, no edit UI |

**The disabled `Apply` button is the design's most important affordance.** It tells the audience that demo-002 is honest about its scope: the *next* demo will enable it. A tooltip or inline note should explain why it's disabled — something like "Real apply lands in demo-003." This is a teaching artifact, not a missing feature.

## 4. The Codex NetSwitch reference — what to improve on, what to preserve, what the spec owns

NetSwitch screenshots are attached to this thread (three frames: Fake provider populated, Windows provider mid-refresh, Windows provider populated). It is **functionally further along than demo-002's scope** — it already ships the WindowsProvider that demo-002 defers to demo-003 — and visually it reads as workmanlike Electron defaults rather than designed software. Below: where the demo-002 design pass can credibly push, where NetSwitch has earned patterns the design must keep, and where the apparent flaw is actually the binding spec.

### 4a. NetSwitch behaviors the demo-002 design should improve on

| NetSwitch behavior | What demo-002 should do |
|---|---|
| Default dark Electron chrome with no visual identity beyond "competent debug tool." | Have a designed visual identity. Not necessarily dark — pick what serves the content. The audience should react to the GUI as *designed*, not just *shipped*. |
| When IPv4 Mode = DHCP, the Static fields stay visible but disabled/cleared (see screenshot 3 — IPv4 Address empty, Prefix Length greyed at 24, Gateway empty). | This is a defensible layout-consistency choice — the form doesn't reflow when the mode changes. But for a teaching demo where audience members read from row 5, the disabled fields add visual noise that competes with the relevant content. **Recommend hiding the Static fields entirely when DHCP is selected**, with a one-line note like *"IP address will be assigned automatically."* Trade visual stability for visual clarity; the demo benefits more from clarity. |
| Safe Mode is signaled by a muted two-tone chip in slot 9 of 10 in the top-bar reading order (app icon → title → Provider dropdown → Refresh → progress bar → "Found N adapters" → Elapsed → Last refresh → **Safe Mode** → Real apply disabled), sized like the wall-clock timestamp next to it. | The treatment is legible — it is not invisible — but it **loses the visual-hierarchy contest to every other element in the top bar**, including a routine timestamp. Given that this state is the difference between a tool that cannot mutate the network and one that can, it should win the hierarchy contest, not lose it. **Recommend a top-of-window banner or colored ribbon when Safe Mode is active**, not a corner chip. Pair color with a shield or lock icon and prominent type. The fix is structural (re-rank), not just chromatic (add saturation). |
| Empty states for the Profiles table and the Dry-Run Apply Plan panel are blank rectangles. | Every empty state has microcopy that teaches the next action. *"No profiles saved yet. Edit an adapter and click Save Profile."* *"No pending changes. Edit a field to preview the change plan."* Optionally a small illustration; copy alone is enough if the type is right. |
| The internal adapter ID (`windows-FEA72A98-63E6-4F5C-…`) is the first row of the Adapter Detail panel, same weight as human-meaningful fields. | De-emphasize internal IDs. Show them in a smaller mono row, secondary color, labeled. Lead the panel with alias + description + status — what the audience actually scans for. |
| Bottom status bar shows the full performance log path (`C:\Users\michael.gilmore\AppData\Local\Temp\netswitch-gui-progress-…\logs\performance.jsonl`). | Status bar shows *meaning*, not paths. *"Idle."* *"Saved profile dock-dhcp."* *"Refreshing adapters (step 2 of 4)…"* The perf log path moves to an About sheet or a "Show log file" debug action. |

### 4b. NetSwitch behaviors the design must preserve

| NetSwitch behavior | Why it earns its place |
|---|---|
| Refresh streams progress: 4-step progress bar + step text ("Step 2 of 4: Reading Windows IP configuration…") + elapsed timer + prior adapter data still visible during refresh. | Real UX win for a 14.6s operation. The audience knows the app is working, how far through, and isn't staring at a blank list. **Preserve this pattern.** Remaining opportunity (deferred to demo-003): adapters could populate the list incrementally as they're discovered instead of all-at-once at completion. Layout must accommodate that. |
| Adapter list as a sortable table with Windows Name / App Alias / Status / IPv4 / MAC columns. | Network engineers read network tools as tables. Dense info-per-pixel + sortable columns is the right call for this audience — not cards. Preserve the table. Improvements available within the pattern: tabular figures for IPv4, mono for MAC, hierarchy weight on the alias, but the structure is correct. |
| All four primary verbs visible in the button row (Save Profile / Dry Run / Apply / Restore Rollback) with disabled states for what's not currently available. | Communicates the full surface to the audience even when some actions are not yet possible. The disabled Apply button in demo-002 IS the design's most important affordance — see §3. **Preserve the "all verbs visible, gated by state" pattern.** |
| Buttons greyed during refresh; user gets unambiguous "wait, things are loading" feedback. | Clear interactive state. Preserve. |
| Provider toggle (Fake / Windows) visible in the title bar at runtime. | More discoverable than gui-spec.md's "must restart with `--real` flag" model. See §4c — this is a candidate spec change rather than a critique. |

### 4c. Apparent NetSwitch flaws that are actually the spec talking

These look like NetSwitch implementation choices but are gui-spec.md calling for the behavior. Surfacing here so the design pass either accepts them or proposes spec changes:

| Behavior | gui-spec.md source | Recommended resolution |
|---|---|---|
| Profile Editor shows an "Adapter Profiles" dropdown AND a "Global Profiles" dropdown AND a separate Profiles list in the lower-left. The Global Profiles dropdown duplicates the Profiles list. | §"Adapter detail panel": *"Adapter profiles dropdown — profiles whose `preferredAdapter` matches this adapter… All profiles dropdown — every profile."* | **Spec change candidate.** Keep the Adapter Profiles dropdown in the detail panel (filtered view = distinct purpose). Remove the All Profiles dropdown from the detail panel; the lower Profiles list becomes the single canonical view of every profile. Selecting one there populates the detail panel. Land as a `spec-overrides.md` entry in demo-002; promote to canonical at `/closeout` if accepted. |
| Provider mode is set via a launch flag, not at runtime. | §"Title bar": *"set at launch by `--real` flag passed to the GUI executable, no in-app toggle"* | **Spec change candidate.** NetSwitch's runtime toggle is more discoverable. Open question for the design pass: design a runtime toggle with appropriate gating (admin detection, confirmation modal when switching to Windows mode with real apply enabled, clear pre/post-state visualization). Defer the canonical spec change to demo-003 unless the design pass commits to a specific gating model that satisfies safety invariants. |

## 5. Aesthetic direction (recommendation, negotiable)

**Modern utility software.** Think: macOS System Settings + Linear's information density + 1Password's quiet confidence. Not industrial. Not playful. Restrained, credible, type-driven.

**Tone targets:**
- A network engineer trusts it on first glance.
- A non-technical audience watching from the back row can still tell the safety state.
- No flashy gradients, no skeuomorphism, no over-iconification.
- Color is reserved for state (success / warning / safety / error). Not decoration.

**Typography:**
- One sans-serif type family. SF Pro on macOS, Inter or Segoe UI Variable in the rendered Electron build (the binary ships on Windows; the design pass can use whatever).
- Mono only for: IP addresses, MAC addresses, GUIDs, file paths.
- Numbers should be tabular figures so prefix lengths and IPs align visually.

**Color (suggested, push back if you have better):**
- Neutral surface: warm white (light) or near-black (dark) — pick one for the design pass, both for the build later.
- Primary accent: a single saturated color for interactive elements (buttons, focus states). Recommend a calm blue-green rather than corporate blue.
- **Safe Mode banner: green.** Loud, unmistakable, semantically "this is the safe state."
- Warning/yellow: pending edits not yet saved.
- Danger/red: reserved exclusively for destructive-real-apply chrome that *doesn't appear in demo-002* but should be designed-in-spirit so demo-003 can adopt it cleanly.

**Density:**
- Information-rich but breathable. Three adapters fit on screen without scroll. The detail panel uses real estate for clarity, not for filling.

**Window size:**
- Default 1200×800. Resizable. Designs should hold up at 1000×700 and at 1600×1000.

## 6. The visual hierarchy — what the eye should hit in order

When the GUI first opens (no profiles saved, fake provider, 3 adapters):

1. **App name** + demo number. So the audience knows what they're looking at.
2. **Safe Mode banner.** Demo-002 is always in Safe Mode (no real apply); the banner is permanently present and prominent. This is the audience's first proof that the safety invariants hold.
3. **The adapter you clicked on** (or a sensible default selection). The right pane is doing useful work from frame 1.
4. **IPv4 mode radio + fields.** This is the central edit surface.
5. **Pending change plan.** The live computation showing what *would* happen on apply.
6. **Save Profile button.** The one verb that *is* enabled in this demo.
7. **(Visibly disabled) Apply button.** With the demo-003 explanation accessible nearby.

The Profiles list (left/bottom/sidebar — designer's call) is secondary on first paint because there are no profiles yet. Once profiles exist, it earns more weight.

## 7. State machine cheatsheet (full version in [`gui-spec.md`](../specs/gui-spec.md) §"Visible state machine")

The status indicator (a chip near the action buttons or in the title bar) must legibly show:

| State | When | Visual treatment |
|---|---|---|
| `idle` | No pending edits | Neutral, calm |
| `pending` | Form edited, not saved/applied | Yellow accent |
| `validating` | Domain validation running (rare, <100ms) | Brief spinner |
| `applied` | Save succeeded (demo-002: only Save reaches this) | Green pulse |
| `failed: <reason>` | Save or validation failed | Red accent + reason text |

Demo-002 does not exercise `applying` or `rolled-back` states (those need real apply). The design should reserve visual space for them (so demo-003 doesn't need a redesign), but they don't need to be illustrated in mocks.

## 8. Empty states the design must illustrate

These are the moments that make NetSwitch feel unfinished. Demo-002's design must answer all of them:

1. **No profiles saved yet.** The Profiles list / pane shows guidance, not a blank rectangle. Microcopy: *"No profiles saved yet. Configure an adapter and click Save Profile."*
2. **No adapter selected.** The right pane greets the user. Microcopy: *"Select an adapter to view and edit its profile."*
3. **Pending change plan when nothing has changed.** Microcopy: *"No pending changes. Edit a field to preview the change plan."*
4. **Adapter list while loading** (always near-instant for fake provider, but the slot should exist for demo-003's WindowsProvider).
5. **Validation error inline** (e.g., `192.168.1.300` in the IPv4 Address field). Field-level red, helper text *"Not a valid IPv4 address."*

## 9. Layout reference (from gui-spec.md)

The behavioral spec includes a rough ASCII layout. **Treat it as guidance about regions, not as a pixel-by-pixel target.** Specifically:

- The spec calls out a left adapter list + right detail panel.
- The Save Profile and Apply actions sit in the right detail panel near the change-plan.
- The auto-apply toggle is in the title bar.

The designer is free to:
- Move the Profiles list to a different position (sidebar, sheet, etc.) if it improves hierarchy.
- Combine or split the change-plan and action button regions.
- Use a single-pane layout with adapter selection via dropdown if it scales better.

The designer is **not** free to:
- Hide Safe Mode signaling.
- Show fields that gui-spec.md says are not editable in v1 (DNS edit, IPv6 edit, system tray, registry).
- Add an "Advanced" mode (gui-spec.md §"What the GUI does NOT do").

## 10. Things to *not* design

Save your effort:

- **Apply confirmation modal** — Apply is disabled in demo-002; the modal lives in demo-003.
- **Snapshot/rollback chrome** — demo-003.
- **Admin elevation prompts** — demo-003.
- **WindowsProvider live refresh / step-by-step indicator** — demo-003.
- **Settings / preferences screen** — out of scope for v1.
- **Onboarding / tutorial flow** — the GUI explains itself via microcopy.
- **System tray / minimize-to-tray** — explicitly excluded by gui-spec.md.

## 11. Acceptance criteria for this design pass

The design pass is "done" when:

- [ ] The first-launch screen is fully designed (no adapter selected, no profiles).
- [ ] The adapter-selected screen with the form in DHCP mode is designed.
- [ ] The adapter-selected screen with the form in Static mode (mid-edit) is designed, including the live change plan.
- [ ] The Save Profile modal is designed.
- [ ] The disabled Apply button has clear visual + textual affordance for "this lands in demo-003."
- [ ] Safe Mode signaling is prominent and unmistakable.
- [ ] At least one validation-error state is designed (invalid IPv4 address).
- [ ] The design works at 1000×700 and 1600×1000.
- [ ] Color tokens, type tokens, and spacing tokens are explicit (so the agent can implement faithfully).

Optional (nice to have):
- Light + dark variants.
- A mocked "demo-003" frame with Apply enabled, so the design's future shape is visible.

## 12. Handoff format

What the agent needs to implement faithfully:

- The screen designs (PNG or Figma-equivalent).
- A short tokens spec: colors (named, hex), spacing scale, font sizes/weights, border-radius.
- Component-level guidance for anything subtle: focus states, hover states, disabled states.
- Microcopy strings, ready to paste.

The agent will translate these into Electron + a CSS framework (probably Tailwind or vanilla CSS — TBD at implementation time).

---

## Appendix A — Demo-002 fixture (the 3 fake adapters the GUI will render)

From [`demos/001-save-and-dry-run-cli/fixtures/adapters.json`](../../demos/001-save-and-dry-run-cli/fixtures/adapters.json) (will be copied forward to demo-002):

1. **`ad-01` — Ethernet** — Intel I219-LM, DHCP, `10.10.20.57/22`, link up. No app alias.
2. **`ad-02` — Ethernet 5** — USB 10/100/1000 LAN, DHCP, `192.168.1.42/24`, link up. App alias: "Dock Radio".
3. **`ad-03` — Wi-Fi** — Intel AX201, DHCP, `10.10.30.118/22`, link up. No app alias.

A representative Static profile a user might save (used in demo BDDs):
- Name: "lab-static"
- IPv4: Static `10.0.0.50/24`, gateway `10.0.0.1`
- Preferred adapter: captured from `ad-01`

## Appendix B — Binding behavioral spec checklist

Designer should skim [`docs/specs/gui-spec.md`](../specs/gui-spec.md) once. Especially:

- §"Layout (main window)" — ASCII reference layout.
- §"Visible state machine" — the chip states.
- §"Components" — adapter list, detail panel, save-profile modal.
- §"What the GUI does NOT do" — the no-go list.

If the design needs to *change* anything in gui-spec.md, that's allowed: the resolution lands in `demos/002-save-and-dry-run-gui/spec-overrides.md` during implementation. The canonical spec is updated at `/closeout` only if the override is promoted.
