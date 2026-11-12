# Keep Core interaction states separate from runtime observations

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

A run ending, a proposal appearing and a domain purpose being accepted are different events.

## Decision

<a id="int-01"></a>

### INT-01 — Interaction ownership and states

**Disposition:** accepted. **Implementation:** unimplemented.

AgentInteraction is an independent integration aggregate referencing Expedition/Question (later work targets separately scoped). It owns purpose, target, expected result/context/authority and opaque runtime associations/receipts/proposals, not target records or transcripts. Core states are open, completed, terminal error; pending/rejected proposal and runtime progress are separate data, not extra waiting/refinement/running states.

**Recorded rationale:** Integration observations can remain valid even when target domain progression is no longer allowed.

<a id="int-02"></a>

### INT-02 — Fixed modes and failed attempts

**Disposition:** accepted. **Implementation:** unimplemented.

Charting/grilling/drafting are interactive; research is autonomous, inferred from purpose. Definite failed acknowledged interactive run leaves open purpose/context/claim for continued chat; autonomous failure records terminal error/releases claim, leaving Question unresolved. New attempt is explicitly started new interaction, not reopening/automatic retry. Unknown submission is distinct and must not be inferred to have failed.

**Recorded rationale:** Mode-specific bounded attempts preserve human conversation without treating every runtime failure as domain completion.

<a id="int-03"></a>

### INT-03 — Refine without repurposing

**Disposition:** accepted. **Implementation:** unimplemented.

While goal/purpose unchanged and result unaccepted, refine in the same interaction through Hermes. Rejection is refinement, not materialization, abandonment or automatic claim release/run start. Completed interactions are not reopened or silently assigned a new purpose.

**Recorded rationale:** Conversation continuity should survive unaccepted revisions, not rewrite accepted history.

## Alternatives and supersession

- **INT-01:** No additional alternative is selected by this record.
- **INT-02:** No additional alternative is selected by this record.
- **INT-03:** No additional alternative is selected by this record.

## Consequences

No dedicated abandonment/cancellation or retry loop is inferred from rejection or technical failure.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **INT-01:** `S04` — `rework/aggregate-ownership.md`, lines 198–206; `S41` — `rework/pre-delivery-interactions.md`, lines 44–54; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 905–968.
- **INT-02:** `S41` — `rework/pre-delivery-interactions.md`, lines 56–78; `S42` — `rework/pre-delivery-mvp.md`, lines 127–131.
- **INT-03:** `S28` — `rework/expedition-discovery.md`, lines 161–177; `S41` — `rework/pre-delivery-interactions.md`, lines 82–88.
