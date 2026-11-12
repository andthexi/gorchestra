# Replace Secret values atomically under stable identity

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Users need to renew a shared credential without recreating its Core identity or every Asset binding.

## Decision

<a id="secret-05"></a>

### SECRET-05 — Atomic replacement

**Disposition:** accepted. **Implementation:** unimplemented.

Update value under the same Secret ID and all existing Asset bindings. Atomically write only valueRef/valueUpdated; last successful commit wins, not start/response order. No expected-old-value/version guard, equality check, decode/provider call or token revocation. Repeated raw values/references still encode/apply and record. No attribution cascade to Asset/Project.

**Recorded rationale:** Credential maintenance accepts stale-screen overwrites but must preserve unrelated fields and other committed invocations.

## Alternatives and supersession

- **SECRET-05:** No additional alternative is selected by this record.

## Consequences

Atomically replace only reference/valueUpdated and accept last-successful-commit-wins. Stale-screen overwrites and external-store side effects remain explicit limitations.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **SECRET-05:** `S43` — `rework/project-source.md`, lines 186–204,208,216,230–236; `S35` — `rework/foundation-model-contract.md`, lines 377–393.
