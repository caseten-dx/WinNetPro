# WinNetPro — Status

## Current phase

**Phase 0 — Foundation.** Repo scaffolded with CLAUDE.md, ADRs, specs, BDDs, slash commands, and subagents. No `src/` code exists yet. No demos have been created.

## Current focus

Next work is to run the first live demo: `/create-demo 001 "<slug>"` to scaffold `demos/001-…/src/`, then implement the vertical slice described in `docs/bdd/profile-save.feature` + `docs/bdd/profile-apply-dry-run.feature` using the fake provider, and produce `WinNetPro-CLI-demo-001.exe`.

## Open questions

- Final demo-1 slug to be chosen by the user at demo time (e.g., `radio-dock-static`).
- Whether to bundle a pre-built GUI `.exe` for demo-1 or defer the GUI to demo-2.

## Recent sessions (rolling 5)

### 2026-05-19 — Repo scaffolded from agentic-engineering-Hello-World concept

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
