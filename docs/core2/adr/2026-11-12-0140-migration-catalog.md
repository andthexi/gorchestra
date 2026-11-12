# Use immutable author-time ULID migrations and the native ledger

## Status

Decision disposition: accepted, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

A separate numeric marker or Core ledger duplicates Equipped’s applied history and requires another runner.

## Decision

<a id="mig-01"></a>

### MIG-01 — Native history only

**Disposition:** accepted. **Implementation:** unimplemented.

Use Equipped Migrator and its native id/appliedAt ledger as the only persisted migration history. Each fixed ULID catalog entry is one native migration with ordered Equipped changes; no per-step IDs, numeric schema-version, copied definitions, version conversion or second marker. Package version is independent.

**Recorded rationale:** Native execution and tracking already compose; duplicating them creates inconsistent authority.

<a id="mig-h01"></a>

### MIG-H01 — Historical last-version-only tracking

**Disposition:** superseded. **Implementation:** unimplemented.

The earlier selected tracking policy stored only the last schema version. Equipped native applied history supersedes that policy. The concrete new Core-owned version schema was an unselected proposal, not a previously accepted implementation of this policy; its Repo-backed single-marker probes are evidence about that rejected alternative, not acceptance or a persisted model to implement.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** Native Migrator execution and its ledger were selected instead of last-only tracking or a proposed duplicate Core schema/runner.

<a id="mig-02"></a>

### MIG-02 — Immutable catalog

**Disposition:** accepted. **Implementation:** unimplemented.

Generate a migration ULID once at authoring and save the exact literal. Released IDs and ordered changes never change or disappear; new entries must sort after the released tail. Retain all released prefixes and apply pending changes serially, never skip/replay steps or generate IDs on load/startup. Initial migration literal: `01m76d124c6e848k2hfvb4mar2`; snapshot Secret/`secrets`, Project/`projects`, Asset/`assets`, Memory/`memories` and MemoryRevision/`memory_revisions`, not imports from mutable current models. The logical names and selected field representations follow SCHEMA-03; Consumer resolver configuration remains separate.

**Recorded rationale:** Authoring/merge review establishes order; ULID clocks alone do not prove dependency order.

<a id="mig-03"></a>

### MIG-03 — Native builder validation

**Disposition:** accepted. **Implementation:** unimplemented.

Construct Migrator.from(repo, adapter).migrations(migrations).build() and accept its validation cost. No direct constructor bypass, bespoke second runtime catalog scan, cache, or invalid-catalog public error. Test fixed IDs/order/change compatibility and full-run setup/upgrade/rollback using native validation and test-owned catalogs.

**Recorded rationale:** The builder remains authority for native change algebra while runtime history validation addresses external data.

<a id="mig-h02"></a>

### MIG-H02 — Historical tests-only catalog checks

**Disposition:** superseded. **Implementation:** unimplemented.

Earlier tests-only intent for Equipped’s built-in catalog validation is superseded; explicit developer tests remain required.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** The user later selected the ordinary runtime fluent builder and explicitly accepted its validation cost. Developer tests remain; no second bespoke runtime scan is selected.

<a id="mig-h03"></a>

### MIG-H03 — Historical sequential numeric schema progression

**Disposition:** superseded. **Implementation:** unimplemented.

Earlier schema progression used an ordered sequence of numeric Core schema versions with a version-to-migration-ID mapping. Author-time ULID migration IDs now directly identify progression; no sequential schema-version number, conversion or separate current-version marker remains. The padded core- encoding was only a proposal, not an accepted historical identifier format. MemoryRevision.version is unrelated and remains numeric.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** The later choice uses stable author-time ULID catalog IDs directly for schema progression and removes numeric conversion and duplicate markers.

### Unselected Core version-schema proposal

The proposal to implement last-version tracking with a new Core-owned version schema was not adopted. Equipped's native ledger was selected instead. The single-marker probe only demonstrated bounded transaction composition; neither its table nor synthetic version values are accepted model contracts. MIG-H01 records the actually selected earlier tracking policy, and MIG-H03 records the separate numeric-progression history.

The initial snapshot uses the [five logical model/table names](2026-11-12-0140-schema-ownership.md#schema-03); resolver configuration is not replaced by hardcoded physical locations.

## Alternatives and supersession

- **MIG-01:** Supersedes [MIG-H01](2026-11-12-0140-migration-catalog.md#mig-h01), [MIG-H03](2026-11-12-0140-migration-catalog.md#mig-h03).
- **MIG-H01:** Superseded by [MIG-01](2026-11-12-0140-migration-catalog.md#mig-01).
- **MIG-02:** No additional alternative is selected by this record.
- **MIG-03:** Supersedes [MIG-H02](2026-11-12-0140-migration-catalog.md#mig-h02).
- **MIG-H02:** Superseded by [MIG-03](2026-11-12-0140-migration-catalog.md#mig-03).
- **MIG-H03:** Superseded by [MIG-01](2026-11-12-0140-migration-catalog.md#mig-01).

## Consequences

Forward migration concerns only redesigned stores. Every released prefix remains supported; new changes append after the released tail.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **MIG-01:** `S35` — `rework/foundation-model-contract.md`, lines 146–156,172–180; `S25` — `rework/equipped-migration-capabilities.md`, lines 3–11.
- **MIG-H01:** `S35` — `rework/foundation-model-contract.md`, lines 174; `S25` — `rework/equipped-migration-capabilities.md`, lines 9,99,127.
- **MIG-02:** `S35` — `rework/foundation-model-contract.md`, lines 148–154,213–215; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 919–958.
- **MIG-03:** `S35` — `rework/foundation-model-contract.md`, lines 186–203; `S25` — `rework/equipped-migration-capabilities.md`, lines 17–34.
- **MIG-H02:** `S35` — `rework/foundation-model-contract.md`, lines 195; `S34` — `rework/foundation-full-audit.md`, lines 194.
- **MIG-H03:** `S35` — `rework/foundation-model-contract.md`, lines 148–154,172,180; `S34` — `rework/foundation-full-audit.md`, lines 200.
