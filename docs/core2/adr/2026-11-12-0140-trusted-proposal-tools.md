# Bind proposal tools to trusted Consumer interaction context

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Model-generated IDs must not choose caller, approval or unrelated interaction targets.

## Decision

<a id="hermes-03"></a>

### HERMES-03 — Trusted tool binding

**Disposition:** accepted. **Implementation:** unimplemented.

Consumer binds current Hermes session to exactly its AgentInteraction; model arguments contain proposed content, not arbitrary target/actor/approval IDs. Core derives target and verifies purpose/state/result-kind, then scope-validates any content references. Missing/ambiguous binding never falls back to global current target.

**Recorded rationale:** Avoid contradictory routing inputs and untrusted authority selection.

## Alternatives and supersession

- **HERMES-03:** No additional alternative is selected by this record.

## Consequences

Consumer supplies trusted current-interaction binding; Core derives target and validates content references. Missing/ambiguous binding fails rather than selecting a global default.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **HERMES-03:** `S41` — `rework/pre-delivery-interactions.md`, lines 92–100; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 1003.
