# Defer abandonment and runtime cancellation controls

## Status

Decision disposition: deferred. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Rejection requests refinement rather than terminal abandonment. Extra cancellation/control workflows were not selected.

## Decision

<a id="int-05"></a>

### INT-05 — Abandonment and control deferral

**Disposition:** deferred. **Implementation:** unimplemented.

Defer dedicated user-abandonment of unaccepted interactions and Core runtime mid-run steering/cancellation. Pending work can remain until resumed/refined/accepted; technical failure handling remains separately required. Normal Hermes chat steering is not removed.

**Recorded rationale:** The MVP accepts less cleanup/restart control instead of inventing an extra terminal transition.

## Alternatives and supersession

- **INT-05:** No additional alternative is selected by this record. The decision is to defer/exclude this capability, not approval of an unresolved implementation.

## Consequences

Unaccepted work may remain pending. Normal Hermes conversation steering and separately specified technical-failure outcomes do not imply a Core cancellation API.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **INT-05:** `S28` — `rework/expedition-discovery.md`, lines 245–249; `S20` — `rework/deferred-functionality.md`, lines 43; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 891–893.
