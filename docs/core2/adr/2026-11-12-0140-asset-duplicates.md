# Check scoped duplicate targets without concurrent uniqueness

## Status

Decision disposition: accepted, deferred. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Target identity depends on scoped owner/name, not credentials. A transactional lookup does not establish a concurrent unique winner.

## Decision

<a id="repo-03"></a>

### REPO-03 — Project-scoped duplicate check

**Disposition:** accepted. **Implementation:** unimplemented.

Before Asset insertion, validate scoped records and compare ASCII-case-insensitive owner/name, ignoring secretId. Return `{ type: "duplicate-asset-target", assetId }` for an existing scoped match without new record, mutation, casing rewrite or attribution. Different Projects may configure the same target.

**Recorded rationale:** Credentials are not a target aliasing scheme; refusal is not create-as-existing or rebinding.

<a id="repo-04"></a>

### REPO-04 — Concurrent uniqueness deferred

**Disposition:** deferred. **Implementation:** unimplemented.

Defer concurrent Asset uniqueness and unique-index/constraint integration. Overlapping read-compare-insert can produce duplicates; do not add locks, shadow fields, overlap detector, uniqueness ledger, retry, cleanup or a Repo workaround. Consumers avoid overlapping same-Project creation when relying on this check; Core does not enforce scheduling.

**Recorded rationale:** The selected MVP knowingly narrows duplicate prevention without claiming concurrency safety.

## Alternatives and supersession

- **REPO-03:** No additional alternative is selected by this record.
- **REPO-04:** No additional alternative is selected by this record. The decision is to defer/exclude this capability, not approval of an unresolved implementation.

## Consequences

Reject observed duplicates without mutation and preserve supplied casing. Overlapping creates can race until an explicitly designed constraint integration exists.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **REPO-03:** `S43` — `rework/project-source.md`, lines 410–426; `S35` — `rework/foundation-model-contract.md`, lines 474–478.
- **REPO-04:** `S20` — `rework/deferred-functionality.md`, lines 86–90; `S46` — `rework/sdk-handler-tree.md`, lines 102–104.
