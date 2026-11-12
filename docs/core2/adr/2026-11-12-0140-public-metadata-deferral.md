# Keep definition metadata internal until explicitly needed

## Status

Decision disposition: deferred. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Internal metadata is useful for one definition source without establishing a present Consumer inspection need.

## Decision

<a id="def-04"></a>

### DEF-04 — Internal metadata only

**Disposition:** deferred. **Implementation:** unimplemented.

Defer public metadata inspection/export or generated manifests. Expose bound operations, not raw definitions, handlers, Repo, migration internals or unsafe Secret storage types. A later metadata-only projection can derive from the same tree if requested.

**Recorded rationale:** Metadata does not justify expanding the public API or exposing bypass paths.

## Alternatives and supersession

- **DEF-04:** No additional alternative is selected by this record. The decision is to defer/exclude this capability, not approval of an unresolved implementation.

## Consequences

Expose only bound operations now. A later metadata-only projection may derive from the same tree, not a copied registry or raw handler export.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **DEF-04:** `S46` — `rework/sdk-handler-tree.md`, lines 186; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 317.
