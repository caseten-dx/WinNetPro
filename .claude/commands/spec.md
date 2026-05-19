Scaffold a new spec at `docs/specs/<slug>.md` from the standard WinNetPro spec template.

Usage:

```
/spec <slug>
```

Example: `/spec connectivity-probe`.

## Steps

1. **Validate the slug.** Kebab-case, lowercase, no spaces, ≤ 64 chars.

2. **Check the file doesn't already exist.**

3. **Create the file** at `docs/specs/<slug>.md` using this template:

   ```markdown
   # <Title> Spec — WinNetPro v?

   ## Purpose

   <What this spec covers and why it exists.>

   ## Scope

   ### In

   - <…>

   ### Out

   - <…>

   ## Behavior

   <Concrete behavior: commands, fields, state transitions. Use tables where useful.>

   ## Invariants

   <Non-negotiable properties this spec preserves. Cross-reference relevant ADRs.>

   ## Open questions

   <Anything deliberately undecided. Each one should either resolve or get its own ADR.>
   ```

4. **Update `docs/specs/README.md`** to add the new spec to the file table.

5. **Surface the path to the user** for editing.

## Rules

- Spec changes are deliberate. Don't update a spec as a side effect of writing code.
- A spec change that affects user-visible behavior must update or add a `.feature` scenario in `docs/bdd/`.
- Commit spec additions with `[spec:<slug>]` prefix.
