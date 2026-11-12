# Use reads and polling instead of domain subscriptions

## Status

Decision disposition: deferred. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Consumers can observe domain changes through explicit reads before Core needs another subscription mechanism.

## Decision

<a id="cut-03"></a>

### CUT-03 — Notifications deferred

**Disposition:** deferred. **Implementation:** unimplemented.

No dedicated Portfolio domain-change subscriptions/notifications/pubsub or Python bridge relay. Consumers read/refresh after operations and poll for changes elsewhere; runtime streaming stays Consumer/runtime concern and never mutates Core implicitly.

**Recorded rationale:** Accept refresh latency/repeated reads before adding another propagation mechanism.

## Alternatives and supersession

- **CUT-03:** No additional alternative is selected by this record. The decision is to defer/exclude this capability, not approval of an unresolved implementation.

## Consequences

Use reads/refresh/polling with accepted latency/query costs; runtime token streaming is separate and may not silently update Core.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **CUT-03:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 1265–1271; `S20` — `rework/deferred-functionality.md`, lines 45.
