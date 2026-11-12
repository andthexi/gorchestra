# Keep discovery facts in Expedition and derive Map and Frontier

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Map describes current understanding but must not duplicate authoritative facts or turn citations into another registry.

## Decision

<a id="disc-01"></a>

### DISC-01 — Expedition-owned records

**Disposition:** accepted. **Implementation:** unimplemented.

Expedition is an independent aggregate belonging to a Project and owns Questions, Findings, Decisions, context versions and Blueprints/revisions/verdicts. Question/AgentInteraction producer references establish provenance, not ownership of Findings/Decisions. Blueprint namespace does not make Blueprint independent.

**Recorded rationale:** The bounded undertaking supplies discovery consistency authority.

<a id="disc-02"></a>

### DISC-02 — Derived views

**Disposition:** accepted. **Implementation:** unimplemented.

Map is an assembled Expedition read model from objective/Destination, notes, boundaries, Unknowns and applicable discovery records; no separate edited Map aggregate/document or update-Map operation. Frontier derives current open, unblocked, unclaimed Questions, never stored as separate authority. Draft preview is labeled interaction proposal, not authoritative Map.

**Recorded rationale:** Avoid two live representations of the same understanding.

## Alternatives and supersession

- **DISC-01:** No additional alternative is selected by this record.
- **DISC-02:** No additional alternative is selected by this record.

## Consequences

Schema field names not explicitly selected remain open; context history and fact history are distinct.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **DISC-01:** `S04` — `rework/aggregate-ownership.md`, lines 128–160; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 517–525,761–765.
- **DISC-02:** `S04` — `rework/aggregate-ownership.md`, lines 112–126; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 677–721.
