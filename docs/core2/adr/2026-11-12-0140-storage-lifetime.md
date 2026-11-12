# One Core-owned storage lifetime per factory

## Status

Decision disposition: accepted, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Supplying configuration is not the same as owning teardown. Per-operation shutdown can invalidate other views.

## Decision

<a id="store-01"></a>

### STORE-01 — Adapter and resolver construction

**Disposition:** accepted. **Implementation:** unimplemented.

Accept `storage: { adapter, resolveSchema }`, with resolver output tied to the adapter configuration type. Core constructs one native Repo via Repo.from(adapter).resolve(resolveSchema).build() and one Migrator from that pair. No supplied independent Repo, second adapter, factory-per-operation, custom adapter, metadata service, or global Instance.start/close. Call optional adapter connect/disconnect directly; absence is valid, but require the native session/read/write/history/introspection/migration functions the foundation actually uses.

**Recorded rationale:** Consistent construction and captured dependency references avoid mismatched ownership and silent native empty fallbacks.

<a id="store-h01"></a>

### STORE-H01 — Historical borrowed lifetime

**Disposition:** superseded. **Implementation:** unimplemented.

The earlier Consumer-managed borrowed-storage/no-shutdown rule is superseded. Per-operation adapter acquisition was a recommendation, not a selected second ownership mode.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** The user selected Core-managed connection startup/shutdown; supplying/configuring storage no longer implied that the Consumer owned physical teardown.

<a id="store-h02"></a>

### STORE-H02 — Historical per-operation startup

**Disposition:** superseded. **Implementation:** unimplemented.

An intermediate approach let setup/migrate/connect start and stop their own storage. Shared Core-owned lifetime supersedes it. The later lazy-entry startup path and adapter factory alternatives were recommendations, not additional accepted contracts.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** Shared lifetime ownership prevents one operation's teardown from invalidating an active domain connection. The later per-operation factory and lazy-entry startup alternatives were recommendations, not additional accepted contracts.

## Alternatives and supersession

- **STORE-01:** Supersedes [STORE-H01](2026-11-12-0140-storage-lifetime.md#store-h01), [STORE-H02](2026-11-12-0140-storage-lifetime.md#store-h02).
- **STORE-H01:** Superseded by [STORE-01](2026-11-12-0140-storage-lifetime.md#store-01).
- **STORE-H02:** Superseded by [STORE-01](2026-11-12-0140-storage-lifetime.md#store-01).

## Consequences

Consumers configure exclusive lifetime ownership; all capability views and attributed facades share local admission and resources.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **STORE-01:** `S35` — `rework/foundation-model-contract.md`, lines 35–41; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 468–474.
- **STORE-H01:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 1170,1178; `S20` — `rework/deferred-functionality.md`, lines 55.
- **STORE-H02:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 1162–1172.
