# Apply valid writes and record their attribution

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Universal equality/no-op detection complicates writes and cannot establish equality of values behind opaque references.

## Decision

<a id="val-06"></a>

### VAL-06 — Apply and record

**Disposition:** accepted. **Implementation:** unimplemented.

Valid supported writes apply and record their operation-specific attribution even for identical values. Write only owned fields, never a stale whole-record copy. Explicit version/lifecycle/uniqueness and no-change/repeated-acceptance rules prevail; this adds no update endpoint, generic stamp, idempotency, retry or Event.

**Recorded rationale:** Fewer equality rules are traded for potentially identical-content history and refreshed attribution.

## Alternatives and supersession

- **VAL-06:** No additional alternative is selected by this record.

## Consequences

Same-value supported writes may refresh attribution and append identical content. Explicit immutable/version/lifecycle exceptions remain authoritative; no unsupported edit method is added.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **VAL-06:** `S50` — `rework/unchanged-update-semantics.md`, lines 17–25; `S04` — `rework/aggregate-ownership.md`, lines 78–100; `S39` — `rework/model-overview.md`, lines 29–33.
