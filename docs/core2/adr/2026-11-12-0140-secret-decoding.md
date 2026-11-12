# Validate one exact-key batch decoder contract

## Status

Decision disposition: accepted, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

One Consumer service must support one or many captured Secret references without trusting arbitrary callback keys or values.

## Decision

<a id="codec-03"></a>

### CODEC-03 — Batch decoder input and matching

**Disposition:** accepted. **Implementation:** unimplemented.

Consumer `decode({ secrets: Array<{ secretId, valueRef }> }): Promise<Record<Id,string | null>>` handles one or many captured pairs. Collect distinct Secret IDs before reference acquisition, capture each once and reuse per batch; never deduplicate by valueRef, positional order or cache across operations. Rename resolve to decode with no alias.

**Recorded rationale:** IDs correlate outcomes even when distinct Secrets share a protected reference; one-item use does not justify a single-only service.

<a id="codec-h02"></a>

### CODEC-H02 — Historical single-only resolution

**Disposition:** superseded. **Implementation:** unimplemented.

An intermediate single-reference-only resolver decision is superseded by one batch-capable method; resolve naming is superseded by decode, with no separate single-item alias.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** Other authorized uses may need multiple references; one batch method serves single and multiple requests. The later resolve-to-decode/error rename preserves behavior without aliases.

<a id="codec-04"></a>

### CODEC-04 — Exact callback result and internal Results

**Disposition:** accepted. **Implementation:** unimplemented.

Require exactly requested ID keys with string/null values. Preserve strings exactly, including empty decoded string; valid mixed batches keep successes. Missing/extra keys, malformed container/value or callback throw/rejection fail every requested ID with no salvaged credentials. Internal encode returns Result<string,type-only secret-encoding-failed>; internal decode returns keyed per-ID Result<string,type-only secret-decoding-failed>, no outer Result or repeated ID. Public decoding error adds requested secretId; an operation obtains all required credentials before proceeding.

**Recorded rationale:** Central validation prevents partial malformed batches or backend details escaping; valid partial outcomes do not authorize partial execution.

## Alternatives and supersession

- **CODEC-03:** Supersedes [CODEC-H02](2026-11-12-0140-secret-decoding.md#codec-h02).
- **CODEC-H02:** Superseded by [CODEC-03](2026-11-12-0140-secret-decoding.md#codec-03).
- **CODEC-04:** No additional alternative is selected by this record.

## Consequences

Valid mixed batches retain per-ID successes; malformed/throwing batches fail all requested IDs. Required credentials must all resolve before use, and no public reveal operation is added.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **CODEC-03:** `S35` — `rework/foundation-model-contract.md`, lines 488,502–504; `S43` — `rework/project-source.md`, lines 278–290; `S46` — `rework/sdk-handler-tree.md`, lines 246–255.
- **CODEC-H02:** `S35` — `rework/foundation-model-contract.md`, lines 488,502; `S43` — `rework/project-source.md`, lines 288.
- **CODEC-04:** `S35` — `rework/foundation-model-contract.md`, lines 488,504; `S46` — `rework/sdk-handler-tree.md`, lines 244–255.
