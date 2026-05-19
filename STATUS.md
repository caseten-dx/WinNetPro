# WinNetPro — Status

## Current phase

**Phase 1 — Demo 001 complete end-to-end.** CLI source + 50 tests + BDD evidence + `.exe` artifact via CI all landed. First green windows-latest run produces `WinNetPro-CLI-demo-001.exe` (~108 MB) in 59 s and uploads it as a 30-day artifact. Awaiting user smoke-test on a Windows laptop.

## Current focus

Active demo: **`demos/001-save-and-dry-run-cli/`** until smoke-test feedback comes back from Windows; then demo-002.

What landed (cumulative):
- `src/` tree: `domain/` (types, validation, matching per ADR-0006, profile-id), `application/` (ports, `SaveProfile`, `BuildDryRunPlan`), `infrastructure/` (`FakeProvider`, `JsonProfileRepository`, `SystemClock` + `fixedClock`), `cli/` (`run()` canonical surface, `index.ts` real entry, tiny inline arg parser per ADR-0009, `profiles save` + `profiles apply` commands).
- 50 tests across `tests/unit/` and `tests/bdd/`. Plus 2 CI smoke tests against the produced `.exe`: no-args → exit 2 + `Usage:` in stderr; `profiles save --json` against bundled fixture → exit 0 + valid JSON.
- Evidence files at `demos/001-save-and-dry-run-cli/evidence/profile-save.md` and `profile-apply-dry-run.md`.
- Build pipeline: `scripts/build-cli-sea.mjs` runs esbuild → Node SEA blob → copy node binary → postject inject. Local Mac build at 9.1 s; CI Windows build at ~30 s of the 59 s total.
- CI: `.github/workflows/build-cli.yml` on `windows-latest`, Node 24, pnpm 9 (read from root `packageManager`), explicit `permissions: contents: read`, artifact uploaded with 30-day retention.

Next work, in order:
1. User smoke-tests `WinNetPro-CLI-demo-001.exe` on a Windows laptop and reports back any Windows-specific issues (path handling, fixture resolution, line endings).
2. Demo-002 scoping (see Carry-forward).

## Carry-forward for demo-002 (do not lose)

- **Matching warning gap (arch-reviewer nit from prior session).** ADR-0006 requires `description` and `alias` match confidence to surface a warning, and `alias`-only requires confirmation even with `--yes`. Demo-001 implements the match priority and the ambiguous-refusal path, but does **not** emit the warning. Safe in demo-001 (dry-run only — no real mutation). Must land before demo-002's real apply path inherits this code.
- **Real apply pipeline.** Demo-001's `FakeProvider` only exposes `listAdapters()`; `applyChangePlan` and `verify` arrive in demo-002, along with the snapshot capture / rollback flow (ADR-0004 steps 9-12) and admin detection (safety-spec invariant 4).
- **GUI.** Demo-002+. The GH Actions wiring proves the windows-latest CI path; the GUI demo will add a parallel `.github/workflows/build-gui.yml` driven by `electron-builder` and produce `WinNetPro-GUI-demo-NNN.exe`.
- **GH Actions runtime deprecation.** `actions/checkout@v4`, `setup-node@v4`, `upload-artifact@v4`, `pnpm/action-setup@v4` still run on Node.js 20 internally — forced upgrade by 2026-09-16. `windows-latest` redirects to `windows-2025-vs2026` by 2026-06-15. Track; not urgent for demo-002 scoping.

## Open questions

- (Resolved this session) macOS host vs Node SEA cross-target — answer: GH Actions `windows-latest` is the build target; Mac is used only for local sanity checks.
- **SHA-pinning of GH Actions vs floating `@v4` tags.** Arch-reviewer flagged the floating-tag posture in `build-cli.yml`. Deferred per teaching-repo readability tradeoff; revisit if the repo grows beyond demo scope or if a supply-chain incident hits one of the upstream actions.

## Recent sessions (rolling 5)

### 2026-05-19 — Demo 001 anchor `.exe` shipping via GH Actions windows-latest

