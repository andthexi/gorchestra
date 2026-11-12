# Create Expedition and initial charting from rough intent

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Clarifying an underspecified objective is part of the product, but Project setup is an independent admission prerequisite.

## Decision

<a id="exp-01"></a>

### EXP-01 — Rough intent and setup

**Disposition:** accepted. **Implementation:** unimplemented.

Allow rough initial intent without separate pre-Expedition intake or Destination-confirmed gate. Caller selects Project; require at least one complete locally valid repository Asset before creating Expedition or starting charting. Project may exist empty and support multiple repositories; local setup does not certify provider access. No Workflow or Project Memory selection prerequisite.

**Recorded rationale:** Objective maturity can be developed through charting, but host filesystem context cannot replace configured Assets.

<a id="exp-02"></a>

### EXP-02 — Initial start transaction

**Disposition:** accepted. **Implementation:** unimplemented.

Inside one creation transaction validate Project/Assets/context, create Expedition and charting AgentInteraction, open runtime session, submit first charting run and persist acknowledged associations. Return after acknowledgment and commit, not full answer. Failure rolls back local creation; no conversation-spanning transaction, queue, automatic resubmission or cross-system atomicity.

**Recorded rationale:** Direct calls reduce machinery at the accepted cost of longer locks and possible manual orphan cleanup.

## Alternatives and supersession

- **EXP-01:** No additional alternative is selected by this record.
- **EXP-02:** No additional alternative is selected by this record.

## Consequences

Runtime opening/submission inside the local transaction may leave external orphan work if acknowledgment or commit fails; recovery stays manual.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **EXP-01:** `S28` — `rework/expedition-discovery.md`, lines 33–55; `S43` — `rework/project-source.md`, lines 62–66,104–108,394–400.
- **EXP-02:** `S28` — `rework/expedition-discovery.md`, lines 57–65; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 436–463.
