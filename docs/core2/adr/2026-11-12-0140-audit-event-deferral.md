# Defer a generic audit-event trail without deleting domain history

## Status

Decision disposition: deferred, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

A generic Event for every accepted write duplicates a broad audit trail the user postponed.

## Decision

<a id="cut-05"></a>

### CUT-05 — No generic audit-event trail

**Disposition:** deferred. **Implementation:** unimplemented.

Use ordinary canonical current-state models and their operation-specific attribution; defer separate per-write audit Events, hidden counters/logs or historical protected-value stores. Preserve immutable MemoryRevisions/context/proposal history, accepted facts and required runtime receipts. Full event sourcing is not required; Events are not triggers.

**Recorded rationale:** Domain history remains useful without implementing a universal event trail.

<a id="name-h01"></a>

### NAME-H01 — Historical blanket audit Events

**Disposition:** superseded. **Implementation:** unimplemented.

Earlier broad design required Events for every meaningful transition; current MVP defers generic audit-event history while preserving domain-specific immutable facts and runtime receipts.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** A later explicit MVP scope choice deferred generic per-write audit Events while retaining current attribution and actual immutable domain histories; no additional rationale is recorded.

## Alternatives and supersession

- **CUT-05:** Supersedes [NAME-H01](2026-11-12-0140-audit-event-deferral.md#name-h01). The decision is to defer/exclude this capability, not approval of an unresolved implementation.
- **NAME-H01:** Superseded by [CUT-05](2026-11-12-0140-audit-event-deferral.md#cut-05).

## Consequences

Current attribution and actual immutable domain histories/runtime receipts remain. No hidden counter/log or historical credential-reference store substitutes for deferred Events.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **CUT-05:** `S20` — `rework/deferred-functionality.md`, lines 53; `S39` — `rework/model-overview.md`, lines 35–37; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 147–149,1240–1263.
- **NAME-H01:** `S39` — `rework/model-overview.md`, lines 35–37; `S20` — `rework/deferred-functionality.md`, lines 53.
