# Expose Project create, find and list

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

The accepted foundation catalog selects exact paths, required inputs, safe projections and per-operation errors. Historical get/append/update aliases must not reappear.

## Decision

<a id="o01"></a>

### O01 — projects.create

**Disposition:** accepted. **Implementation:** unimplemented.

`projects.create` takes `{ title, spec: { type: "source-control" } }` and returns `Project` in promised Result.value. Specific errors beyond shared errors: none. Validate required nested spec/title; generate ID and created, no implicit children. All named fields are required.

**Recorded rationale:** Use one exact callable contract rather than duplicate aliases or inferred scope from namespace placement.

<a id="o02"></a>

### O02 — projects.find

**Disposition:** accepted. **Implementation:** unimplemented.

`projects.find` takes `{ projectId }` and returns `Project` in promised Result.value. Specific errors beyond shared errors: not-found(project). Return base scoped Project only. All named fields are required.

**Recorded rationale:** Use one exact callable contract rather than duplicate aliases or inferred scope from namespace placement.

<a id="o03"></a>

### O03 — projects.list

**Disposition:** accepted. **Implementation:** unimplemented.

`projects.list` takes `no arguments` and returns `Project[]` in promised Result.value. Specific errors beyond shared errors: none. All base Projects, ID ASC, no hidden Asset reads. All named fields are required.

**Recorded rationale:** Use one exact callable contract rather than duplicate aliases or inferred scope from namespace placement.

## Alternatives and supersession

- **O01:** No additional alternative is selected by this record.
- **O02:** No additional alternative is selected by this record.
- **O03:** No additional alternative is selected by this record.

## Consequences

Every named field is required and no-input leaves take zero public arguments. All calls return promised Results through shared input/stored/output validation, owner admission and one complete transaction. These operations remain unimplemented at D1.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **O01:** `S46` — `rework/sdk-handler-tree.md`, lines 34,49,56,86; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 592.
- **O02:** `S46` — `rework/sdk-handler-tree.md`, lines 34,50,56,67,70; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 593.
- **O03:** `S46` — `rework/sdk-handler-tree.md`, lines 34,51,56,74; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 594.
