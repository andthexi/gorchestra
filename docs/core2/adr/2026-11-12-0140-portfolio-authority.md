# Separate Portfolio scope, aggregate ownership and Consumer authority

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation and paused domain design.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

A containing Portfolio or Project does not make all records one aggregate or imply one database per aggregate.

## Decision

<a id="own-01"></a>

### OWN-01 — Portfolio boundary

**Disposition:** accepted. **Implementation:** unimplemented.

Portfolio is a first-class grouping/isolation boundary for Projects, reusable Memory and Secrets. Consumers own Portfolio registry/selection/access and deployment; one operational instance addresses one Portfolio, not a cross-Portfolio manager or persisted record created by as(). Workspace, identity, membership/authentication/authorization remain Consumer concerns.

**Recorded rationale:** Portable domain orchestration must not embed the Server Consumer’s tenancy model.

<a id="own-02"></a>

### OWN-02 — Ownership is consistency authority

**Disposition:** accepted. **Implementation:** unimplemented.

An aggregate governs its owned records; references/IDs/tables/SDK namespaces do not create or merge aggregates. Ownership neither requires physical row embedding/all-child loading nor implies deletion cascades, closure or archival. Cross-aggregate atomic transactions remain allowed; no microservices/eventual-consistency requirement follows.

**Recorded rationale:** Relationships and persistence layout must not silently decide lifecycle authority.

## Alternatives and supersession

- **OWN-01:** No additional alternative is selected by this record.
- **OWN-02:** No additional alternative is selected by this record.

## Consequences

Consumer authorization is required for externally exposed routes/tools; domain approval gates remain Core responsibilities.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **OWN-01:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 481–493,1125–1133; `S39` — `rework/model-overview.md`, lines 43–48,117–123; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 335.
- **OWN-02:** `S04` — `rework/aggregate-ownership.md`, lines 61–68,162–180; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 495–530.
