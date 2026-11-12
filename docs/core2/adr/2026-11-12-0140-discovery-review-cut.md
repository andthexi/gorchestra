# Omit a separate discovery output and review layer

## Status

Decision disposition: deferred. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Pre-delivery proposal acceptance already supplies human review of discovery outcomes.

## Decision

<a id="disc-05"></a>

### DISC-05 — No extra discovery review layer

**Disposition:** deferred. **Implementation:** unimplemented.

Exclude discovery Artifact/Surface/Feedback/Review/ReviewVerdict records or workflows. Discovery facts, embedded Evidence and human proposal acceptance are sufficient; external outputs can be cited directly and feedback stays in Hermes chat. Blueprint acceptance/verdict remains its own domain fact, not a second Review.

**Recorded rationale:** Avoid an extra result/review model layer without removing human assessment.

## Alternatives and supersession

- **DISC-05:** No additional alternative is selected by this record. The decision is to defer/exclude this capability, not approval of an unresolved implementation.

## Consequences

No parallel discovery Artifact/Surface/Feedback/Review layer is added. External outputs remain usable Evidence and broader execution-review ownership is retained only as parked design.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **DISC-05:** `S39` — `rework/model-overview.md`, lines 125–131; `S41` — `rework/pre-delivery-interactions.md`, lines 11–15; `S20` — `rework/deferred-functionality.md`, lines 39.
