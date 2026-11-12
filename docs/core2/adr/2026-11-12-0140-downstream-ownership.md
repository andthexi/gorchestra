# Preserve Delivery and external-effect authority without implementing execution

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Blueprint acceptance materializes across aggregate boundaries but does not own or start downstream execution.

## Decision

<a id="del-01"></a>

### DEL-01 — Delivery and owned work

**Disposition:** accepted. **Implementation:** unimplemented.

Delivery is independent from Expedition/Blueprint and owns Slices and their embedded immutable Instructions (accepted goal/criteria). Origin references preserve accepted scope, not authority for later plan edits. No independent Slice or Instruction registry; later Correction/RevisionGate direction stays Delivery-owned and deferred.

**Recorded rationale:** Execution has distinct lifecycle authority while its internal work belongs to one outcome.

<a id="del-02"></a>

### DEL-02 — Artifacts, review and facts

**Disposition:** accepted. **Implementation:** unimplemented.

Broader Artifact/Surface/Feedback/Review/ReviewVerdict ownership follows served/reviewed work: Delivery for execution, Expedition for future discovery. Runtime producer is provenance; external provider owns actual files/PR objects, and Core need not mirror full threads. Actions/Receipts belong to governing activity, not independent fact/catalog aggregates. Discovery review models remain excluded.

**Recorded rationale:** Reference/reuse and independent assessment do not require extra aggregate roots.

## Alternatives and supersession

- **DEL-01:** No additional alternative is selected by this record.
- **DEL-02:** No additional alternative is selected by this record.

## Consequences

All downstream behavior here is parked; no current runtime/merge/repair implementation is authorized.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **DEL-01:** `S04` — `rework/aggregate-ownership.md`, lines 162–188,238–244; `S21` — `rework/delivery-lifecycle.md`, lines 9–18.
- **DEL-02:** `S04` — `rework/aggregate-ownership.md`, lines 208–260; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 809–821.
