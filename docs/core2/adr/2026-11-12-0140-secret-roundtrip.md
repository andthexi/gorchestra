# Leave codec round-tripping implicit

## Status

Decision disposition: rejected. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Shape validation cannot prove that Consumer protection and later retrieval are semantically inverse. The user declined additional explicit round-trip machinery.

## Decision

<a id="codec-05"></a>

### CODEC-05 — No explicit round-trip mechanism

**Disposition:** rejected. **Implementation:** unimplemented.

Leave encode/decode round-tripping implicit. Reject a new explicit Consumer round-trip obligation/test gate, startup probe or automatic decode-after-encode. Preserve shape/key/exact-string validation and Consumer-owned protection; encoding is not itself encryption.

**Recorded rationale:** The user declined the extra contract machinery rather than weakening the selected boundaries.

## Alternatives and supersession

- **CODEC-05:** No additional alternative is selected by this record. The named mechanism is not an implementation requirement.

## Consequences

No startup probe, decode-after-encode or dedicated Consumer test gate is required by Core; existing secrecy/exact-string/key validation remains.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **CODEC-05:** `S35` — `rework/foundation-model-contract.md`, lines 484; `S34` — `rework/foundation-full-audit.md`, lines 177–190; `S46` — `rework/sdk-handler-tree.md`, lines 128–134.
