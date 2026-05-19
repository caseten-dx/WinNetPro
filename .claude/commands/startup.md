Start a WinNetPro work session: drift-check the repo, ground in current state, identify what the user wants to do next.

Usage:

```
/startup            # implicit: WinNetPro
/startup WinNetPro  # explicit; the arg is mnemonic for the audience
```

## Steps

1. **Drift check.**
   - `git -C ~/Developer/WinNetPro fetch origin` (skip silently if no `origin` remote configured yet)
   - `git -C ~/Developer/WinNetPro status --porcelain`
   - `git -C ~/Developer/WinNetPro rev-list --count main..origin/main` (skip if no `origin`)
   - If working tree non-empty: surface to user; do not proceed without their decision (auto-stash, leave in place, or commit — user picks).
   - If `main` behind `origin/main`: `git -C ~/Developer/WinNetPro pull --ff-only origin main`, surface new commits.

2. **Read STATUS.md only.** Do not load other docs unless the work requires them. The doc map in `CLAUDE.md` says when to load what.

3. **Identify what the user wants to do.** Two common cases:
   - **"Create Demo N"** — the user wants a fresh demo. Confirm the slug, then run `/create-demo N "<slug>"`.
   - **Continue work in an existing demo** — STATUS.md will name the active demo. Surface its current state.
   - **Spec / ADR work** — the user wants to revise canonical docs before any code. STATUS.md plus the change request scope what's needed.
   - Other — ask.

4. **Report back:**
   - drift-check result (clean / fast-forwarded / stash created / pending user)
   - current phase
   - active demo (if any), and which BDD or step is in progress
   - what the user appears to want next (with confirmation if ambiguous)
   - any blockers

## Rules

- Do not read more than STATUS.md unless the planned work explicitly needs more context.
- If the user invokes `/startup` with no arg, treat it as `/startup WinNetPro`. The arg is for clarity in front of an audience.
- The audience may be watching the agent's text output in this session — narrate briefly (one sentence per phase) so they can follow.
