# Keep a consistent captured credential pair for each invocation

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Operational credential updates can occur while a repository invocation is awaiting resolution or provider I/O.

## Decision

<a id="port-03"></a>

### PORT-03 — Captured credential invocation

**Disposition:** accepted. **Implementation:** unimplemented.

For repository use capture authorized Asset secretId and matching Secret valueRef consistently once per invocation, retaining its transaction through decode/provider I/O/final Result validation. Later changes apply to later acquisitions; no mid-read switch/restart/equality recheck/automatic retry or credential lease. In-flight resolved PAT may finish or fail. Core cannot freeze mutable external value behind the reference.

**Recorded rationale:** Operational updates remain available without rewriting historical evidence or silently changing one invocation’s authority.

## Alternatives and supersession

- **PORT-03:** No additional alternative is selected by this record.

## Consequences

Capture one coherent authorized pair and retain it for that invocation. The whole-handler transaction may delay other writes; no mid-read fallback or freeze of mutable external values is promised.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **PORT-03:** `S43` — `rework/project-source.md`, lines 240–246,508–512; `S41` — `rework/pre-delivery-interactions.md`, lines 156–162; `S46` — `rework/sdk-handler-tree.md`, lines 282.
