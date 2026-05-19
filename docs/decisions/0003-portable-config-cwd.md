# ADR-0003: Portable config; profiles and snapshots live in the current working directory

- **Status:** Accepted
- **Date:** 2026-05-19
- **Decider:** Mike (architectural call); Claude Code (implementer)

## Context

WinNetPro is distributed as a single unsigned `.exe`. There is no installer. The audience for any given demo is going to:

1. Receive the `.exe` over some channel (Slack, USB stick, network share).
2. Drop it into a folder.
3. Double-click or run from PowerShell.

They will not run an installer. They will not edit a registry key. They will not look in `%APPDATA%`. They expect "this directory" to be the entire footprint.

We considered three options for where profiles/snapshots/logs live:

- **(a)** Next to the `.exe` (executable directory).
- **(b)** Per-user in `%APPDATA%/WinNetPro/`.
- **(c)** Current working directory.

(a) breaks when the `.exe` is placed in `C:\Program Files\` or any other write-protected directory.
(b) works but hides state from the audience — they cannot inspect a JSON file they cannot find.
(c) makes state visible exactly where the user ran the command. Multiple isolated WinNetPro setups can coexist by `cd`-ing into different directories.

(c) also aligns with the per-demo source-tree pattern (ADR-0007): each demo run can use its own subdirectory of fixtures and profiles, and the audience can `dir` to see them all.

## Decision

**Profiles, rollback snapshots, fixtures, and logs are stored in (or read from) the process's current working directory** — *not* the directory containing the `.exe`.

The on-disk layout, relative to CWD:

```
./profiles.json          # all saved profiles, JSON array
./snapshots/             # rollback snapshots, one JSON per snapshot
./fixtures/              # fake-provider fixtures (in demo + dev contexts)
./logs/winnetpro.log     # operational log
```

The CLI accepts `--config-dir <path>` to override the CWD-default for advanced use, but the documented default is "wherever you ran the command."

The GUI displays the resolved config directory prominently in its status bar so the audience can see where state lives.

## Consequences

**Positive**

- Trivial to demo: `cd demo-folder && WinNetPro-CLI-demo-001.exe profiles list` shows exactly what's in `./profiles.json`.
- Multiple parallel WinNetPro setups (e.g., "this folder is for lab; this folder is for field") work with zero config.
- Audience can edit a profile by opening `profiles.json` in Notepad. Inspectable.
- No write permissions to `C:\Program Files\` needed.

**Negative**

- A user who runs the `.exe` from `C:\Users\Mike\Desktop\` and then later from `C:\Users\Mike\Documents\` will see two different profile sets. This is a *feature* in our model but may surprise users expecting `%APPDATA%` semantics. Documented in the spec.
- Running from a network share with read-only permissions will fail. Acceptable; documented.

**Neutral**

- If someone ever wants a "user-default profile set," they can `cd` to a known directory or use `--config-dir`. We do not need to add an environment variable now.
