# Require explicit human-authorized Core progression

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation and paused domain design.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Runtime completion and missing prerequisites do not confer human authority to advance or repair domain state.

## Decision

<a id="scope-04"></a>

### SCOPE-04 — No automatic progression

**Disposition:** accepted. **Implementation:** unimplemented.

Authoritative starts, acceptance, resolution, materialization and state-changing runtime collection/reconciliation are explicitly user-invoked. Queries/polling are read-only. Agent proposal tools may store unaccepted results, not approve them. No background scheduler, completion callback/inbox, startup/periodic writer, offline submission queue or automatic retry/recovery. External runtime execution may continue after the one-shot host exits without autonomously updating Core.

**Recorded rationale:** The accepted costs are explicit user actions and possibly stale observations, not hidden progression.

<a id="scope-05"></a>

### SCOPE-05 — Safe explicit effects

**Disposition:** accepted. **Implementation:** unimplemented.

Perform requested operations and their defined mechanics only; missing prerequisites yield safe errors, not implicit setup/repair/resource creation/reuse, credential/target fallback or workflow advancement. Trimming, IDs/stamps, cleanup, atomic accepted materialization and valid same-value writes remain defined effects, not separate approvals.

**Recorded rationale:** Permission to attempt an operation is not permission to invent corrective work.

## Alternatives and supersession

- **SCOPE-04:** No additional alternative is selected by this record.
- **SCOPE-05:** No additional alternative is selected by this record.

## Consequences

Reads/polling remain read-only; proposal storage is the explicit limited agent-write exception. User-invoked operations retain their defined atomic mechanics.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **SCOPE-04:** `S28` — `rework/expedition-discovery.md`, lines 15–31; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 428–463,1077–1105; `S20` — `rework/deferred-functionality.md`, lines 42.
- **SCOPE-05:** `S04` — `rework/aggregate-ownership.md`, lines 13–17; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 307–313.
