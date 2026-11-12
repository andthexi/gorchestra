# Use a thin Hermes bridge and one-shot TypeScript host

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

The runtime owns conversation and execution; the reusable Core owns domain invariants and accepted state.

## Decision

<a id="hermes-01"></a>

### HERMES-01 — One-shot architecture

**Disposition:** accepted. **Implementation:** unimplemented.

The Hermes distribution is a plugin with Python bridge, desktop UI and TypeScript AgentRuntime adapter/one-shot Node host using Hermes public API. Python registers tools/routes, launches one JSON command/query invocation, supplies trusted endpoint/auth context without command-line credentials, maps identity/errors and returns JSON. Core validates/transacts; Node exits. No long-running Gorchestra daemon, direct Python Core-store writes or duplicated domain rules.

**Recorded rationale:** Keep domain semantics reusable while Hermes owns its platform integration.

## Alternatives and supersession

- **HERMES-01:** No additional alternative is selected by this record.

## Consequences

Hermes integration is paused/unimplemented and no current API behavior has been newly verified by this documentation task.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **HERMES-01:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 100–118,987–1005,1023–1025,1050–1075.
