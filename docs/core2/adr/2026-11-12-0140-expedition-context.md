# Version complete Expedition context bundles

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Objective, notes, boundaries and Unknowns change as one reviewed context bundle rather than independent tracked work.

## Decision

<a id="disc-03"></a>

### DISC-03 — Context values and versions

**Disposition:** accepted. **Implementation:** unimplemented.

Unknowns, notes, boundaries and objective are values, not independently identified work. Accepted context changes create immutable Expedition-owned full-bundle versions with explicit current reference and directly readable history. Initial charting supplies complete bundle; later replacement supplies complete bundle or omits it to preserve current. No field patches, whole-Map replacement or audit-diff reconstruction.

**Recorded rationale:** Version one atomic context bundle without duplicating Question/Finding/Decision collections.

## Alternatives and supersession

- **DISC-03:** No additional alternative is selected by this record.

## Consequences

Accepted complete replacement creates an immutable version; omitted context preserves current. Map facts are not copied into that bundle or reconstructed from audit diffs.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **DISC-03:** `S28` — `rework/expedition-discovery.md`, lines 221–225; `S04` — `rework/aggregate-ownership.md`, lines 318–324; `S42` — `rework/pre-delivery-mvp.md`, lines 147.
