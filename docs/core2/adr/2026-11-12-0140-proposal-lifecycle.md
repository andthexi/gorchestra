# Store immutable interaction-owned proposals before human acceptance

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

An agent can propose structured work but cannot supply its own authorization or replace what the user reviewed.

## Decision

<a id="prop-01"></a>

### PROP-01 — Tools store, humans accept

**Disposition:** accepted. **Implementation:** unimplemented.

Agent proposal tools validate/store immutable unaccepted results in the trusted bound AgentInteraction and return after save with proposal/pending identity, not after approval. No manual capture step or transaction spanning human review. Acceptance separately loads stored content by identity/fingerprint, verifies provenance/currentness/domain gates and applies the exact reviewed outcome, never a replacement payload.

**Recorded rationale:** Separate storage from authority without long-running approval-waiting tool calls.

<a id="prop-02"></a>

### PROP-02 — Latest eligibility and retained versions

**Disposition:** accepted. **Implementation:** unimplemented.

Only latest current proposal is eligible; new valid submission creates next immutable version. Explicit UI rejection makes that version ineligible while interaction/chat remain open; older versions never revive. Retain earlier/rejected/superseded bodies and metadata. Core does not infer rejection or refinement from ordinary chat.

**Recorded rationale:** One clear current approval target and full structured history avoid accidental rollback to obsolete proposals.

<a id="prop-03"></a>

### PROP-03 — Repeat and runtime timing

**Disposition:** accepted. **Implementation:** unimplemented.

Repeated successful acceptance returns an already-accepted error, not replayed success or new materialization/attribution. Consumer reads existing outcome after lost response. Valid current saved proposal can be accepted before runtime run terminates; completed interaction refuses later proposals and late runtime observations cannot undo acceptance or reset completion.

**Recorded rationale:** Domain authority follows committed human acceptance, not runtime scheduling.

<a id="prop-04"></a>

### PROP-04 — Relevant staleness checks

**Disposition:** accepted. **Implementation:** unimplemented.

Question acceptance checks its own definition/prerequisites/claim/current proposal/provenance/phase rather than invalidating on every whole-Map change. Independent new Findings/Decisions do not automatically stale another answer; users assess semantic adequacy. Credential-only changes and added Project Assets do not invalidate proposals or waive normal gates.

**Recorded rationale:** Avoid unnecessary resubmission for unrelated operational/context changes without pretending Core detects semantic conflicts.

## Alternatives and supersession

- **PROP-01:** No additional alternative is selected by this record.
- **PROP-02:** No additional alternative is selected by this record.
- **PROP-03:** No additional alternative is selected by this record.
- **PROP-04:** No additional alternative is selected by this record.

## Consequences

Proposal-version storage is retained, not the Hermes transcript; exact identity/fingerprint transport and concurrency errors remain unresolved.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **PROP-01:** `S41` — `rework/pre-delivery-interactions.md`, lines 17–32,102–108; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 1003–1005.
- **PROP-02:** `S41` — `rework/pre-delivery-interactions.md`, lines 34–42,110–116.
- **PROP-03:** `S41` — `rework/pre-delivery-interactions.md`, lines 118–124,140–146.
- **PROP-04:** `S41` — `rework/pre-delivery-interactions.md`, lines 126–130,156–170; `S28` — `rework/expedition-discovery.md`, lines 133.
