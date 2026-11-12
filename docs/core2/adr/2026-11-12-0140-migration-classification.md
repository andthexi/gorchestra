# Classify raw migration history before lifecycle refusals

## Status

Decision disposition: accepted, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Migrator.status projects declared IDs and can omit unknown history. Empty history does not prove an empty application boundary.

## Decision

<a id="hist-01"></a>

### HIST-01 — Pure history validation

**Disposition:** accepted. **Implementation:** unimplemented.

Use one pure internal classifier shared by new/setup/migrate; entries read native history explicitly. Validate array entries with exact valid ULID id and nonnegative safe-integer Unix-millisecond appliedAt, then duplicate IDs, unknown IDs, and contiguous-prefix membership. Malformed/duplicate/gapped history yields schema-metadata-invalid; well-formed unknown IDs yield schema-version-unrecognized. Do not use return order, time ordering, max ID, Migrator.status alone or timestamp/ULID-time comparison.

**Recorded rationale:** Membership in the immutable catalog, not chronology or a projected status, establishes progress.

<a id="hist-02"></a>

### HIST-02 — Classification and emptiness

**Disposition:** accepted. **Implementation:** unimplemented.

Valid empty history means internal empty; proper nonempty prefix means migration; full catalog means ready. Only after empty history, use native introspection on the same isolated application boundary, excluding adapter bookkeeping/empty native ledger. Application containers count even with zero rows: storage-not-empty. No containers permits setup, not ready. Read/inspection failure is storage-operation-failed.

**Recorded rationale:** Missing bookkeeping cannot authorize overwriting existing data.

<a id="hist-h01"></a>

### HIST-H01 — Historical invisible CRUD allowance

**Disposition:** superseded. **Implementation:** unimplemented.

The prior accepted allowance for in-memory CRUD data missed by successful empty introspection is removed. Published 5.3.3 counterexamples remain historical evidence, not permission to retain the exception.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** Kevin withdrew the specific missed-CRUD detection allowance and assumed corrected native introspection for future integration, without certifying universal detection or #148/#149.

<a id="hist-03"></a>

### HIST-03 — Native empty-ledger exception

**Disposition:** accepted. **Implementation:** unimplemented.

Factory may initialize only Equipped’s empty native ledger while classifying storage. It cannot run up(), create application schema/data, mark migrations applied, repair history, or delete the ledger on a later failure. Empty ledger is not initialized/ready application storage.

**Recorded rationale:** This narrow native bookkeeping effect reconciles inspection with actual adapter behavior.

<a id="hist-h02"></a>

### HIST-H02 — Historical wholly read-only factory

**Disposition:** superseded. **Implementation:** unimplemented.

Strict prohibition on all factory metadata creation is superseded only for native empty-ledger initialization; application setup/migration remains explicit.

**Original rationale:** Validation-only opening was to leave schema, bookkeeping and domain records unchanged, including when refusing access; metadata creation was not part of that opening intent.

**Reason superseded:** Native ledger reads may create their empty bookkeeping table; the user allowed that narrow exception without permitting application setup, applied entries or repair.

### Lifecycle error payload boundary

History validation and schema refusal failures use the [type-only lifecycle errors](2026-11-12-0140-explicit-schema-transitions.md#trans-02). They disclose no stored versions, migration history or diagnostics. Safe invalid-input issues are the explicit exception at dependency/context validation, not an allowance to expose history-validation issues.

## Alternatives and supersession

- **HIST-01:** No additional alternative is selected by this record.
- **HIST-02:** Supersedes [HIST-H01](2026-11-12-0140-migration-classification.md#hist-h01).
- **HIST-H01:** Superseded by [HIST-02](2026-11-12-0140-migration-classification.md#hist-02).
- **HIST-03:** Supersedes [HIST-H02](2026-11-12-0140-migration-classification.md#hist-h02).
- **HIST-H02:** Superseded by [HIST-03](2026-11-12-0140-migration-classification.md#hist-03).

## Consequences

Malformed data is never normalized, repaired, deduplicated or interpreted as setup permission.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **HIST-01:** `S35` — `rework/foundation-model-contract.md`, lines 201–213; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 565,919–920.
- **HIST-02:** `S35` — `rework/foundation-model-contract.md`, lines 201,217–223; `S25` — `rework/equipped-migration-capabilities.md`, lines 74–90.
- **HIST-H01:** `S35` — `rework/foundation-model-contract.md`, lines 219–223; `S25` — `rework/equipped-migration-capabilities.md`, lines 74–90.
- **HIST-03:** `S35` — `rework/foundation-model-contract.md`, lines 182–184; `S25` — `rework/equipped-migration-capabilities.md`, lines 52.
- **HIST-H02:** `S35` — `rework/foundation-model-contract.md`, lines 182; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 1198.
