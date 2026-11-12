# Distinguish scoped missing records from storage failures

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

A missing required parent or record differs from an existing empty collection and from a failed storage read.

## Decision

<a id="err-02"></a>

### ERR-02 — Not found is not null

**Disposition:** accepted. **Implementation:** unimplemented.

Missing or out-of-scope valid records/required parents return `{ type: "not-found", resource, id }`; resource is secret/project/asset/memory/memory-revision. Do not disclose actual owners. Empty child lists require existing scoped parent; malformed IDs and storage faults retain separate errors.

**Recorded rationale:** Successful null or empty data must not disguise a missing prerequisite or failed read.

## Alternatives and supersession

- **ERR-02:** No additional alternative is selected by this record.

## Consequences

Return scoped not-found without owner disclosure; malformed input and storage failures retain separate errors, with no null/empty fallback.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **ERR-02:** `S35` — `rework/foundation-model-contract.md`, lines 460–464; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 495–508,610.
