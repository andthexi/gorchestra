# Defer portable Snapshot export and restore

## Status

Decision disposition: deferred. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Portable Snapshot export/restore and legacy import add lifecycle/format responsibilities outside the foundation.

## Decision

<a id="cut-02"></a>

### CUT-02 — Snapshots and import

**Disposition:** deferred. **Implementation:** unimplemented.

Defer portable Portfolio Snapshot/export/restore and imported AuditStamp variant. Clean-break implementation does not convert/reset legacy stores or provide old-API compatibility. Normal persistence, existing backups, immutable revisions/proposals remain; redesigned forward migration is not legacy import or downgrade support.

**Recorded rationale:** Keep foundation scope bounded without destroying existing data.

## Alternatives and supersession

- **CUT-02:** No additional alternative is selected by this record. The decision is to defer/exclude this capability, not approval of an unresolved implementation.

## Consequences

Keep ordinary storage/backups/domain histories without claiming portability or conversion. Imported stamps return only with separately resumed export/import design.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **CUT-02:** `S20` — `rework/deferred-functionality.md`, lines 40–41,51; `S39` — `rework/model-overview.md`, lines 175–179; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 92–98.
