# Preserve bodies, raw values and protected references exactly

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

A title normalizer would corrupt exact body text or Consumer-owned protected representations.

## Decision

<a id="val-03"></a>

### VAL-03 — Exact bodies and protected strings

**Disposition:** accepted. **Implementation:** unimplemented.

Memory body accepts any exact string, including empty/whitespace-only. Raw Secret value and stored valueRef require exact nonempty strings but allow whitespace-only. Do not trim, normalize, convert newlines, coerce, or impose provider credential formats.

**Recorded rationale:** Body content and Consumer-owned protected representations are not model titles.

## Alternatives and supersession

- **VAL-03:** No additional alternative is selected by this record.

## Consequences

Use separate shared category validators; empty body and empty decoded credential are distinct from forbidden empty raw Secret input/reference.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **VAL-03:** `S35` — `rework/foundation-model-contract.md`, lines 332,490,498,510; `S34` — `rework/foundation-full-audit.md`, lines 234–243; `S48` — `rework/secret-memory-original-review.md`, lines 143–147.
