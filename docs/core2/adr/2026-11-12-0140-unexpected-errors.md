# Return safe internal-error after unexpected exceptions

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Unexpected Core exceptions must not expose raw internals or be indiscriminately labeled expected storage faults.

## Decision

<a id="err-03"></a>

### ERR-03 — Unexpected exceptions

**Disposition:** accepted. **Implementation:** unimplemented.

Unexpected handler and new/setup/migrate exceptions become safe type-only internal-error after applicable rollback/cleanup, not public Promise rejection. Classify expected storage failures at their boundary; never indiscriminately relabel bugs as storage errors. Observable cleanup failure wins and closes admission; ordinary successfully rolled-back failures do not.

**Recorded rationale:** A predictable safe Result boundary does not erase failure provenance.

## Alternatives and supersession

- **ERR-03:** No additional alternative is selected by this record.

## Consequences

After applicable rollback/cleanup return safe internal-error. Observable cleanup failures take precedence; error labels alone never prove rollback success.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **ERR-03:** `S35` — `rework/foundation-model-contract.md`, lines 95,113,131; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 550,1076.
