# Test lifecycle and Portfolio behavior with the real InMemoryAdapter

## Status

Decision disposition: accepted, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Historical probes establish only bounded design evidence; the implementation needs real public behavior tests without a persistent-backend matrix.

## Decision

<a id="test-01"></a>

### TEST-01 — API-first runtime boundary

**Disposition:** accepted. **Implementation:** unimplemented.

Test lifecycle and bound Portfolio APIs as the main integration boundary, with small direct runtime tests for pure helpers. Use the real Equipped InMemoryAdapter only, fresh per fixture. No fake Repo, module-import mocking, network, real credentials, persistent database provisioning, or backend qualification matrix. Local adapter faults/corrupt seed data may test failures without replacing ordinary storage behavior.

**Recorded rationale:** Observable consumer behavior gives stronger evidence than private call-order assertions while keeping the test setup bounded.

<a id="test-h01"></a>

### TEST-H01 — Historical persistent-backend matrix

**Disposition:** superseded. **Implementation:** unimplemented.

Earlier audit acceptance called for repeating selected guarantees on every supported persistent backend. This is no longer an implementation gate.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** Kevin explicitly limited storage-backed tests to real InMemoryAdapter, excluding a persistent-backend matrix without certifying those backends.

<a id="test-03"></a>

### TEST-03 — Synthetic Consumer callbacks

**Disposition:** accepted. **Implementation:** unimplemented.

Supply deterministic synthetic encode/decode functions via the normal dependency input. Exercise null, throw/rejection, malformed outputs and controllable pending promises for shutdown drainage. Do not add a production abstraction or explicit codec round-trip requirement.

**Recorded rationale:** This exercises the real Core/Valleyed/storage boundary without credentials or network.

## Alternatives and supersession

- **TEST-01:** Supersedes [TEST-H01](2026-11-12-0140-foundation-testing.md#test-h01).
- **TEST-H01:** Superseded by [TEST-01](2026-11-12-0140-foundation-testing.md#test-01).
- **TEST-03:** No additional alternative is selected by this record.

## Consequences

Fresh InMemoryAdapter fixtures exercise lifecycle/Portfolio behavior and synthetic callbacks. Persistent adapters remain unqualified by this suite; pure helpers may be tested directly.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **TEST-01:** `S35` — `rework/foundation-model-contract.md`, lines 17–27; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 614–618.
- **TEST-H01:** `S35` — `rework/foundation-model-contract.md`, lines 21; `S34` — `rework/foundation-full-audit.md`, lines 13,41.
- **TEST-03:** `S35` — `rework/foundation-model-contract.md`, lines 23; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 614–667.
