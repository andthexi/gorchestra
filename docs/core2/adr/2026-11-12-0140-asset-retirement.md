# Exclude Asset retirement and removal

## Status

Decision disposition: deferred. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Immutable configured targets can become obsolete, but removal and reference-cascade rules were cut from the MVP.

## Decision

<a id="asset-03"></a>

### ASSET-03 — No Asset retirement

**Disposition:** deferred. **Implementation:** unimplemented.

Exclude archive/reactivate/disable/delete/removal from Project, including obsolete or mistaken targets. No hidden flag or automatic retirement on provider failure; new records do not retarget old work.

**Recorded rationale:** Avoid removal/reference-cascade machinery; all-included planning may retain obsolete targets without requiring work or successful reads for every one.

## Alternatives and supersession

- **ASSET-03:** No additional alternative is selected by this record. The decision is to defer/exclude this capability, not approval of an unresolved implementation.

## Consequences

Retain obsolete/mistaken Assets; new configuration does not rewrite old work. All-included planning does not require every Asset to receive work or pass a live read.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **ASSET-03:** `S43` — `rework/project-source.md`, lines 528–532; `S49` — `rework/source-model-exploration.md`, lines 157–161; `S20` — `rework/deferred-functionality.md`, lines 49.
