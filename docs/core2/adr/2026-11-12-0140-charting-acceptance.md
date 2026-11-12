# Accept coherent charting batches and explicit amendments

## Status

Decision disposition: accepted, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Unaccepted conversation/proposals must not become authoritative discovery records.

## Decision

<a id="chart-01"></a>

### CHART-01 — Atomic reviewed batch

**Disposition:** accepted. **Implementation:** unimplemented.

Initial charting stores only interaction-owned proposal until human acceptance. Validate/apply context and discovery records, record acceptance, complete interaction and enter discovery atomically. Failure leaves no partial batch/false completion. Runtime completion is insufficient; provider session-close is not a prerequisite and acceptance does not authorize implementation/privileged effects.

**Recorded rationale:** A coherent reviewed batch avoids premature/discarded ideas becoming authoritative.

<a id="chart-h01"></a>

### CHART-H01 — Historical direct initial additions

**Disposition:** superseded. **Implementation:** unimplemented.

Earlier incremental initial Map additions and no-initial-sign-off choices are superseded by human-reviewed batch acceptance.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** One reviewed bounded charting result avoids discarded/premature ideas becoming authoritative initial Map records; delayed Core-visible work was accepted.

<a id="chart-02"></a>

### CHART-02 — Later charting and no-change

**Disposition:** accepted. **Implementation:** unimplemented.

Later changes require a new explicitly started charting interaction using current Map/context; do not reopen completed interaction or allow ad-hoc direct edits. Accepted amendments add/supersede records, preserving unaffected IDs and history. Later charting with existing accepted Map may accept an explicit no-change conclusion/reason, finishing into discovery without new Map/context records; initial charting may not.

**Recorded rationale:** Preserve understanding/history without fabricating edits just to end a conversation.

## Alternatives and supersession

- **CHART-01:** Supersedes [CHART-H01](2026-11-12-0140-charting-acceptance.md#chart-h01).
- **CHART-H01:** Superseded by [CHART-01](2026-11-12-0140-charting-acceptance.md#chart-01).
- **CHART-02:** No additional alternative is selected by this record.

## Consequences

Accepted initial context may have unresolved or zero Questions; no artificial Question is needed.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **CHART-01:** `S28` — `rework/expedition-discovery.md`, lines 67–91.
- **CHART-H01:** `S28` — `rework/expedition-discovery.md`, lines 83; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 669.
- **CHART-02:** `S28` — `rework/expedition-discovery.md`, lines 187–227; `S30` — `rework/expedition-lifecycle.md`, lines 15.
