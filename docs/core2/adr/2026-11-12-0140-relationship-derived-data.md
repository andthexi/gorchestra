# Derive relationship-owned facts instead of storing duplicate authority

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation and paused domain design.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Copied relationship-derived fields can become contradictory authority in records, proposals and public inputs. The selected rule is to derive them, with two explicit Memory read-convenience exceptions.

## Decision

<a id="own-04"></a>

### OWN-04 — No duplicated relationship facts

**Disposition:** accepted. **Implementation:** unimplemented.

Do not duplicate fields or public/proposal inputs derivable from authoritative relationships, even if copies could be checked equal. Derive ownership, child lists, Secret usages, Slice Asset target and revision citation ownership. Read views may assemble them. Only compact Memory.revision id/version/title and immutable Memory.created are explicitly approved read-convenience exceptions; body/current-revision-created and extra counters remain excluded.

**Recorded rationale:** One authoritative relationship avoids contradictory facts; genuinely distinct historical evidence is not an excuse to copy recoverable data.

## Alternatives and supersession

- **OWN-04:** No additional mechanism is selected.

## Consequences

Resolve ownership, children, usages and work targets through their authoritative relationships rather than synchronized stored copies or duplicate input equality checks. Maintain only the approved compact Memory.revision summary on each revision write and immutable Memory.created from creation; body and current-revision attribution stay on MemoryRevision. No other snapshot exception is inferred.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **OWN-04:** `S04` — `rework/aggregate-ownership.md`, lines 102–110; `S42` — `rework/pre-delivery-mvp.md`, lines 43; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 57–61.
