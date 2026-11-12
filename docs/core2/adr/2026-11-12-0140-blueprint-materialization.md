# Atomically create the complete reviewed initial work graph

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Acceptance authorizes precise domain work, not execution or privileged external actions.

## Decision

<a id="bp-03"></a>

### BP-03 — One final acceptance transaction

**Disposition:** accepted. **Implementation:** unimplemented.

Validate exact current stored candidate and recheck readiness/one-creation gates; atomically create immutable Blueprint accepted revision/content fingerprint, human acceptance/verdict, Deliveries/Slices/dependencies, interaction completion and planned phase. Failure leaves no partial outcome. Acceptance binds reviewed identity/revision/fingerprint/actor/authorized scope, not later changed content.

**Recorded rationale:** A coherent acceptance boundary prevents half a work graph or falsely completed planning.

<a id="bp-04"></a>

### BP-04 — Complete nonempty graph

**Disposition:** accepted. **Implementation:** unimplemented.

Blueprint supplies all initial Delivery outcomes/criteria and Slice goals/Instructions/criteria/dependencies. At least one Delivery and at least one Slice per Delivery; empty structural groups/placeholders do not count. No deferred initial Slice breakdown. Agents later choose implementation steps within immutable accepted instructions.

**Recorded rationale:** Single acceptance can be reviewed coherently before planning closes.

## Alternatives and supersession

- **BP-03:** No additional alternative is selected by this record.
- **BP-04:** No additional alternative is selected by this record.

## Consequences

Initial Delivery/Slice record/error/read schemas and fingerprint encoding remain unresolved; no placeholder execution or Trowel bridge is implemented.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **BP-03:** `S18` — `rework/blueprint-lifecycle.md`, lines 67–86; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 767–787.
- **BP-04:** `S18` — `rework/blueprint-lifecycle.md`, lines 88–96; `S42` — `rework/pre-delivery-mvp.md`, lines 163–166.
