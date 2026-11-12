# Separate external-effect intent, approval and verified receipt

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Authorizing domain work, granting an exact external effect and observing that effect are different facts.

## Decision

<a id="auth-01"></a>

### AUTH-01 — Operation, approval and receipt

**Disposition:** accepted. **Implementation:** unimplemented.

Operation is independent aggregate for a specific proposed external effect, owning Approval and effect-specific evidence/Receipts, not every SDK call or AgentRuntime submission. Approval binds exact fingerprint/scope; changed effect cannot reuse it. Consumer access permission, Finding, Decision, Blueprint acceptance, Review, Feedback, runtime completion and Receipt are not interchangeable authorities. External state must be read back before recording success; approved domain work does not authorize merge/deploy/send/purchase/delete/publish.

**Recorded rationale:** Intent, permission and observed outcome are distinct boundaries.

## Alternatives and supersession

- **AUTH-01:** No additional alternative is selected by this record.

## Consequences

Operation owns its Approval and Receipt; callers/agents cannot infer privileged permission from Blueprint or Review acceptance. Verify external state before recording success.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **AUTH-01:** `S04` — `rework/aggregate-ownership.md`, lines 246–262; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 777–787,1125–1150; `S21` — `rework/delivery-lifecycle.md`, lines 15–16.
