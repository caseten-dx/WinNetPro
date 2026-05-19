Scaffold a new ADR (Architecture Decision Record) at `docs/decisions/NNNN-<slug>.md`.

Usage:

```
/adr <slug>
```

Example: `/adr powershell-provider-error-handling`.

## Steps

1. **Pick the next number.** List `docs/decisions/`, find the highest existing `NNNN-` prefix, increment by one. Zero-pad to 4 digits.

2. **Validate the slug.** Kebab-case, lowercase, no spaces, ≤ 64 chars.

3. **Create the file** at `docs/decisions/NNNN-<slug>.md` using this template:

   ```markdown
   # ADR-NNNN: <one-line title>

   - **Status:** Draft
   - **Date:** YYYY-MM-DD (today, ISO)
   - **Decider:** Mike (architectural call); Claude Code (implementer)

   ## Context

   <Why this decision is being made. What's pulling in different directions. What we considered.>

   ## Decision

   <The single clear decision. Use concrete code/CLI/JSON when it sharpens things.>

   ## Consequences

   **Positive**

   - <…>

   **Negative**

   - <…>

   **Neutral**

   - <…>
   ```

4. **Open it for editing.** Surface the path to the user; they fill in the body, or we co-write it.

## Rules

- ADRs are immutable once `Status: Accepted`. To change one, write a new ADR that supersedes it and update the old one to `Status: Superseded by ADR-NNNN`.
- Commit ADR additions with `[ADR-NNNN]` prefix in the commit message.
- An ADR that contradicts an existing one without superseding it is a process violation. Fix during arch-reviewer.
