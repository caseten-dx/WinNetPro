End a WinNetPro work session: update STATUS.md, optionally promote demo-local BDDs to canonical, commit, and push.

## Steps

1. **Summarize the session.** Read working memory of what was done this session. Group into:
   - artifacts created or changed (canonical docs, demo files, code, evidence)
   - decisions made (any ADR additions, spec amendments)
   - tests added (unit + BDD)
   - blockers or open questions

2. **Update STATUS.md.**
   - Roll the existing "Recent sessions" list: keep the most recent 5 entries.
   - Add a new top entry dated today, summarizing this session per the bullet structure used by prior entries (Goal / Source / Done / Next).
   - Update "Current phase" and "Current focus" if they changed.
   - Update "Open questions" if any new ones surfaced or any prior ones closed.

3. **If this session was a demo run, handle demo-local BDDs.**
   - Check `demos/N-<slug>/bdd-additions/` for any new `.feature` files.
   - For each, ask the user: **promote to canonical** (`docs/bdd/`), **keep demo-local**, or **delete**.
   - Move the files accordingly. Promoted files are renamed if needed to avoid collisions.
   - Same treatment for `demos/N-<slug>/spec-overrides.md` if present: ask whether to fold into the relevant canonical spec.

4. **Run arch-reviewer on the diff.** Catch invariant violations before commit.

5. **Run bdd-evidence-reviewer if BDD evidence files were produced this session.**

6. **Commit.**
   - One commit per coherent change is the norm, but a closeout may legitimately be one combined commit covering STATUS + promotions + minor cleanup.
   - Message prefixes (use the one that fits):
     - `[demo:NNN]` for demo work
     - `[spec:<name>]` for canonical spec changes
     - `[ADR-NNNN]` for ADR additions
     - `Closeout YYYY-MM-DD:` for the session-summary commit
   - Always include the "why" in the body, not just the what.

7. **Push** if `origin` is configured.

## Rules

- STATUS.md is the only place rolling history lives; do not duplicate it elsewhere.
- Demo-local BDD promotion is an explicit step. Never silently merge demo overrides into canonical.
- If arch-reviewer flags a blocker, do not commit. Fix or surface to user.
- A "closeout" with no changes is fine; still update STATUS.md if anything was learned worth recording.
