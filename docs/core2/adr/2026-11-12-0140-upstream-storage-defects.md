# Track adapter defects upstream without Core workarounds

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Published-package probes exposed separate rollback-isolation and resolver/DDL/codegen defects. Native table discovery was corrected separately.

## Decision

<a id="limit-03"></a>

### LIMIT-03 — No Core workaround for upstream defects

**Disposition:** accepted. **Implementation:** unimplemented.

Track Equipped #148 rollback isolation and #149 resolver/declarative-DDL/codegen mismatch upstream. Do not add compensation, serialization queues, locks, Repo wrappers, identity-only resolver restrictions or adapter exclusion solely to hide them. Verify real behavior before accepting affected implementation guarantees; introspection publication is not evidence these defects are fixed.

**Recorded rationale:** A design assumption allows independent work, not shipping known-unsafe behavior or fabricating a passing integration.

### Separate upstream evidence boundaries

- [Equipped #148](https://github.com/andthexi/equipped/issues/148): rollback-overlap isolation defect recorded against the inspected published package. A failing invocation must not erase another invocation's committed writes; verify this behavior before accepting the affected Core guarantee.
- [Equipped #149](https://github.com/andthexi/equipped/issues/149): declarative migration/codegen mapping can diverge from Repo resolution. Do not silently impose identity-only naming or wrap the mapping in Core.
- The separate in-memory table-discovery correction enumerates migration-declared tables and lazy CRUD stores. Its published 5.3.4 inclusion does not establish either issue fixed, nor qualify persistent adapters or custom layouts.

These are retained investigation outcomes and requirements for later real verification, not newly queried issue status or a D1 runtime pass.

## Alternatives and supersession

- **LIMIT-03:** No additional alternative is selected by this record.

## Consequences

Keep both issues upstream and verify affected guarantees during implementation. Publication or passing defect assertions do not prove correct runtime isolation/mapping.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **LIMIT-03:** `S35` — `rework/foundation-model-contract.md`, lines 105,219–223; `S26` — `rework/equipped-resolver-investigation.md`, lines 43–47; `S34` — `rework/foundation-full-audit.md`, lines 123–125; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 1409–1412.
