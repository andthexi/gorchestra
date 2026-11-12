# Defer workspace models and retain a static host directory

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Filesystem isolation machinery was postponed while domain workflow and authority semantics were being settled.

## Decision

<a id="hermes-05"></a>

### HERMES-05 — Static execution location

**Disposition:** accepted. **Implementation:** unimplemented.

Initial direction uses one statically host-configured working directory shared with runtime/one-shot host. No Core Workspace/Sandbox/checkout/worktree/mount/lease model or per-interaction location handle. Serialize filesystem-mutating activity by orchestration policy; detailed Slice-cycle overlap/locking was declined and remains unselected, not inferred from this constraint.

**Recorded rationale:** Defer isolation providers until the domain workflow is settled; this is not a final isolation model.

## Alternatives and supersession

- **HERMES-05:** No additional alternative is selected by this record.

## Consequences

The initial host-configured shared directory requires serialized mutating activity, not a Core Workspace model. Detailed Slice-overlap policy remains unselected and separate.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **HERMES-05:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 1007–1021; `S21` — `rework/delivery-lifecycle.md`, lines 17,103; `S20` — `rework/deferred-functionality.md`, lines 44,144.
