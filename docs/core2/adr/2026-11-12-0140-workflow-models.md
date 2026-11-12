# Defer configurable Workflow models and interpretation

## Status

Decision disposition: deferred, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

The opinionated lifecycle can operate without a reusable workflow interpreter or Project-selected WorkflowRevision.

## Decision

<a id="scope-03"></a>

### SCOPE-03 — Fixed lifecycle, no workflow models

**Disposition:** deferred. **Implementation:** unimplemented.

Defer Workflow/WorkflowRevision models, Project selection and inherited Expedition snapshots/configuration. Keep the fixed Core pre-delivery lifecycle, purposes and acceptance contracts; runtime/model configuration stays host-owned. No replacement configurable workflow engine. Broader Workflow ownership remains independent with immutable revisions as future direction.

**Recorded rationale:** Reusable programmable workflow configuration is not required for the opinionated MVP.

<a id="workflow-h01"></a>

### WORKFLOW-H01 — Historical Workflow selection

**Disposition:** superseded. **Implementation:** unimplemented.

Earlier Project-selected WorkflowRevision and inherited Expedition selection were selected before Workflow models/configuration were deferred. No replacement configurable mechanism is adopted for the MVP.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** The MVP uses its fixed built-in pre-delivery lifecycle instead of implementing configurable Workflow models or a replacement interpreter.

## Alternatives and supersession

- **SCOPE-03:** Supersedes [WORKFLOW-H01](2026-11-12-0140-workflow-models.md#workflow-h01). The decision is to defer/exclude this capability, not approval of an unresolved implementation.
- **WORKFLOW-H01:** Superseded by [SCOPE-03](2026-11-12-0140-workflow-models.md#scope-03).

## Consequences

Workflow models/selection are deferred without a replacement configurable mechanism. Host runtime settings remain separate from portable domain data.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **SCOPE-03:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 843–847; `S28` — `rework/expedition-discovery.md`, lines 43–47; `S20` — `rework/deferred-functionality.md`, lines 34.
- **WORKFLOW-H01:** `S28` — `rework/expedition-discovery.md`, lines 43–47; `S20` — `rework/deferred-functionality.md`, lines 34.
