# Return complete scoped arrays with explicit stable ordering

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Pagination and richer query machinery would expand the MVP before the core domain works.

## Decision

<a id="list-01"></a>

### LIST-01 — Fixed full-array reads

**Disposition:** accepted. **Implementation:** unimplemented.

Return every scoped record as a plain array in Result.value. Explicit ID ASC for ordinary collections, version ASC for MemoryRevision history; updating a record does not reorder it. No pagination/cursor/page/offset/limit/envelope/count/continuation helper/custom sorting or silent truncation. Preserve scope filtering and distinguish list order from dependency order.

**Recorded rationale:** Bounded API complexity is traded for full-array resource cost.

<a id="list-02"></a>

### LIST-02 — Separate base and related reads

**Disposition:** accepted. **Implementation:** unimplemented.

Project reads return base fields without hidden Asset query/expansion; Assets are read separately within Project with secretId but no expanded Secret/protected values. Secret ordinary reads have no usages/count lookup; usages explicitly returns full currently referring Assets, derived not persisted. Memory ordinary reads are compact; exact revision read never substitutes latest, and editor expectedVersion stays attached to fetched body despite summary refreshes.

**Recorded rationale:** Read-convenience must not silently add relationships, provider I/O or stale edit bases.

## Alternatives and supersession

- **LIST-01:** No additional alternative is selected by this record.
- **LIST-02:** No additional alternative is selected by this record.

## Consequences

Full revision-history reads may load every historical body; ordinary Memory reads stay compact. No performance or persistent-backend qualification is implied.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **LIST-01:** `S40` — `rework/pagination-sdk-research.md`, lines 3–9; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 465–479; `S35` — `rework/foundation-model-contract.md`, lines 272.
- **LIST-02:** `S35` — `rework/foundation-model-contract.md`, lines 417–433; `S43` — `rework/project-source.md`, lines 82–88,332–336; `S48` — `rework/secret-memory-original-review.md`, lines 155–159.
