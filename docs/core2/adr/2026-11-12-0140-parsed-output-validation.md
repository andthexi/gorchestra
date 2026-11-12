# Validate parsed Result shapes before commit

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Final output shape validation can reject malformed Results but cannot prove cross-record relational consistency.

## Decision

<a id="err-04"></a>

### ERR-04 — Shape-only parsed output

**Disposition:** accepted. **Implementation:** unimplemented.

Validate Result envelope and applicable branch before commit, retaining normal Valleyed undeclared-field stripping and returning the parsed Result. Invalid envelope/branch yields type-only invalid-output with rollback. Do not add strict-object equality or relational output predicates; Memory pair consistency remains an atomic handler invariant tested by state, not detected by shape alone. Exact decoder response keys remain a separate rule.

**Recorded rationale:** The user retained lightweight shape validation rather than a second semantic verification pass.

## Alternatives and supersession

- **ERR-04:** No additional alternative is selected by this record.

## Consequences

Validate and return parsed values before commit with normal stripping. Domain consistency remains handler/state-test responsibility; exact decoder key contracts remain distinct.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **ERR-04:** `S35` — `rework/foundation-model-contract.md`, lines 97–99; `S46` — `rework/sdk-handler-tree.md`, lines 208–214; `S34` — `rework/foundation-full-audit.md`, lines 158–175.
