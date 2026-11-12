# Exclude Project archival and deletion

## Status

Decision disposition: deferred. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Minimal Project setup does not need archive/deletion/cascade behavior, even for empty or mistaken records.

## Decision

<a id="project-03"></a>

### PROJECT-03 — No retirement or deletion

**Disposition:** deferred. **Implementation:** unimplemented.

Exclude Project archive/unarchive/delete, including empty or mistaken Projects. No disabled/soft-delete flag, Archive Period, or cascade substitutes.

**Recorded rationale:** Avoid adding lifecycle/cascade rules to minimal Project setup; this is not a future cleanup commitment.

## Alternatives and supersession

- **PROJECT-03:** No additional alternative is selected by this record. The decision is to defer/exclude this capability, not approval of an unresolved implementation.

## Consequences

Records remain available. No hidden flags or cleanup promise substitutes for the excluded capability.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **PROJECT-03:** `S43` — `rework/project-source.md`, lines 56–60; `S20` — `rework/deferred-functionality.md`, lines 54.
