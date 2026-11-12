# Exclude Secret retirement and inactive state

## Status

Decision disposition: deferred. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

External credential validity is not a Core archive state, and old active-Secret gates are not inherited automatically.

## Decision

<a id="secret-04"></a>

### SECRET-04 — No credential retirement

**Disposition:** deferred. **Implementation:** unimplemented.

Exclude Secret archive/reactivate/disable/delete/inactive state, old archivePeriods and active-Secret gates. External token revocation may cause access failure without a Core lifecycle transition. Archive Period concept retention does not restore this functionality.

**Recorded rationale:** MVP avoids credential retirement/cleanup controls, accepting accumulated unused records.

## Alternatives and supersession

- **SECRET-04:** No additional alternative is selected by this record. The decision is to defer/exclude this capability, not approval of an unresolved implementation.

## Consequences

Retain Secret records and value replacement without disable/archive/delete. External revocation can produce later provider failure without domain mutation.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **SECRET-04:** `S43` — `rework/project-source.md`, lines 248–254; `S20` — `rework/deferred-functionality.md`, lines 50,143.
