# Expose Project-scoped Asset create, find and list

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

The accepted foundation catalog selects exact paths, required inputs, safe projections and per-operation errors. Historical get/append/update aliases must not reappear.

## Decision

<a id="o08"></a>

### O08 — projects.assets.create

**Disposition:** accepted. **Implementation:** unimplemented.

`projects.assets.create` takes `{ projectId, spec }` and returns `Asset` in promised Result.value. Specific errors beyond shared errors: not-found(project/secret), duplicate-asset-target. Require exact nested repository/GitHub spec, compatible Project, scoped Secret and simple duplicate check; no codec/provider calls. All named fields are required.

**Recorded rationale:** Use one exact callable contract rather than duplicate aliases or inferred scope from namespace placement.

<a id="o09"></a>

### O09 — projects.assets.find

**Disposition:** accepted. **Implementation:** unimplemented.

`projects.assets.find` takes `{ projectId, assetId }` and returns `Asset` in promised Result.value. Specific errors beyond shared errors: not-found(project/asset). Check required Project and authoritative Asset ownership; do not disclose actual owner on mismatch. All named fields are required.

**Recorded rationale:** Use one exact callable contract rather than duplicate aliases or inferred scope from namespace placement.

<a id="o10"></a>

### O10 — projects.assets.list

**Disposition:** accepted. **Implementation:** unimplemented.

`projects.assets.list` takes `{ projectId }` and returns `Asset[]` in promised Result.value. Specific errors beyond shared errors: not-found(project). Existing parent required; all and only Project Assets, ID ASC. All named fields are required.

**Recorded rationale:** Use one exact callable contract rather than duplicate aliases or inferred scope from namespace placement.

## Alternatives and supersession

- **O08:** No additional alternative is selected by this record.
- **O09:** No additional alternative is selected by this record.
- **O10:** No additional alternative is selected by this record.

## Consequences

Every named field is required and no-input leaves take zero public arguments. All calls return promised Results through shared input/stored/output validation, owner admission and one complete transaction. These operations remain unimplemented at D1.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **O08:** `S46` — `rework/sdk-handler-tree.md`, lines 34,52,56,90,100–104; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 599.
- **O09:** `S46` — `rework/sdk-handler-tree.md`, lines 34,53,56,68–70,90; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 600.
- **O10:** `S46` — `rework/sdk-handler-tree.md`, lines 34,54,56,76,90; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 601.
