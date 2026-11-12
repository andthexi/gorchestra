# Return plain records through semantic domain operations

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation and paused domain design.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

A serializable domain record should not hold persistence behavior or a live resource lifetime.

## Decision

<a id="own-03"></a>

### OWN-03 — Plain domain records and semantic operations

**Disposition:** accepted. **Implementation:** unimplemented.

Return plain schema-derived records, not persistence entities/live connections. Consumers use domain capability namespaces and explicit intent verbs rather than generic set_status, public command/query architectural categories or raw storage. Internal commands/queries remain useful implementation categories.

**Recorded rationale:** Serializable data and explicit operations preserve authority without behavior-rich entity coupling.

## Alternatives and supersession

- **OWN-03:** No additional alternative is selected by this record.

## Consequences

Act through semantic domain namespaces with plain record IDs/inputs; command/query categories remain internal and no generic state-update bus is exposed.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **OWN-03:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 184–193,275–281; `S04` — `rework/aggregate-ownership.md`, lines 7.
