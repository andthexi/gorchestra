# Merge a reviewed Delivery as a unit and verify integration

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Individual Slices can be assessed independently, but the accepted Delivery is the Project integration outcome.

## Decision

<a id="del-03"></a>

### DEL-03 — Delivery merge unit

**Disposition:** accepted. **Implementation:** unimplemented.

Merge whole Delivery into Project after combined validation/review. Do not ship individual Slice merges as the model or require one Expedition-wide merge.

**Recorded rationale:** Outcome-level integration avoids default publication of partial work or another Expedition integration owner.

<a id="del-04"></a>

### DEL-04 — Verified prerequisite merge

**Disposition:** accepted. **Implementation:** unimplemented.

A Delivery prerequisite is satisfied only after its Project merge is verified and recorded, not Slice completion, ready review, approval or submitted merge request acknowledgment. Verification updates derived readiness but never automatically starts dependents.

**Recorded rationale:** Dependent work should use an integrated baseline, accepting waiting through review/merge.

## Alternatives and supersession

- **DEL-03:** No additional alternative is selected by this record.
- **DEL-04:** No additional alternative is selected by this record.

## Consequences

Branch/artifact/provider/effect record details and final Expedition closure remain unresolved; no execution is started by readiness.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **DEL-03:** `S21` — `rework/delivery-lifecycle.md`, lines 20–35.
- **DEL-04:** `S21` — `rework/delivery-lifecycle.md`, lines 37–43; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 801–807.
