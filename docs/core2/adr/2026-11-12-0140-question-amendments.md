# Replace changed Question definitions and repair dependencies

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Changing a Question definition or its prerequisites can invalidate current dependency meaning.

## Decision

<a id="amend-01"></a>

### AMEND-01 — Explicit replacement and dependency repair

**Disposition:** accepted. **Implementation:** unimplemented.

Change Question text/method/prerequisites only by explicit reviewed replacement, never in-place or through structural placement of an existing reference. Replacement starts unresolved even if predecessor resolved. Amendments must explicitly repair every affected current dependency; reject edges to superseded/retired Questions rather than auto-retargeting or copying resolution. Existing references are read-only.

**Recorded rationale:** A changed definition represents new work; preserving old answers is not permission to bypass it.

## Alternatives and supersession

- **AMEND-01:** No additional alternative is selected by this record.

## Consequences

Use reviewed replacement with unresolved new work and explicit graph repair, retaining historical answers as context instead of auto-retargeting or carrying resolution forward.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **AMEND-01:** `S28` — `rework/expedition-discovery.md`, lines 207–225; `S44` — `rework/proposal-structure.md`, lines 17–23.
