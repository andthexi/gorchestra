# Isolate Portfolio data, migration history and inspection together

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

CRUD resolution, declarative migrations, native ledger and introspection can address different namespaces despite sharing one adapter instance.

## Decision

<a id="store-02"></a>

### STORE-02 — Complete Portfolio isolation

**Disposition:** accepted. **Implementation:** unimplemented.

One Consumer-supplied database boundary per Portfolio must isolate application CRUD, declarative schema work, native migration history and introspection together. Shared database servers are allowed; table prefixes alone or an unscoped shared ledger are insufficient. Consumers select/provision the engine; Core neither branches on it nor adds an isolation detector. No fallback to default/shared namespaces.

**Recorded rationale:** One adapter object does not establish that every native subsystem addresses the same boundary.

## Alternatives and supersession

- **STORE-02:** No additional alternative is selected by this record.

## Consequences

The Consumer must provide a coherent isolated Portfolio boundary. Prefixes alone prove neither isolation nor compatibility; Core adds no engine-specific detector or fallback.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **STORE-02:** `S35` — `rework/foundation-model-contract.md`, lines 35–41; `S25` — `rework/equipped-migration-capabilities.md`, lines 58–60; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 1180–1186.
