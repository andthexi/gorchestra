# Defer additional Project, Asset and provider variants

## Status

Decision disposition: deferred. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Current configuration needs one bounded Project/Asset/provider combination rather than hypothetical polymorphism.

## Decision

<a id="cut-07"></a>

### CUT-07 — Defer additional Project, Asset and provider variants

**Disposition:** deferred. **Implementation:** unimplemented.

Defer Project kinds beyond source-control, non-repository Asset configuration, generic/local Git, GitLab/Bitbucket and self-hosted/alternate GitHub endpoints. Documents/data remain usable as ordinary context/Evidence without another Asset variant.

**Recorded rationale:** Explicit MVP cuts are not a commitment or schedule to implement the saved options.

## Alternatives and supersession

- **CUT-07:** No additional alternative is selected by this record. The decision is to defer/exclude this capability, not approval of an unresolved implementation.

## Consequences

No extra variants, local Git or alternate GitHub endpoints are implemented. Other documents/data can remain context/Evidence.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **CUT-07:** `S20` — `rework/deferred-functionality.md`, lines 47; `S43` — `rework/project-source.md`, lines 98–102,114–122,134–138.
