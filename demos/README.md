# Demos

This directory holds one subdirectory per live demo session. Each demo is **self-contained**: its own `src/`, its own tests, its own evidence, its own `.exe` artifacts. They share only the canonical documentation in `docs/` at the repo root.

## The demo workflow

The whole point of WinNetPro is to demonstrate that an AI coding agent — driven from BDDs, ADRs, and specs — can build inspectable, testable software live in front of an audience. A demo session has six phases:

### Phase 1 — Open the project

```
/startup WinNetPro
```

The agent does a drift check, reads `STATUS.md`, and reports current state.

### Phase 2 — Walk the audience through the docs

This is the **teaching moment** of the demo. Open these in order and talk through them:

1. `README.md` — what the project is.
2. `docs/architecture/winnetpro-architecture.md` — one-diagram view.
3. `docs/decisions/0001-cli-first-architecture.md` and `0002-provider-abstraction-fake-default.md` — the two ADRs that explain the most about why the code will look the way it does.
4. `docs/specs/product-spec.md` — what the product does.
5. `docs/bdd/profile-save.feature` and `docs/bdd/profile-apply-dry-run.feature` — the canonical scenarios for the vertical slice this demo will implement.

If the audience wants to tweak anything mid-demo — "what if we also want a `--verify-with-ping` flag?" — capture the tweak in `demos/NNN-<slug>/spec-overrides.md` (created on demand). Do **not** modify canonical docs mid-demo.

### Phase 3 — Create the demo source tree

```
/create-demo 1 "<your-slug>"
```

Slugs are kebab-case, lowercase. Suggested slugs for early demos:

- `001-radio-dock-static` — the canonical vertical slice (Workflow A from `product-spec.md`).
- `002-multi-adapter-rollback` — adds the rollback BDDs as the focus.
- `003-gui-over-cli` — emphasizes that the GUI calls the same use cases as the CLI.

After `/create-demo`, the agent has scaffolded `demos/NNN-<slug>/` with `src/`, `tests/`, `fixtures/`, and `package.json`. No code yet.

### Phase 4 — Implement the vertical slice

Ask the agent:

> Read the canonical docs and the demo-local overlays. Implement the vertical slice satisfying `docs/bdd/profile-save.feature` and `docs/bdd/profile-apply-dry-run.feature`. Use Red/Green TDD. Use the fake provider only. Do not touch `--real` paths in this demo.

The agent should:

1. Write failing tests in `tests/` against domain validation first.
2. Implement minimal domain code under `src/domain/` to make them pass.
3. Move outward: `src/application/` use cases, then `src/infrastructure/FakeProvider.ts`, then `src/cli/`.
4. Produce BDD evidence files in `demos/NNN-<slug>/evidence/` for each scenario.
5. Run `arch-reviewer` against the diff.
6. Run `bdd-evidence-reviewer` against the evidence.

### Phase 5 — Build the executable(s)

```
pnpm --filter demo-001 build:cli      # produces dist/WinNetPro-CLI-demo-001.exe
pnpm --filter demo-001 build:gui      # produces dist/WinNetPro-GUI-demo-001.exe (if implemented)
```

`build:cli` should complete in under 30 seconds via Node SEA. `build:gui` is typically pre-built before the demo.

If the GUI was not implemented in this demo (which is fine — demos can focus on the CLI), `build:gui` may be skipped or may use a pre-built artifact.

### Phase 6 — Distribute and verify

Copy the `.exe`(s) from `demos/NNN-<slug>/dist/` to a shared location. Audience members run them on their machines (fake provider only unless explicitly arranged) and compare behavior to the BDDs on screen.

### Phase 7 — Close out

```
/closeout
```

The agent:

- Updates `STATUS.md` with a session entry.
- Asks whether to promote any demo-local BDD additions to canonical (`docs/bdd/`).
- Asks whether to fold any `spec-overrides.md` content into canonical specs.
- Commits and pushes.

## Demo directory shape

Every demo follows the same structure (created by `/create-demo`):

```
demos/NNN-<slug>/
├── README.md                ← what this demo is and what it implements
├── package.json             ← pnpm workspace member; build scripts
├── tsconfig.json            ← extends repo root tsconfig
├── src/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── cli/
├── tests/
├── evidence/                ← BDD evidence artifacts (Markdown + JSON)
├── fixtures/
│   └── adapters.json        ← FakeProvider input
├── bdd-additions/           ← demo-local .feature files (optional)
├── spec-overrides.md        ← demo-local spec deviations (optional)
└── dist/                    ← gitignored; built .exe artifacts land here
```

## What makes a demo "good"

- **Inspectable.** The audience can read the BDDs, the spec sections they target, the test output, the evidence file, and the dry-run JSON, and follow what the agent did at each step.
- **Honest.** The agent did not skip steps. Red/Green was visible. Evidence files were not paraphrases.
- **Reproducible.** Anyone with the repo can re-run `/create-demo` with a new number, ask the agent to implement the same canonical BDDs, and get a functionally equivalent result (even if the code structure varies).
- **Safe.** Real Windows mutation was either not attempted or was attempted with `--real --yes --dry-run` (i.e., still showed plan only). Audience machines did not get reconfigured.

## What goes wrong

- **The agent skips Red/Green and writes implementation first.** Catch this by asking it to show its first failing test before continuing.
- **The agent writes mocks instead of using the FakeProvider.** Mocks bypass the architecture; FakeProvider *is* the test infrastructure (ADR-0002).
- **The agent modifies canonical docs mid-demo.** Catch this by checking `git status` periodically; canonical docs should not appear in the diff during phase 4.
- **The build takes longer than the demo budget.** Pre-build the GUI; use Node SEA for the CLI.
- **The audience proposes a tweak that turns into a fundamental redesign.** Capture in `spec-overrides.md` but defer the redesign to a future ADR; do not redesign on stage.
