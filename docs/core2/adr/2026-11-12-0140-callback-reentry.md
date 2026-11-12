# Reject reentry machinery, document unsupported callbacks

## Status

Decision disposition: rejected. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

A callback awaiting same-owner shutdown can deadlock drainage; nested operation success may precede outer rollback.

## Decision

<a id="call-01"></a>

### CALL-01 — No callback-origin tracker

**Disposition:** rejected. **Implementation:** unimplemented.

Reject AsyncLocalStorage callback-origin frames, global callback-running flags, reentry guards or new public reentry errors as overkill. Keep normal validation, transaction/admission/drain handling and document same-owner callback reentry as unsupported.

**Recorded rationale:** The user selected a Consumer authoring constraint rather than runtime tracking for this purpose.

## Alternatives and supersession

- **CALL-01:** No additional alternative is selected by this record. The named mechanism is not an implementation requirement.

## Consequences

Consumer callbacks must not call same-owner domain operations or shutdown while active; runtime detection/deadlock prevention is not promised.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **CALL-01:** `S35` — `rework/foundation-model-contract.md`, lines 482; `S34` — `rework/foundation-full-audit.md`, lines 92–105; `S46` — `rework/sdk-handler-tree.md`, lines 242.
