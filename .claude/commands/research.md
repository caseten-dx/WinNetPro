Scaffold a research note at `docs/research/<slug>.md`.

Research notes are exploratory. They are the right place for "I'm not sure how X should work yet, let me think through it." A research note either:

- **Promotes** to a spec (`docs/specs/<slug>.md`) once the topic is well-understood;
- **Promotes** to an ADR (`docs/decisions/NNNN-<slug>.md`) once a decision is made; or
- **Stays** in research and the conclusion is "we are not going to do this."

## Usage

```
/research <slug>
```

Example: `/research connectivity-probe-strategies`.

## Steps

1. **Validate the slug.** Kebab-case, lowercase, ≤ 64 chars.

2. **Check the file doesn't already exist.**

3. **Create the file** at `docs/research/<slug>.md`:

   ```markdown
   # Research: <title>

   - **Status:** Exploring
   - **Date opened:** YYYY-MM-DD
   - **Owner:** Mike + Claude

   ## Question

   <What we're trying to figure out.>

   ## Context

   <Why this is unsettled right now.>

   ## Options under consideration

   ### Option A — <name>
   <Pros / cons.>

   ### Option B — <name>
   <Pros / cons.>

   ## Tentative direction

   <Best current guess; subject to change.>

   ## Open questions

   <…>

   ## Resolution

   <Filled in when the research closes. Includes whether this became a spec, an ADR, or was dropped.>
   ```

4. **Surface the path** to the user.

## Rules

- Research notes don't go into evidence or BDDs. They are reasoning artifacts.
- A research note that has sat at `Status: Exploring` for more than a few sessions should be revisited at `/closeout`: promote, decide to drop, or rename and rescope.
