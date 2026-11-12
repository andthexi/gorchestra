# Keep immutable supporting Evidence with the citing content

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Findings need concrete support distinct from who proposed them, but citations do not require a separately managed registry.

## Decision

<a id="disc-04"></a>

### DISC-04 — Embedded Evidence

**Disposition:** accepted. **Implementation:** unimplemented.

Evidence is an immutable citing-record-owned value with concrete locator, available version and brief supporting excerpt/statement/observation, not a separate ID/registry/full-source archive. Every proposed Finding requires at least one such source; producer interaction alone is insufficient. Human statement/code/document/external output can qualify; public URL is not mandatory. Stored shape/acceptance does not certify truth or external source availability.

**Recorded rationale:** Support is retained with its observation without building an evidence-management service.

## Alternatives and supersession

- **DISC-04:** No additional alternative is selected by this record.

## Consequences

Citing content owns immutable locator/version/support. Neither storage nor human acceptance proves truth or preserves the external source forever.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **DISC-04:** `S04` — `rework/aggregate-ownership.md`, lines 144–150; `S28` — `rework/expedition-discovery.md`, lines 93–101.
