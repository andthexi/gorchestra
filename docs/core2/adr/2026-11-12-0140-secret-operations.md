# Expose safe Secret create, find, list and updateValue

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

The accepted foundation catalog selects exact paths, required inputs, safe projections and per-operation errors. Historical get/append/update aliases must not reappear.

## Decision

<a id="o04"></a>

### O04 — secrets.create

**Disposition:** accepted. **Implementation:** unimplemented.

`secrets.create` takes `{ title, value }` and returns `safe Secret metadata` in promised Result.value. Specific errors beyond shared errors: secret-encoding-failed. Encode exact raw nonempty value with generated ID; no placeholder record or decode. All named fields are required.

**Recorded rationale:** Use one exact callable contract rather than duplicate aliases or inferred scope from namespace placement.

<a id="o05"></a>

### O05 — secrets.find

**Disposition:** accepted. **Implementation:** unimplemented.

`secrets.find` takes `{ secretId }` and returns `safe Secret metadata` in promised Result.value. Specific errors beyond shared errors: not-found(secret). Validate stored record, omit valueRef and raw value. All named fields are required.

**Recorded rationale:** Use one exact callable contract rather than duplicate aliases or inferred scope from namespace placement.

<a id="o06"></a>

### O06 — secrets.list

**Disposition:** accepted. **Implementation:** unimplemented.

`secrets.list` takes `no arguments` and returns `safe Secret metadata[]` in promised Result.value. Specific errors beyond shared errors: none. All safe metadata, ID ASC; no usage expansion. All named fields are required.

**Recorded rationale:** Use one exact callable contract rather than duplicate aliases or inferred scope from namespace placement.

<a id="o07"></a>

### O07 — secrets.updateValue

**Disposition:** accepted. **Implementation:** unimplemented.

`secrets.updateValue` takes `{ secretId, value }` and returns `safe Secret metadata` in promised Result.value. Specific errors beyond shared errors: not-found(secret), secret-encoding-failed. Require existing scoped Secret before encode; write only valueRef/valueUpdated, even for same input. All named fields are required.

**Recorded rationale:** Use one exact callable contract rather than duplicate aliases or inferred scope from namespace placement.

## Alternatives and supersession

- **O04:** No additional alternative is selected by this record.
- **O05:** No additional alternative is selected by this record.
- **O06:** No additional alternative is selected by this record.
- **O07:** No additional alternative is selected by this record.

## Consequences

Every named field is required and no-input leaves take zero public arguments. All calls return promised Results through shared input/stored/output validation, owner admission and one complete transaction. These operations remain unimplemented at D1.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **O04:** `S46` — `rework/sdk-handler-tree.md`, lines 34,38,56,130–140; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 595.
- **O05:** `S46` — `rework/sdk-handler-tree.md`, lines 34,39,56,64,70,130; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 596.
- **O06:** `S46` — `rework/sdk-handler-tree.md`, lines 34,40,56,74,130; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 597.
- **O07:** `S46` — `rework/sdk-handler-tree.md`, lines 34,41,56,130–140; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 598.
