# Keep foundation recovery UX outside Core

## Status

Decision disposition: deferred. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation and paused domain design.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Transport uncertainty is not proof of database rollback, but Core-wide request replay/recovery machinery was not selected.

## Decision

<a id="cut-06"></a>

### CUT-06 — No foundation recovery API

**Disposition:** deferred. **Implementation:** unimplemented.

Exclude Core request-key idempotency/replay responses/request-status/dedicated recovery machinery for foundation writes. Consumer retry prompts/lost-response UX are outside the Core review; uncertain Secret writes are not automatically retried or called rolled back, and metadata/cid/equal titles do not prove commit. Explicit resubmission is a new invocation. Keep runtime exact-submission identity and one-time Blueprint acceptance distinct.

**Recorded rationale:** Atomic persistence does not imply transport replay guarantees or external-store compensation.

## Alternatives and supersession

- **CUT-06:** No additional alternative is selected by this record. The decision is to defer/exclude this capability, not approval of an unresolved implementation.

## Consequences

Consumers own explicit reconciliation UX; each resubmission is a new invocation. Runtime transport identity and already-accepted Blueprint refusal retain separate contracts.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **CUT-06:** `S43` — `rework/project-source.md`, lines 318–328; `S36` — `rework/foundation-plan-audit.md`, lines 182–190; `S20` — `rework/deferred-functionality.md`, lines 106.
