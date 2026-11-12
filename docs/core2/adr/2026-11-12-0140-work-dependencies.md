# Keep work dependencies local and two-level

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Dependency ownership belongs to dependent work, while acceptance needs a bounded graph that can be validated coherently.

## Decision

<a id="bp-06"></a>

### BP-06 — Local two-level dependencies

**Disposition:** accepted. **Implementation:** unimplemented.

Allow Delivery prerequisites only inside the same Blueprint, and Slice prerequisites only inside one Delivery; no cross-Delivery Slice, mixed-level or external Blueprint/Expedition edges. Validate references/cycles before materialization. Dependencies belong to dependent work’s aggregate, not a graph root; contextual citations are not dependency edges.

**Recorded rationale:** Self-contained graph acceptance trades finer ordering for simpler validation; external coordination remains manual.

## Alternatives and supersession

- **BP-06:** No additional alternative is selected by this record.

## Consequences

Support same-Blueprint Delivery edges and within-Delivery Slice edges only; cross-context order stays manual, without a graph aggregate or mixed-level dependencies.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **BP-06:** `S18` — `rework/blueprint-lifecycle.md`, lines 124–152; `S04` — `rework/aggregate-ownership.md`, lines 190–196.
