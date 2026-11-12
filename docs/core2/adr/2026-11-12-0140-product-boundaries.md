# Keep Core portable and stop the current product at planning handoff

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

The broader goal-to-delivery product includes downstream work the user already handles with Trowel. A conceptual checkpoint does not settle every implementation detail.

## Decision

<a id="scope-01"></a>

### SCOPE-01 — Opinionated product first

**Disposition:** accepted. **Implementation:** unimplemented.

Keep Gorchestra in this repository as a reusable opinionated goal-to-delivery Core, with a long-term general-workflow-engine direction. Current pre-delivery product scope stops at Blueprint acceptance and atomic Delivery/Slice/dependency materialization; planned means handed off, not executed/shipped. The latest checkpoint pauses Expedition entirely while the five-model foundation is built.

**Recorded rationale:** Get the selected fixed lifecycle working without arbitrary user-programmable stages or expanding downstream scope.

<a id="scope-02"></a>

### SCOPE-02 — No implied integrations

**Disposition:** accepted. **Implementation:** unimplemented.

Hermes is the immediate Consumer/runtime target; Core must remain runtime-portable and must not depend on Hermes Kanban. Kanban/Wayfinder/Trowel patterns are influences, not model/storage/API integration. The user’s existing Trowel usage authorizes no bridge, export format, invocation or state synchronization.

**Recorded rationale:** Existing tooling explains scope but supplies no integration contract.

## Alternatives and supersession

- **SCOPE-01:** No additional alternative is selected by this record.
- **SCOPE-02:** No additional alternative is selected by this record.

## Consequences

Foundation authorization does not resume Expedition, runtime integration, execution or shipping. Historical visual recommendations do not override later explicit selections.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **SCOPE-01:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 65–90; `S42` — `rework/pre-delivery-mvp.md`, lines 3–29; `S35` — `rework/foundation-model-contract.md`, lines 5–9; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 199–226.
- **SCOPE-02:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 76,100–118; `S42` — `rework/pre-delivery-mvp.md`, lines 7,27–29,218–223; `S20` — `rework/deferred-functionality.md`, lines 141.
