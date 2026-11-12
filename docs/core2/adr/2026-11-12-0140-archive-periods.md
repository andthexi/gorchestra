# Retain Archive Period history without generic archival

## Status

Decision disposition: deferred. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Existing Archive Period vocabulary describes reversible history, not a universal new archive service.

## Decision

<a id="cut-01"></a>

### CUT-01 — Archive Period retained

**Disposition:** deferred. **Implementation:** unimplemented.

Retain record-owned reversible Archive Period history: archive starts a period, unarchive closes it; current state derives from latest period, not a second flag. Not deletion, automatic immutability or independent aggregate. Defer generic cross-model archive service/cascades; do not restore excluded Project/Asset/Secret operations or host runtime models.

**Recorded rationale:** Vocabulary retention is distinct from per-model capability scope.

## Alternatives and supersession

- **CUT-01:** No additional alternative is selected by this record. The decision is to defer/exclude this capability, not approval of an unresolved implementation.

## Consequences

Retain the concept and derive current archival status from periods, but generic expansion and redesigned Project/Asset/Secret operations remain excluded.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **CUT-01:** `S04` — `rework/aggregate-ownership.md`, lines 53–59; `S20` — `rework/deferred-functionality.md`, lines 52,143.
