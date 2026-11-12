# Keep repository-provider behavior Core-owned and read-only

## Status

Decision disposition: accepted, deferred, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Runtime portability and consistent repository semantics need different ownership boundaries.

## Decision

<a id="port-01"></a>

### PORT-01 — Core-owned GitHub

**Disposition:** accepted. **Implementation:** unimplemented.

Core constructs/invokes its own github.com provider implementation uniformly across Consumers. Consumers supply no repository adapter/client factory/registration. Targets come from Assets and credentials from Consumer decode. Metadata/configuration/factory paths perform no provider preflight; live checks are explicit and failure changes no domain state.

**Recorded rationale:** Consistent repository behavior must not be reimplemented by every Consumer.

<a id="port-h01"></a>

### PORT-H01 — Historical Consumer repository adapter

**Disposition:** superseded. **Implementation:** unimplemented.

The earlier blanket Consumer-supplied repository/provider adapter choice is superseded for repository interactions by internally constructed Core behavior. Storage, secrets and generic runtime boundaries remain Consumer supplied.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** Repository behavior should be the same across Consumers, unlike deployment-varying storage, secrets and runtime integration. Core now constructs the provider implementation.

<a id="port-02"></a>

### PORT-02 — Read-only repository scope

**Disposition:** deferred. **Implementation:** unimplemented.

Retain direction for explicit access check, branch/tag/commit resolution to one commit, directory listing and file reading at that commit. Defer search/history/diff/clone and writes/execution/shipping. Exact ref selector (including proposed default-branch variants), permissions/redirect/name-reuse/provenance/error contracts remain unselected; do not invent default branch or untyped fallback.

**Recorded rationale:** Minimal repository context is enough for later planning, but unfinished API details must not become foundation dependencies.

## Alternatives and supersession

- **PORT-01:** Supersedes [PORT-H01](2026-11-12-0140-repository-runtime-boundary.md#port-h01).
- **PORT-H01:** Superseded by [PORT-01](2026-11-12-0140-repository-runtime-boundary.md#port-01).
- **PORT-02:** No additional alternative is selected by this record. The decision is to defer/exclude this capability, not approval of an unresolved implementation.

## Consequences

Repository access/read signatures and AgentRuntime injection details remain deferred; foundation dependencies are storage plus secrets only, without placeholders.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **PORT-01:** `S43` — `rework/project-source.md`, lines 140–148,384–392; `S45` — `rework/sdk-entry-class-proposal.md`, lines 58–60; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 849–855.
- **PORT-H01:** `S43` — `rework/project-source.md`, lines 144; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 851.
- **PORT-02:** `S35` — `rework/foundation-model-contract.md`, lines 494–496,531; `S43` — `rework/project-source.md`, lines 146; `S20` — `rework/deferred-functionality.md`, lines 115.
