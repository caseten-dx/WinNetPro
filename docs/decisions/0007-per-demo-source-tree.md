# ADR-0007: Per-demo source tree; canonical docs shared, code and overlays demo-local

- **Status:** Accepted
- **Date:** 2026-05-19
- **Decider:** Mike (architectural call); Claude Code (implementer)

## Context

WinNetPro is built to be demonstrated repeatedly to different audiences. Each demo session should:

1. Walk the audience through the canonical ADRs, specs, and BDDs.
2. Optionally accept audience tweaks (a new BDD, a clarified spec).
3. Have the agent implement a fresh codebase against those documents during the session.
4. Produce a unique `.exe` for that demo that the audience can run and test.
5. Be visibly separate from prior demos — no shared `dist/`, no "did I rebuild?" doubt.

A monolithic `src/` shared across demos creates several problems:

- The audience cannot tell whether they are seeing **today's** code or last week's.
- "Rerun the demo" requires either branch-juggling or destructive cleanup.
- Demo-2 cannot show "the agent rebuilding from scratch" because src/ already exists.

Each demo wants its own clean slate. But each demo also reads the **same** canonical specs — the teaching point depends on it.

## Decision

**The canonical `docs/` directory is shared across all demos. The `demos/` directory holds one subdirectory per demo session, each fully self-contained.**

```
WinNetPro/
├── docs/                  ← canonical, read-only-in-spirit during demos
│   ├── architecture/
│   ├── decisions/
│   ├── specs/
│   └── bdd/
└── demos/
    ├── README.md
    ├── 001-radio-dock-static/
    │   ├── package.json            ← pnpm workspace member
    │   ├── tsconfig.json
    │   ├── src/                    ← agent writes code here
    │   ├── tests/
    │   ├── evidence/               ← BDD evidence artifacts written here
    │   ├── fixtures/               ← demo-local fake-provider fixtures
    │   ├── spec-overrides.md       (optional)
    │   ├── bdd-additions/          (optional, demo-local feature files)
    │   └── dist/
    │       ├── WinNetPro-CLI-demo-001.exe
    │       └── WinNetPro-GUI-demo-001.exe
    └── 002-…/
```

### Reading rules

When the agent runs `/create-demo` and starts implementing, it reads:

1. All files in `docs/` (canonical).
2. `demos/N-<slug>/spec-overrides.md` if present — these overrides supersede anything in canonical specs **for this demo only**.
3. All `.feature` files in `demos/N-<slug>/bdd-additions/` if present — additional scenarios not (yet) in canonical.

### Writing rules

The agent writes only to `demos/N-<slug>/`. Canonical `docs/` are never modified mid-demo. If the audience proposes a permanent change, the agent captures it in `demos/N-<slug>/spec-overrides.md` and **`/closeout` is the only step that can promote overrides to canonical**.

### Build isolation

Each demo is a pnpm workspace package. `pnpm install` at repo root resolves all of them; `pnpm --filter demo-001 build:cli` builds only one. Each demo's `dist/` is in `.gitignore` so we do not commit binaries.

## Consequences

**Positive**

- Each demo produces an unmistakably distinct `.exe`. No confusion about which build is which.
- Audience can compare two demos side-by-side: `demos/001-radio-dock-static/src/` vs `demos/002-multi-adapter-rollback/src/` show what the agent did differently when given different (or extended) inputs.
- Canonical docs cannot be silently corrupted by mid-demo tweaks; `/closeout` is the gate.
- The teaching message — "the same canonical spec produces different implementations depending on what you ask the agent for" — is structural, not just narrated.

**Negative**

- Disk space grows with demo count (one `node_modules/` per demo, plus build output). Acceptable; `.gitignore` keeps the repo lean.
- Sharing code between demos requires either copy-paste or extracting to a `packages/` directory. Deferred until we feel the pain.

**Neutral**

- A demo's `spec-overrides.md` is the user-visible record of "what changed in this session." Audiences can read it at `/closeout` time before promotion decisions.
- The slug in the directory name (`001-radio-dock-static`) is the demo's permanent identifier. Pick carefully.
