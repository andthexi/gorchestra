# Start each interaction through one acknowledged transaction

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

A user-started interaction must commit its local claim/phase and acknowledged runtime association coherently.

## Decision

<a id="int-04"></a>

### INT-04 — Explicit starts

**Disposition:** accepted. **Implementation:** unimplemented.

Manual research/grilling/recharting/drafting starts validate phase/readiness/claim, create interaction/claim/phase effects, open runtime session/start first run and record acknowledgment in one transaction. Return after ack/commit, not full answer; rollback only new local start effects on failure. No pending-start workflow/background queue.

**Recorded rationale:** Reuse the accepted direct-start pattern and its longer-lock/external-orphan limitation.

## Alternatives and supersession

- **INT-04:** No additional alternative is selected by this record.

## Consequences

One transaction spans direct session opening/first submission. It can roll back local state, not external orphan work; no persisted pending-start queue is added.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **INT-04:** `S41` — `rework/pre-delivery-interactions.md`, lines 132–138; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 456–463.
