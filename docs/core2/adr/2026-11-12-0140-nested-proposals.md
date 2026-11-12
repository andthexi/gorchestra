# Represent proposed containment and order without synthetic keys

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

New proposal parts need a reviewable structural relationship instead of agent-created identity maps.

## Decision

<a id="nest-01"></a>

### NEST-01 — Key-free containment

**Disposition:** accepted. **Implementation:** unimplemented.

Use nesting for new Map/Blueprint parts (Delivery contains Slices; Evidence/Instruction stay with owner). No generated local keys, title lookups/index references or synthetic IDs as substitutes. Existing persisted Core IDs can identify scoped current amendment targets/context references, not new-part keys; proposal-version acceptance identity remains Core-generated.

**Recorded rationale:** Direct structure avoids invented cross-reference identity maintenance.

<a id="nest-02"></a>

### NEST-02 — Sequence and parallel groups

**Disposition:** accepted. **Implementation:** unimplemented.

Use nested sequence/parallel groups for Question order, Delivery order within Blueprint and Slice order within Delivery. Sequence waits left-to-right; parallel children impose no mutual ordering; a following sequence child waits for the whole prior group. Groups are structural values, not work records; Core derives dependency edges. No copied-object deduplication or arbitrary key-referenced DAG promise.

**Recorded rationale:** Structured joins express selected workflows without a general programmable interpreter; prerequisite trees were unselected alternative.

## Alternatives and supersession

- **NEST-01:** No additional alternative is selected by this record.
- **NEST-02:** No additional alternative is selected by this record.

## Consequences

Structured graphs are intentionally less expressive than arbitrary DAGs; exact serialized group/wrapper fields remain open.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **NEST-01:** `S44` — `rework/proposal-structure.md`, lines 9–19; `S18` — `rework/blueprint-lifecycle.md`, lines 142–144.
- **NEST-02:** `S44` — `rework/proposal-structure.md`, lines 37–58.
