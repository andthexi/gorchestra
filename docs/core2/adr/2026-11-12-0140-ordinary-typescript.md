# Use ordinary TypeScript without a separate type-test suite

## Status

Decision disposition: accepted, superseded. Individual keyed statements below control mixed records.

Implementation: **partial** at Task 0: normal project configuration and testing guidance exist, but no production/runtime-test source exists yet. D1 recorded the decision before scaffolding. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

The user rejected maintaining a dedicated type-only test suite despite earlier successful feasibility probes.

## Decision

<a id="test-02"></a>

### TEST-02 — Ordinary TypeScript only

**Disposition:** accepted. **Implementation:** partial: ordinary project reference configured and executed; expected no-input diagnostic remains until Task 1. The approved root/package instruction chain records the scoped no-separate-type-tests policy.

Use normal project TypeScript checking for production and runtime-test source. No dedicated type-assertion suites, tsd/expectTypeOf blocks, positive/negative compile-only fixtures, or expected-compiler-error harness. Keep precise production types and runtime validation.

**Recorded rationale:** The user judged a separately maintained type-test suite redundant; compilation is not claimed to prove every invalid Consumer program.

<a id="test-h02"></a>

### TEST-H02 — Historical dedicated compile fixtures

**Disposition:** superseded. **Implementation:** unimplemented.

The earlier audit strategy required maintained positive and negative type-only fixtures for sibling pipes, paths, arity, and lifecycle narrowing. Those obligations are superseded; retained probe outputs are historical evidence only.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** Kevin rejected a maintained separate type suite as unnecessary; ordinary source TypeScript and runtime behavior tests remain, along with the typed API requirements.

## Alternatives and supersession

- **TEST-02:** Supersedes [TEST-H02](2026-11-12-0140-ordinary-typescript.md#test-h02).
- **TEST-H02:** Superseded by [TEST-02](2026-11-12-0140-ordinary-typescript.md#test-02).

## Consequences

Actual production/runtime-test source remains normally typechecked. Precise API inference and runtime validation remain required without claiming every invalid program is compiler-proven.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **TEST-02:** `S35` — `rework/foundation-model-contract.md`, lines 25; `S34` — `rework/foundation-full-audit.md`, lines 137–156; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 694.
- **TEST-H02:** `S35` — `rework/foundation-model-contract.md`, lines 25; `S34` — `rework/foundation-full-audit.md`, lines 59,137,141,156; `S46` — `rework/sdk-handler-tree.md`, lines 304,308–310.
