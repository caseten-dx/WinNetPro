Scaffold a new live-demo source tree under `demos/N-<slug>/`. This is the foundational slash command for the teaching workflow.

Usage:

```
/create-demo 1 "radio-dock-static"
/create-demo 2 "multi-adapter-rollback"
```

The first arg is the demo number (zero-padded to 3 digits in the directory name). The second is the slug.

## Steps

1. **Validate inputs.**
   - Number must be an integer ≥ 1.
   - Slug must be kebab-case, lowercase, no spaces.
   - Directory `demos/<NNN>-<slug>/` must not already exist (per ADR-0007 demos are immutable once created; new attempt = new number).

2. **Create the demo directory structure:**

   ```
   demos/NNN-<slug>/
   ├── package.json         (pnpm workspace member, name = "demo-NNN")
   ├── tsconfig.json        (extends ../../tsconfig.json, scopes include to ./src)
   ├── src/                 (EMPTY — the agent fills this from canonical docs)
   │   ├── domain/
   │   ├── application/
   │   ├── infrastructure/
   │   └── cli/
   ├── tests/
   ├── evidence/            (BDD evidence files land here)
   ├── fixtures/
   │   └── adapters.json    (a starter fixture with 3 adapters — see template below)
   ├── bdd-additions/       (empty directory)
   └── README.md            (demo-local notes)
   ```

3. **Write `demos/NNN-<slug>/package.json`:**

   ```json
   {
     "name": "demo-NNN",
     "version": "0.0.0",
     "private": true,
     "type": "module",
     "scripts": {
       "test": "tsx --test tests/**/*.test.ts",
       "typecheck": "tsc --noEmit",
       "build:cli": "node ../../scripts/build-cli-sea.mjs NNN <slug>",
       "build:gui": "node ../../scripts/build-gui-electron.mjs NNN <slug>",
       "check": "pnpm typecheck && pnpm test"
     },
     "devDependencies": {
       "typescript": "^5.6.0",
       "tsx": "^4.19.0",
       "@types/node": "^22.0.0"
     }
   }
   ```

   Build scripts (`scripts/build-cli-sea.mjs`, `scripts/build-gui-electron.mjs`) are added on first demo creation if not present.

4. **Write `demos/NNN-<slug>/tsconfig.json`:**

   ```json
   {
     "extends": "../../tsconfig.json",
     "compilerOptions": { "noEmit": true },
     "include": ["src/**/*.ts", "tests/**/*.ts"]
   }
   ```

5. **Write `demos/NNN-<slug>/fixtures/adapters.json`** — a starter fixture with 3 adapters matching the BDD scenarios (built-in Ethernet, USB radio NIC, Wi-Fi). Use the schema from `docs/specs/profile-schema.md`.

6. **Write `demos/NNN-<slug>/README.md`** — one paragraph: which slug, which canonical BDDs this demo intends to implement, which (if any) demo-local additions or overrides exist.

7. **Update STATUS.md** "Current focus" to point at this demo.

8. **Prompt the user.** Now offer them the next step:
   - "Demo NNN-<slug> scaffolded. Ready to implement. Should I read canonical docs and start the vertical slice for `profile-save.feature` + `profile-apply-dry-run.feature`?"

## Rules

- Never create a demo that overwrites an existing one. Always pick a higher number.
- Do not write any `src/` code in this command. `/create-demo` only scaffolds; implementation happens in a follow-up turn after the audience has reviewed the docs.
- The build scripts (`scripts/build-cli-sea.mjs`, `scripts/build-gui-electron.mjs`) are created once and reused across demos. If they already exist, do not overwrite.
- If `pnpm-workspace.yaml` doesn't include `demos/*`, fail loud — that's a repo invariant.
