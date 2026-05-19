# ADR-0005: IPv4 mutation in v1; IPv6 inherit-only

- **Status:** Accepted
- **Date:** 2026-05-19
- **Decider:** Mike (architectural call); Claude Code (implementer)

## Context

The product is targeted at field engineers connecting devices like radios, PLCs, docks, and embedded test equipment. Those devices are nearly all IPv4 in practice. The user community we are teaching with this demo (per the source conversation) overwhelmingly thinks in IPv4 terms — address, subnet mask, gateway.

IPv6 introduces real complexity that does not pay off in a teaching demo:

- Prefix length instead of subnet mask — different mental model.
- Multiple configuration modes (static, DHCPv6, SLAAC, link-local-only) that interact with router advertisements.
- Multiple addresses per interface (link-local + global + temporary + DHCPv6).
- Routing influenced by Router Advertisements as well as configured gateways — apply-and-verify becomes ambiguous.
- DNS configuration shared with IPv4 at the interface level on Windows.

A demo that says "the agent built a working IPv4 tool, see how it followed the spec" lands. A demo that bogs down in IPv6 multi-address semantics does not.

We do not want to **architecturally exclude** IPv6, though. A profile schema that only has an IPv4 block has to be re-shaped later — expensive. Better to model IPv6 in the schema from day one and just not implement mutation yet.

## Decision

**v1 implements IPv4 mutation. IPv6 is represented in the profile schema and the change-plan output, but is treated as `inherit` — meaning "do not modify."**

Profile schema (excerpt, full version in `docs/specs/profile-schema.md`):

```json
{
  "ipv4": {
    "mode": "static",                  // or "dhcp"
    "address": "192.168.132.10",       // null if dhcp
    "prefixLength": 24,                // null if dhcp
    "gateway": null,                   // optional even for static
    "dns": { "mode": "inherit", "servers": [] }
  },
  "ipv6": {
    "mode": "inherit"                  // v1: ONLY this value is valid
  }
}
```

CLI behavior:

- `profiles apply` constructs a change plan whose IPv6 section always reads `"mode": "inherit"`.
- The provider receives no IPv6 mutation instructions.
- The verify step (ADR-0004 step 7) confirms IPv4 state matches the plan; IPv6 state is read and reported but not verified-against-plan.

Validation:

- A profile with `"ipv6.mode"` set to anything other than `"inherit"` fails domain validation in v1 with a clear "IPv6 mutation not supported in v1" error.
- The schema *file* documents `"auto"`, `"static"`, `"disabled"` as future values.

## Consequences

**Positive**

- Demo time budget is preserved. IPv4 alone is teachable in 30–40 minutes.
- The schema is forward-compatible: adding IPv6 mutation later is purely additive.
- BDD scenarios in v1 can ignore IPv6 except for "the dry-run plan reports IPv6 as inherit" as a single anchor scenario.

**Negative**

- A user on a pure-IPv6 network gets no value from v1. Acceptable; that audience is not the demo target.
- "Inherit" as a mode requires explanation in the spec to distinguish from "auto" (DHCPv6/SLAAC) and "disabled" (turn IPv6 off). Documented.

**Neutral**

- v2 adds IPv6 mutation modes one at a time, each its own ADR.
- The change-plan JSON has an IPv6 section from day one so downstream tools (and the GUI) do not have to learn a new shape later.
