# Defer unsupported coordination instead of wrapping Equipped

## Status

Decision disposition: deferred, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Native migration locks do not provide the previously requested shared/exclusive nonblocking protocol; adapters expose different guarantees.

## Decision

<a id="limit-02"></a>

### LIMIT-02 — Unsupported storage coordination

**Disposition:** deferred. **Implementation:** unimplemented.

Defer nonblocking cross-process shared/exclusive Portfolio guards, online schema/domain/factory overlap guarantees, storage-busy/schema-operation-in-progress outcomes, universal emptiness certification and detection of adapter-hidden cleanup failures. Do not introduce lock/inspection services, custom adapter capabilities, engine dispatch or hidden waits/retries as equivalent guarantees.

**Recorded rationale:** Use supported native primitives and document non-overlapping maintenance rather than mandate an unimplemented adapter extension.

<a id="limit-h02"></a>

### LIMIT-H02 — Historical shared/exclusive guard

**Disposition:** superseded. **Implementation:** unimplemented.

An earlier selected Portfolio-scoped cross-instance shared/exclusive guard was to coordinate setup/migration, ordinary work and factory inspection with immediate nonblocking refusal. The current native-capability decision defers this stronger guarantee rather than requiring a custom adapter.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** Stock Equipped lacks the stronger shared/exclusive immediate-refusal protocol; use existing capabilities and defer the unsupported guarantee rather than require custom services.

<a id="limit-h03"></a>

### LIMIT-H03 — Historical contention error names

**Disposition:** superseded. **Implementation:** unimplemented.

The earlier schema-operation-in-progress guard error was superseded by storage-busy; the latter is now deferred together with guaranteed nonblocking guard detection. Neither belongs in current operation error unions.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** Reliable nonblocking guard outcomes are deferred with the absent guard. Arbitrary storage faults or waiting cannot be relabeled as detected contention.

## Alternatives and supersession

- **LIMIT-02:** Supersedes [LIMIT-H02](2026-11-12-0140-storage-support-limits.md#limit-h02), [LIMIT-H03](2026-11-12-0140-storage-support-limits.md#limit-h03). The decision is to defer/exclude this capability, not approval of an unresolved implementation.
- **LIMIT-H02:** Superseded by [LIMIT-02](2026-11-12-0140-storage-support-limits.md#limit-02).
- **LIMIT-H03:** Superseded by [LIMIT-02](2026-11-12-0140-storage-support-limits.md#limit-02).

## Consequences

Local admission is not cross-process exclusion. Unsupported adapter/layout paths remain unsupported; no database engine is selected.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **LIMIT-02:** `S20` — `rework/deferred-functionality.md`, lines 57–74; `S25` — `rework/equipped-migration-capabilities.md`, lines 134–143; `S35` — `rework/foundation-model-contract.md`, lines 158–168.
- **LIMIT-H02:** `S35` — `rework/foundation-model-contract.md`, lines 158–168; `S20` — `rework/deferred-functionality.md`, lines 64–68.
- **LIMIT-H03:** `S35` — `rework/foundation-model-contract.md`, lines 160; `S20` — `rework/deferred-functionality.md`, lines 67.
