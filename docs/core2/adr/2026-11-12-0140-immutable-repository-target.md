# Keep repository target identity fixed under Asset ID

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Accepted work refers to stable Core Asset identity, while remote repository names may move or be reused.

## Decision

<a id="repo-02"></a>

### REPO-02 — Target immutability

**Disposition:** accepted. **Implementation:** unimplemented.

Owner/name, provider, Asset type/ownership and created remain fixed under the Asset ID. A different target, including GitHub rename or transfer, requires a new Asset; do not retarget old references. Provider redirect/name-reuse handling and exact safe read errors remain unselected.

**Recorded rationale:** Stable configuration identity prevents silent redirection of accepted work, but does not freeze provider names.

## Alternatives and supersession

- **REPO-02:** No additional alternative is selected by this record.

## Consequences

A different owner/name requires a new Asset and does not silently repoint old references. Exact provider redirect/name-reuse behavior is still unselected.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **REPO-02:** `S43` — `rework/project-source.md`, lines 462–470; `S36` — `rework/foundation-plan-audit.md`, lines 168–180.
