# Keep credential protection Consumer-owned and transient

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

The Consumer selects protection, storage and key management; an opaque valueRef may refer to mutable external data.

## Decision

<a id="codec-06"></a>

### CODEC-06 — Secrecy and external effects

**Disposition:** accepted. **Implementation:** unimplemented.

Raw values and valueRef stay out of ordinary public records/results/errors/logs/Events/model context/transcripts/command arguments. Raw value is transient authorized write input, never a persisted fallback; valueRef is deliberately persisted internally and passed to Consumer decode. Protected format/encryption/key management is Consumer-owned. No Core choice of encrypted payload/store/tagged variants, automatic retry/fallback/compensation or external protected-store rollback promise. Same reference does not prove same underlying value.

**Recorded rationale:** Local reference atomicity cannot freeze or undo a Consumer’s external store.

## Alternatives and supersession

- **CODEC-06:** No additional alternative is selected by this record.

## Consequences

Core does not claim encoding is encryption or that database rollback undoes external protection effects. Raw values remain transient and no compensation/retry/reveal path is introduced.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **CODEC-06:** `S43` — `rework/project-source.md`, lines 260–286,318–328; `S46` — `rework/sdk-handler-tree.md`, lines 138–140; `S35` — `rework/foundation-model-contract.md`, lines 511–513.
