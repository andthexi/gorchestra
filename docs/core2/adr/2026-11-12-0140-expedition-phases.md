# Use four explicit planning states and one unfinished planner

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Runtime completion is not Core interaction completion, and readiness must not implicitly schedule work.

## Decision

<a id="exp-03"></a>

### EXP-03 — Four states

**Disposition:** accepted. **Implementation:** unimplemented.

Use charting, discovery, drafting, planned. Charting acceptance returns discovery; discovery explicitly opens recharting or ready drafting; drafting accepts material Map amendment to discovery or work graph to planned. Draft readiness is derived inside discovery, not a fifth state; planned means materialized handoff, not execution or final fulfilment.

**Recorded rationale:** Keep phase authority explicit without persisting duplicate readiness.

<a id="exp-04"></a>

### EXP-04 — Planner and Question claims

**Disposition:** accepted. **Implementation:** unimplemented.

Allow only one unfinished charting-or-drafting interaction total per Expedition, including pending approval/refinement after runtime termination. Question starts/result progression occur only in discovery. Recharting requires no unfinished Question interactions; unresolved unstarted Questions do not block it. Different ready unclaimed Questions may run concurrently, each with at most one unfinished interaction and no Expedition-wide single-Question cap.

**Recorded rationale:** Separate charting amendments from Question writes while permitting independent discovery work.

<a id="exp-05"></a>

### EXP-05 — Planning closes at acceptance

**Disposition:** accepted. **Implementation:** unimplemented.

Blueprint-item acceptance atomically materializes work, completes drafting and moves Expedition to planned. No return to charting/drafting/Question work or automatic execution. Additional scope uses another Expedition; no cancellation of runtime work or overall shipped-completion guarantee is implied.

**Recorded rationale:** One accepted work graph avoids replanning/reconciliation machinery in the MVP.

## Alternatives and supersession

- **EXP-03:** No additional alternative is selected by this record.
- **EXP-04:** No additional alternative is selected by this record.
- **EXP-05:** No additional alternative is selected by this record.

## Consequences

The selected names/gates are preserved; exact stored phase records and complete error matrix are unresolved.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **EXP-03:** `S30` — `rework/expedition-lifecycle.md`, lines 17–43; `S42` — `rework/pre-delivery-mvp.md`, lines 121.
- **EXP-04:** `S30` — `rework/expedition-lifecycle.md`, lines 7–15,45–53; `S28` — `rework/expedition-discovery.md`, lines 17–21.
- **EXP-05:** `S30` — `rework/expedition-lifecycle.md`, lines 57–61; `S18` — `rework/blueprint-lifecycle.md`, lines 78–86.
