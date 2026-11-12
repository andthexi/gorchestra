# Expose immutable revision creation and exact history reads

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

The accepted foundation catalog selects exact paths, required inputs, safe projections and per-operation errors. Historical get/append/update aliases must not reappear.

## Decision

<a id="o15"></a>

### O15 — memories.revisions.create

**Disposition:** accepted. **Implementation:** unimplemented.

`memories.revisions.create` takes `{ memoryId, expectedVersion, title, body }` and returns `{ memory, revision }` in promised Result.value. Specific errors beyond shared errors: not-found(memory), revision-conflict, revision-version-exhausted. Complete snapshot, not patch; expected base version is not requested successor. Atomic conditional append; no append alias. All named fields are required.

**Recorded rationale:** Use one exact callable contract rather than duplicate aliases or inferred scope from namespace placement.

<a id="o16"></a>

### O16 — memories.revisions.find

**Disposition:** accepted. **Implementation:** unimplemented.

`memories.revisions.find` takes `{ revisionId }` and returns `full MemoryRevision` in promised Result.value. Specific errors beyond shared errors: not-found(memory-revision). Exact immutable revision without redundant memoryId or latest fallback. All named fields are required.

**Recorded rationale:** Use one exact callable contract rather than duplicate aliases or inferred scope from namespace placement.

<a id="o17"></a>

### O17 — memories.revisions.list

**Disposition:** accepted. **Implementation:** unimplemented.

`memories.revisions.list` takes `{ memoryId }` and returns `full MemoryRevision[]` in promised Result.value. Specific errors beyond shared errors: not-found(memory). Existing Memory required; all full historical bodies/created in version ASC, no body-free summary variant. All named fields are required.

**Recorded rationale:** Use one exact callable contract rather than duplicate aliases or inferred scope from namespace placement.

## Alternatives and supersession

- **O15:** No additional alternative is selected by this record.
- **O16:** No additional alternative is selected by this record.
- **O17:** No additional alternative is selected by this record.

## Consequences

Every named field is required and no-input leaves take zero public arguments. All calls return promised Results through shared input/stored/output validation, owner admission and one complete transaction. These operations remain unimplemented at D1.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **O15:** `S46` — `rework/sdk-handler-tree.md`, lines 34,46,116–120; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 606.
- **O16:** `S46` — `rework/sdk-handler-tree.md`, lines 34,47,66,70; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 607.
- **O17:** `S46` — `rework/sdk-handler-tree.md`, lines 34,48,124; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 608.
