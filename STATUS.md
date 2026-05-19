# WinNetPro — Status

## Current phase

**Phase 1 — Demo 001 implementation complete (CLI + tests + BDD evidence); `.exe` build pending.** Source tree, 50 unit + BDD tests passing, evidence files honest after the bdd-evidence-reviewer pass, arch-reviewer returned PASS-WITH-NITS. ADR-0009 added for the commander/inline-parser divergence.

## Current focus

Active demo: **`demos/001-save-and-dry-run-cli/`**.

What landed:
- `src/` tree: `domain/` (types, validation, matching per ADR-0006, profile-id), `application/` (ports, `SaveProfile`, `BuildDryRunPlan`), `infrastructure/` (`FakeProvider`, `JsonProfileRepository`, `SystemClock` + `fixedClock`), `cli/` (`run()` canonical surface, `index.ts` real entry, tiny inline arg parser per ADR-0009, `profiles save` + `profiles apply` commands).
- 50 tests across `tests/unit/` (validation, matching, profile-id, repo, use cases) and `tests/bdd/` (one file per `.feature`, in-process driver that captures stdout/stderr/exit code + reads the live `FakeProvider.mutationLog`).
- Evidence files at `demos/001-save-and-dry-run-cli/evidence/profile-save.md` and `profile-apply-dry-run.md`. Setup-file dumps (fixture + seed profiles) and live mutation-log reads land in each apply scenario per the reviewer's request.

Next work, in order:
1. Anchor `.exe` build — flesh out `scripts/build-cli-sea.mjs` (esbuild bundle → Node SEA blob → postject) to produce `WinNetPro-CLI-demo-001.exe` on a Windows machine. Build target: under 30 seconds. Adds `esbuild` as devDep to `demos/001-save-and-dry-run-cli/`.
2. `/closeout` — promote any demo-local BDD additions (none yet), update this STATUS.md rolling log, commit.

## Carry-forward for demo-002 (do not lose)

- **Matching warning gap (arch-reviewer nit).** ADR-0006 requires `description` and `alias` match confidence to surface a warning, and `alias`-only requires confirmation even with `--yes`. Demo-001 implements the match priority and the ambiguous-refusal path, but does **not** emit the warning. Safe in demo-001 (dry-run only — no real mutation). Must land before demo-002's real apply path inherits this code.
- **Real apply pipeline.** Demo-001's `FakeProvider` only exposes `listAdapters()`; `applyChangePlan` and `verify` arrive in demo-002, along with the snapshot capture / rollback flow (ADR-0004 steps 9-12) and admin detection (safety-spec invariant 4).
- **GUI.** Deferred to demo-002+ per the create-demo conversation.

## Open questions

- For the demo-001 `.exe` build, do we want the SEA pipeline to run on macOS (cross-target Windows is awkward; Node SEA targets the host platform) or do we record the build as a "produce on Windows" step in the demo runbook? Likely the latter — confirm at build time.

## Recent sessions (rolling 5)

### 2026-05-19 — Demo 001 (`save-and-dry-run-cli`) implemented end-to-end

