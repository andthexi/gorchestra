# Separate exact transport retries from new runtime attempts

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

An uncertain external submission may have created a run even when no local acknowledgment survived.

## Decision

<a id="hermes-04"></a>

### HERMES-04 — Submission identity and explicit reconciliation

**Disposition:** accepted. **Implementation:** unimplemented.

Distinguish Session continuity from one Run attempt without Core Session/Run domain records. For safely retryable Core-initiated work retain or deterministically reproduce exact request/fingerprint/stable idempotency key and opaque run association. Explicit identical transport retry reuses submission; new execution/request or closed-interaction attempt has new identity. Inspect exact known run on user action; unknown outcome requires reconciliation, not presumed failure or automatic resubmission. No guarantee of idempotent session creation or cross-system rollback.

**Recorded rationale:** Runtime request identity prevents accidental duplicate autonomous runs without requiring a durable submission processor.

## Alternatives and supersession

- **HERMES-04:** No additional alternative is selected by this record.

## Consequences

Explicit exact transport retries reuse frozen request/key; new work uses new identity. Runtime-specific API evidence is historical; concrete port/error storage remains deferred and no session-create atomicity is claimed.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **HERMES-04:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 970–985,1027–1048,1077–1105.
