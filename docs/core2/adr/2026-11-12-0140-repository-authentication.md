# Require explicit same-Portfolio PAT-backed repository credentials

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Configured repository access needs an explicit same-Portfolio credential path independent of host-local authentication.

## Decision

<a id="secret-03"></a>

### SECRET-03 — PAT binding and reuse

**Disposition:** accepted. **Implementation:** unimplemented.

Every repository, public or private, requires secretId referencing an existing same-Portfolio Secret containing a manually supplied GitHub PAT. Allow sharing across Assets/Projects within the Portfolio. No anonymous/host credential fallback, cross-Portfolio references, GitHub App setup or automatic token issue/renewal. Fine-grained PAT and exact permissions remain unselected.

**Recorded rationale:** One explicit authenticated path avoids silently using unrelated credentials; a reference does not prove permissions.

## Alternatives and supersession

- **SECRET-03:** No additional alternative is selected by this record.

## Consequences

Manually provision PATs, including public repositories. Shared Secrets can affect multiple Projects; existence/reference validation does not establish provider permissions.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **SECRET-03:** `S43` — `rework/project-source.md`, lines 150–182; `S35` — `rework/foundation-model-contract.md`, lines 506.