- **Goal:** Produce the demo-001 anchor `.exe` artifact via CI so the audience can download a working binary, and defer the persistent Windows-host decision until demo-002 actually needs real adapter mutation. This unblocks STATUS.md's "Next work" item 1 from the prior session.
- **Source:** User asked the broader question of how to do Windows development from a Mac. We surveyed the field (Azure Lightsail / Vultr / Windows 365 / Hetzner-DIY) and the Apple-Silicon-vs-x64 gotcha for Node SEA binaries. User concluded: GH Actions `windows-latest` for the `.exe` build today, manual Windows-laptop testing for now, persistent Windows host deferred until demo-002 GUI/real-apply needs it.
- **Done:**
  - `scripts/build-cli-sea.mjs` — replaced the defensive stub with the full Node SEA pipeline: esbuild bundle (`target: node24`, CJS, single-file) → `node --experimental-sea-config` → copy `process.execPath` → `postject.inject(...)`. On macOS, strips and re-signs the binary around the inject step so it runs locally for sanity checks. Resolves `esbuild` and `postject` from the demo's own `package.json` via `createRequire` (preserves ADR-0007's "shared scripts, per-demo deps" model). Local Mac build measured at 9.1 s; under the 30 s CLAUDE.md budget.
  - `demos/001-save-and-dry-run-cli/src/cli/index.ts` — dropped the top-level `await` so esbuild can bundle the CLI entry to CJS for SEA. The `run()` surface in `run.ts` is unchanged; tests do not touch `index.ts`; all 50 tests still pass after the refactor. Inline comment notes the constraint.
  - `demos/001-save-and-dry-run-cli/package.json` — added `esbuild ^0.24.0` and `postject ^1.0.0-alpha.6` devDeps.
  - `.github/workflows/build-cli.yml` (new) — `runs-on: windows-latest`, Node 24, pnpm 9 (read from root `packageManager`), `timeout-minutes: 10`, explicit `permissions: contents: read`. Steps: checkout → setup pnpm → setup Node → install (frozen lockfile) → typecheck (demo-001) → test (demo-001) → build:cli → verify `.exe` exists → smoke test (no-args → exit 2 + `Usage:` in stderr) → smoke test (`profiles save --json` against bundled fixture, temp `--config-dir` in `$RUNNER_TEMP`, expects exit 0 + valid JSON with `name: "ci-smoke"`) → upload artifact (`retention-days: 30`, `if-no-files-found: error`). Triggers: push-to-main with path filter, plus `workflow_dispatch`.
  - **arch-reviewer:** PASS-WITH-NITS. Three of four addressed inline before commit: esbuild target aligned to `node24`, end-to-end fixture-backed smoke step added, explicit `permissions:` block added. Fourth (floating `@v4` action tags vs SHA pins) deferred intentionally for live-readability in a teaching repo; tracked in Open Questions.
  - **CI shakedown:** four pushes to first green. Run 26123033477 failed on `pnpm/action-setup@v4` because both `version: 9` (workflow input) and `pnpm@9.0.0` (root `packageManager`) were declared — resolved by dropping the workflow input so the `packageManager` field is the single source of truth. Runs 26123138382 and 26124183434 reached the no-args smoke test but failed even though the `.exe` exited 2 with `Usage:` in output; the pipeline-redirect form `& $exe 2>&1 | Out-String` interacts with GH Actions' pwsh defaults (`$ErrorActionPreference = 'Stop'` + `$PSNativeCommandUseErrorActionPreference = $true`) in a way that taints the script's final exit state even after assertions complete. Rewrote both smoke tests with `Start-Process` + file redirects (no pipeline, no `$LASTEXITCODE` coupling, explicit `exit 0`) — run 26125202534 green in 59 s.
  - **Artifact:** `WinNetPro-CLI-demo-001` at https://github.com/caseten-dx/WinNetPro/actions/runs/26125202534 (~33.6 MB compressed zip, ~108 MB `.exe`), retained until 2026-06-18.
- **Next:**
  - User smoke-tests the `.exe` on a Windows laptop and reports back. Minimum surface: no-args → usage, a real `profiles save` against the bundled fixtures, a `profiles apply --dry-run` against the saved profile. Anything Windows-specific (path separators, line endings, fixture resolution) is feedback we want before demo-002.
  - Demo-002 scoping conversation: real apply pipeline, snapshot/rollback (ADR-0004 steps 9-12), admin detection, the ADR-0006 description/alias warning emission carry-forward, plus the Electron GUI + parallel `build-gui.yml` workflow.

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