- **Goal:** First live agentic-engineering demo. Vertical slice through the CLI: discover adapters via fake provider, save a static IPv4 profile bound to a preferred adapter, dry-run apply that profile and emit a complete `ChangePlan`. CLI-only — GUI deferred to demo-002+.
- **Source:** `/startup WinNetPro` confirmed the scaffold (Phase 0) was intact; user picked slug `save-and-dry-run-cli` (descriptive of the two BDDs in scope) and chose CLI-only. `/create-demo 001 "save-and-dry-run-cli"` scaffolded the per-demo workspace; user said "Proceed" to implementation.
- **Done:**
  - Demo workspace at `demos/001-save-and-dry-run-cli/`: `package.json`, `tsconfig.json`, README, starter `fixtures/adapters.json` (3 adapters incl. `ad-02` matching the BDDs).
  - Shared build scripts (one-time, reused across all demos): `scripts/build-cli-sea.mjs`, `scripts/build-gui-electron.mjs` — defensive stubs that validate args + entry, document the intended Node SEA / electron-builder pipelines, exit non-zero. Full pipeline lands in a follow-up commit.
  - Full `src/` tree, in-scope and minimal:
    - `domain/` — `types.ts` mirrors `docs/specs/profile-schema.md`, `validation.ts` (pure RFC-791-style IPv4 checks + profile-save input validation), `matching.ts` (ADR-0006 priority: GUID > MAC > description > alias > global; refuses ambiguous), `profile-id.ts` (slug).
    - `application/` — `ports.ts` (NetworkProvider, ProfileRepository, Clock — application layer depends on these only, never concrete infra), `save-profile.ts`, `build-dry-run-plan.ts`.
    - `infrastructure/` — `FakeProvider` (ADR-0002 default; exposes `mutationLog` for BDD inspection; no `applyChangePlan` surface yet by design), `JsonProfileRepository` (ADR-0003 CWD-relative storage), `SystemClock` + `fixedClock` for deterministic tests.
    - `cli/` — `run(argv, streams, overrides)` is the canonical surface; `index.ts` is the real entry that wires `process.*`. Inline arg parser (40 lines) per **ADR-0009**. Commands: `profiles save`, `profiles apply --dry-run`. `--real` rejected with exit 1 (out of scope for demo-001).
  - 50 tests passing (~250 ms):
    - Unit (`tests/unit/`): validation, matching, profile-id, JSON repo, save-profile, build-dry-run-plan use cases.
    - BDD (`tests/bdd/`): in-process driver against `run()` with fixed clock, per-scenario temp config-dir + fixture-dir. Drives the canonical surface; reads the **live** `FakeProvider.mutationLog` instance for the "mutation log is empty" assertions. Emits Markdown evidence under `demos/001-save-and-dry-run-cli/evidence/` with pre-run setup-file dumps (fixture + seed `profiles.json`) and captured stdout/stderr/exit codes.
  - **ADR-0009** (`docs/decisions/0009-inline-arg-parser-defer-commander.md`): records the choice to roll a tiny inline parser in demo-001 rather than pull `commander`, scoped per-demo, with explicit trigger conditions for revisiting. Architecture doc updated (`docs/architecture/winnetpro-architecture.md` Interface section) to phrase commander as "planned" rather than current invariant, so spec and code stay coherent (CLAUDE.md invariant 7).
  - Subagent passes:
    - `bdd-evidence-reviewer` initial pass: 5 PASS / 3 PARTIAL — paraphrased Given preconditions on apply-dry-run scenarios. Addressed by emitting pre-run setup-file blocks + live `FakeProvider.mutationLog` reads. Re-emitted evidence honestly demonstrates every Then/And step.
    - `arch-reviewer`: PASS-WITH-NITS. Two nits — (a) live mutation-log read instead of an in-process placeholder array (addressed); (b) ADR-0006 warning emission for `description`/`alias` confidence match levels (carry-forward — safe in demo-001 since dry-run only, but must land before demo-002 real apply). One ADR recommendation (ADR-0009) — added.
- **Next:**
  - Flesh out `scripts/build-cli-sea.mjs` (esbuild → Node SEA blob → postject) and produce `WinNetPro-CLI-demo-001.exe` — likely on a Windows machine since Node SEA targets the host platform.
  - Demo-002: real apply pipeline (snapshot, mutate, verify, rollback), admin detection, matching warnings for `description`/`alias` confidence, possibly the GUI.



- **Goal:** Stand up the WinNetPro repo as a teaching scaffold. No code; just the artifacts that drive the agent in subsequent demo sessions.
- **Source:** Two-message conversation with GPT-5.5 that researched the defunct IP Shifter utility and proposed a modern clone, plus a follow-up that locked in product decisions (IPv4 mutation + IPv6 inherit-only v1, DHCP + static profiles, optional gateway, DNS inherited, adapter + global profile dropdowns, internal-only alias, rollback support, corporate-laptop safety, portable per-machine config in launch directory, single unsigned `.exe`, real Windows mutation manually tested only). Six refining questions answered by user before scaffolding: (1) per-demo source-tree pattern = canonical `docs/` + per-demo `demos/N/src/` with optional `spec-overrides.md`; (2) TS only for now, defer Python; (3) build both CLI and GUI .exes on demand, GUI may be pre-built when live build is too slow; (4) this session's deliverable = CLAUDE.md + ADRs + specs + BDDs + slash commands + demos/ stub, no Demo 1; (5) per-project `/startup WinNetPro` (silver pattern); (6) audience BDD tweaks land demo-local, promoted to canonical via `/closeout`.
- **Done:**
  - `README.md`, `CLAUDE.md`, this `STATUS.md`, `.gitignore`, `package.json`, `tsconfig.json`
  - 8 ADRs (0001 CLI-first, 0002 fake-provider-default, 0003 portable-config-cwd, 0004 dry-run-first, 0005 IPv4-mutation-IPv6-inherit-v1, 0006 profile-schema-and-matching, 0007 per-demo-source-tree, 0008 auto-apply-off-by-default)
  - 5 specs (product, cli, gui, profile-schema, safety)
  - 5 BDD feature files (adapter-discovery, profile-save, profile-apply-dry-run, rollback, auto-apply-safety)
  - 6 slash commands (startup, closeout, create-demo, adr, spec, research)
  - 2 subagents (arch-reviewer, bdd-evidence-reviewer)
  - `demos/README.md` explaining the demo workflow
  - Architecture doc
  - Public GitHub repo at `caseten-dx/WinNetPro`
- **Next:** Run `/create-demo 001 "<slug>"` in a fresh session to start the first live demo.
