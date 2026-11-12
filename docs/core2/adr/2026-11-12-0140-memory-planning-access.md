# Keep reusable Memory authoring independent from planning

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation authoring; planning use paused and outside foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Reusable knowledge should be maintainable without an Expedition, while planning should cite exactly what it read.

## Decision

<a id="mem-03"></a>

### MEM-03 — User authoring and exact citations

**Disposition:** accepted. **Implementation:** unimplemented.

Users create/revise Memory independently of Expedition or Blueprint. Planning tools only browse existing revisions on demand within the authorized Portfolio and cite exact revision IDs; no redundant memoryId in citation, Project-selected context list, inherited snapshot, automatic injection, write authority or publication on completion. Later revisions never rewrite old citations or accepted work.

**Recorded rationale:** Reusable knowledge is independent from planning-produced proposals.

## Alternatives and supersession

- **MEM-03:** No additional alternative is selected by this record.

## Consequences

User authoring and immutable revisions are foundation scope; paused planning gets read-only on-demand access, not Project selection snapshots or publication authority.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **MEM-03:** `S39` — `rework/model-overview.md`, lines 153–157; `S48` — `rework/secret-memory-original-review.md`, lines 169–173; `S41` — `rework/pre-delivery-interactions.md`, lines 148–154.
