# Retain runtime portability while deferring the concrete port

## Status

Decision disposition: deferred. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

The generic runtime category is accepted, but its concrete interface and injection timing are not.

## Decision

<a id="port-04"></a>

### PORT-04 — Runtime-neutral integration category

**Disposition:** deferred. **Implementation:** unimplemented.

AgentRuntime remains a Consumer integration category; Core does not know Hermes IDs/profiles/model configuration/transcripts/turns/tool streams. Use opaque runtime provenance and logical purposes/roles with host mapping. Exact methods/handles/configuration/injection timing are deferred: the conceptual openSession/submit/inspect sketch is not a finalized interface. Do not require unknown/no-op runtime dependencies or optional callbacks that only fail when called in foundation.

**Recorded rationale:** Keep portability without promoting an unfinished runtime contract into construction requirements.

## Alternatives and supersession

- **PORT-04:** No additional alternative is selected by this record. The decision is to defer/exclude this capability, not approval of an unresolved implementation.

## Consequences

Foundation constructs only storage plus secrets dependencies. No unknown/no-op runtime object or optional fail-on-use placeholders are introduced to make unimplemented scope appear available.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **PORT-04:** `S35` — `rework/foundation-model-contract.md`, lines 29–33; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 857–903; `S20` — `rework/deferred-functionality.md`, lines 100–102; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 214–226.
