# Finish current Questions before one Blueprint acceptance

## Status

Decision disposition: accepted, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Multiple early plans would require reconciliation of accepted scope and active work.

## Decision

<a id="bp-01"></a>

### BP-01 — Readiness and one accepted scope

**Disposition:** accepted. **Implementation:** unimplemented.

Require accepted initial charting/context and every current Question resolved to start drafting and accept work. Zero Questions after accepted charting is valid; no extra Unknown/Finding/Decision completion gate. At most one Blueprint identity and one accepted revision per Expedition, created only at final work acceptance; no separately submitted unaccepted Blueprint or empty creation step.

**Recorded rationale:** Bound discovery before executable planning and avoid reconciling overlapping accepted plans.

<a id="bp-h01"></a>

### BP-H01 — Historical drafting with open Questions

**Disposition:** superseded. **Implementation:** unimplemented.

Earlier discovery pass permitted drafting with open Questions; the later Blueprint lifecycle explicitly supersedes that permission.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** The user narrowed the MVP after identifying costs of multiple plans at different discovery points; all current Questions must resolve before one Blueprint drafting/acceptance flow.

<a id="bp-02"></a>

### BP-02 — Two material outcomes

**Disposition:** accepted. **Implementation:** unimplemented.

Drafting accepts either material Map amendments and completes into discovery without consuming Blueprint allowance, or nonempty Blueprint work and completes into planned. A later draft is a new interaction after readiness returns. No combined silent Map/work outcome, no-change drafting, empty Blueprint, fabricated work, implicit abandonment or automatic subsequent start.

**Recorded rationale:** Discovery discovered during drafting can be reviewed without prematurely creating work; no-change drafting waits for future multi-round design.

<a id="name-01"></a>

### NAME-01 — Blueprint terminology

**Disposition:** accepted. **Implementation:** unimplemented.

Use Blueprint for reviewed executable work, replacing Plan Output; use qualified names when qualifiers distinguish ownership, lifecycle, authority or references. Compound names are allowed, not a universal one-singular-word restriction.

**Recorded rationale:** Names distinguish BlueprintVerdict, MemoryRevision, AgentInteraction and Correction without conflating domain roles.

## Alternatives and supersession

- **BP-01:** Supersedes [BP-H01](2026-11-12-0140-blueprint-readiness.md#bp-h01).
- **BP-H01:** Superseded by [BP-01](2026-11-12-0140-blueprint-readiness.md#bp-01).
- **BP-02:** No additional alternative is selected by this record.
- **NAME-01:** Older visual one-word names remain exploration, not current serialized aliases.

## Consequences

Plural Expedition→Blueprint→revisions ownership survives as future direction; one creation and one accepted revision are MVP lifecycle limits.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **BP-01:** `S18` — `rework/blueprint-lifecycle.md`, lines 13–50; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 747–759.
- **BP-H01:** `S18` — `rework/blueprint-lifecycle.md`, lines 44–50; `S28` — `rework/expedition-discovery.md`, lines 179–185.
- **BP-02:** `S18` — `rework/blueprint-lifecycle.md`, lines 52–96; `S30` — `rework/expedition-lifecycle.md`, lines 15.
- **NAME-01:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 579,745.
