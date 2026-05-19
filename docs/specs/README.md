# Specs

Specifications are the **source of truth** for WinNetPro's behavior. Code implements specs; specs describe code. When they disagree, fix one of them and commit the resolution.

## Spec files

| File | What it answers |
|---|---|
| [product-spec.md](product-spec.md) | What is WinNetPro, what does it do for the user, what is in v1 vs deferred |
| [cli-spec.md](cli-spec.md) | Every CLI command, its arguments, its output, its exit codes |
| [gui-spec.md](gui-spec.md) | Every GUI window, panel, dropdown, button, and the events they emit |
| [profile-schema.md](profile-schema.md) | The on-disk JSON schema for profiles, snapshots, fixtures, and change plans |
| [safety-spec.md](safety-spec.md) | The complete mutation-safety model — dry-run, snapshot, rollback, validation, admin detection, ambiguity refusal |

## Reading order for new contributors / new audiences

1. **product-spec.md** — orientation.
2. **safety-spec.md** — non-negotiable invariants that constrain everything else.
3. **profile-schema.md** — the data the rest of the system passes around.
4. **cli-spec.md** — concrete behavior surface.
5. **gui-spec.md** — second surface, layered over the same use cases.

## Demo-local overrides

When an audience proposes a change to a spec mid-demo, the change does **not** land here. It lands in `demos/N-<slug>/spec-overrides.md` for that demo only.

At `/closeout`, any overrides that the user and audience agree should be permanent are promoted into the canonical spec via an explicit promotion step.

## Spec change discipline

- Specs change as a deliberate act, never as a side effect of writing code.
- A spec change commit is prefixed `[spec:<name>]`.
- A spec change that contradicts an ADR requires either a new ADR or an explicit "Status: Superseded" stamp on the old one.
- BDDs in `docs/bdd/` are the spec's executable form. A spec change that affects user-visible behavior must update or add a `.feature` scenario.
