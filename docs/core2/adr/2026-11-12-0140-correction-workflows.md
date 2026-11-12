# Defer Corrections without waiving completed-work gates

## Status

Decision disposition: deferred. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Fixing an unfinished Slice differs from altering already accepted/completed work after combined review.

## Decision

<a id="del-08"></a>

### DEL-08 — Correction deferral preserves gates

**Disposition:** deferred. **Implementation:** unimplemented.

Defer formal Correction/RevisionGate planning/authorization/execution/completion and post-merge rules. Failing combined review still blocks merge; do not reopen completed Slices, waive review or invent a repair path. Preferred future Delivery-owned Correction with own Instruction/fresh combined review is retained direction, not implemented policy.

**Recorded rationale:** Preserve accepted Slice history rather than cascading reopened states; the current limitation is explicit.

## Alternatives and supersession

- **DEL-08:** No additional alternative is selected by this record. The decision is to defer/exclude this capability, not approval of an unresolved implementation.

## Consequences

Correction/RevisionGate remains deferred and no implicit repair route is provided. A failing combined review still blocks merge and does not reopen completed Slice history.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **DEL-08:** `S21` — `rework/delivery-lifecycle.md`, lines 89–108; `S20` — `rework/deferred-functionality.md`, lines 33.
