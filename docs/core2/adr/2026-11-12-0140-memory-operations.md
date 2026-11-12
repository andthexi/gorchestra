# Expose compact Memory creation and hierarchy reads

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

The accepted foundation catalog selects exact paths, required inputs, safe projections and per-operation errors. Historical get/append/update aliases must not reappear.

## Decision

<a id="o12"></a>

### O12 — memories.create

**Disposition:** accepted. **Implementation:** unimplemented.

`memories.create` takes `{ parentId, title, body }` and returns `{ memory, revision }` in promised Result.value. Specific errors beyond shared errors: not-found(memory parent). parentId required: explicit null for root, otherwise existing scoped parent. Atomically write Memory/revision 1 and one stamp. All named fields are required.

**Recorded rationale:** Use one exact callable contract rather than duplicate aliases or inferred scope from namespace placement.

<a id="o13"></a>

### O13 — memories.find

**Disposition:** accepted. **Implementation:** unimplemented.

`memories.find` takes `{ memoryId }` and returns `compact Memory` in promised Result.value. Specific errors beyond shared errors: not-found(memory). No implicit body/history expansion. All named fields are required.

**Recorded rationale:** Use one exact callable contract rather than duplicate aliases or inferred scope from namespace placement.

<a id="o14"></a>

### O14 — memories.list

**Disposition:** accepted. **Implementation:** unimplemented.

`memories.list` takes `{ parentId }` and returns `compact Memory[]` in promised Result.value. Specific errors beyond shared errors: not-found(memory parent). Explicit null roots or required existing parent for direct children, ID ASC; no recursion or implicit all-Memories mode. All named fields are required.

**Recorded rationale:** Use one exact callable contract rather than duplicate aliases or inferred scope from namespace placement.

## Alternatives and supersession

- **O12:** No additional alternative is selected by this record.
- **O13:** No additional alternative is selected by this record.
- **O14:** No additional alternative is selected by this record.

## Consequences

Every named field is required and no-input leaves take zero public arguments. All calls return promised Results through shared input/stored/output validation, owner admission and one complete transaction. These operations remain unimplemented at D1.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **O12:** `S46` — `rework/sdk-handler-tree.md`, lines 34,43,108; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 603.
- **O13:** `S46` — `rework/sdk-handler-tree.md`, lines 34,44,65,70; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 604.
- **O14:** `S46` — `rework/sdk-handler-tree.md`, lines 34,45,112; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 605.
