# Derive records and validation from model-owned schemas

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Types alone do not validate serialized or stored data, and duplicated schemas drift.

## Decision

<a id="schema-01"></a>

### SCHEMA-01 — One authoritative schema

**Disposition:** accepted. **Implementation:** unimplemented.

Each persisted model owns one Equipped schema; derive canonical runtime pipes and types from its fields. Persist nested objects as objects. Reuse field/spec pipes in operation inputs and safe projections; no parallel handwritten model interfaces or flattened storage DTOs. Use Valleyed, not another schema library.

**Recorded rationale:** One representation prevents duplicate contracts and incompatible field validators.

<a id="schema-03"></a>

### SCHEMA-03 — Five model and logical table names

**Disposition:** accepted. **Implementation:** unimplemented.

The foundation maps Secret to `secrets`, Project to `projects`, Asset to `assets`, Memory to `memories`, and MemoryRevision to `memory_revisions`. These are the five Core logical schema/table names used by the literal initial migration snapshot. Keep each model's selected fields and nested object representations; do not substitute a different MemoryRevision table spelling or a second record representation. Consumer resolveSchema still selects adapter-specific locations within the isolated Portfolio boundary; these logical names do not impose an identity-only physical resolver.

**Recorded rationale:** The accepted model/table contract and initial createTable changes must describe the same five persisted models without coupling released migrations to mutable model imports.

### Initial catalog relationship

The [immutable catalog decision](2026-11-12-0140-migration-catalog.md#mig-02) snapshots the five logical table names in SCHEMA-03 and their selected fields. Physical resolver configuration follows the [storage dependency](2026-11-12-0140-storage-lifetime.md#store-01) and [Portfolio isolation](2026-11-12-0140-portfolio-storage-isolation.md#store-02) contracts; no identity-only resolver restriction is added.

## Alternatives and supersession

- **SCHEMA-01:** No additional alternative is selected by this record.
- **SCHEMA-03:** No additional alternative is selected by this record.

## Consequences

Models own persistence; operations own input/output/behavior. Released migrations remain immutable snapshots rather than references to current schemas.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **SCHEMA-01:** `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 438–450,866–891; `S34` — `rework/foundation-full-audit.md`, lines 245–254; `S46` — `rework/sdk-handler-tree.md`, lines 200,232.
- **SCHEMA-03:** `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 438–448,927–945.
