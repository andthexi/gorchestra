# Defer Expedition-produced Memory publication

## Status

Decision disposition: deferred, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Publishing provisional Expedition knowledge introduces visibility, completion and conflict semantics beyond work-graph planning.

## Decision

<a id="plan-02"></a>

### PLAN-02 — No automatic Memory promotion

**Disposition:** deferred. **Implementation:** unimplemented.

Blueprints do not propose Memory creation/revision/drafts, and Expedition completion does not publish Memory. Retain independent user authoring and on-demand exact-revision reads. Defer staging, private visibility, completion-time publication and reconciliation; preferred future drafts/base-revision guards/finalization are saved suggestions, not selected executable policy.

**Recorded rationale:** Keep accepted work-graph planning independent of reusable knowledge publication.

<a id="plan-h01"></a>

### PLAN-H01 — Historical Blueprint Memory proposals

**Disposition:** superseded. **Implementation:** unimplemented.

Earlier broad Blueprint acceptance included proposed Memory creation/revisions. Current work-graph-only acceptance and explicit Memory-publication deferral supersede that inclusion. This history does not adopt the later suggested publication conflict/finalization algorithm.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** The explicit deferral keeps MVP Blueprint acceptance focused on the work graph; later staging/privacy/publication/conflict suggestions remain unselected.

## Alternatives and supersession

- **PLAN-02:** Supersedes [PLAN-H01](2026-11-12-0140-memory-publication.md#plan-h01). The decision is to defer/exclude this capability, not approval of an unresolved implementation.
- **PLAN-H01:** Superseded by [PLAN-02](2026-11-12-0140-memory-publication.md#plan-02).

## Consequences

No Blueprint Memory writes or completion-time publication occur in the MVP. Independent user authoring remains; saved staging/finalization alternatives are unresolved future direction.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **PLAN-02:** `S31` — `rework/expedition-memory.md`, lines 3–78; `S18` — `rework/blueprint-lifecycle.md`, lines 154–158; `S20` — `rework/deferred-functionality.md`, lines 37,127.
- **PLAN-H01:** `S18` — `rework/blueprint-lifecycle.md`, lines 154–158; `S31` — `rework/expedition-memory.md`, lines 3–9.
