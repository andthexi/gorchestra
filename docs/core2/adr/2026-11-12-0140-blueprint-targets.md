# Reference existing Assets once per Delivery

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Work proposals need authoritative configured targets without mixing Asset setup into human work acceptance.

## Decision

<a id="bp-05"></a>

### BP-05 — Existing Asset targets

**Disposition:** accepted. **Implementation:** unimplemented.

Each Delivery references exactly one existing repository Asset in its Expedition’s Project; no new Asset/Secret creation/update/inline config or deferred target setup during proposal storage/acceptance. Slices derive target through Delivery with no selector/copy/override. Multiple Deliveries may target same Asset, some Assets none; shared target neither merges identities nor adds implicit dependencies.

**Recorded rationale:** Authoritative relationships keep configuration separate from accepted work.

## Alternatives and supersession

- **BP-05:** No additional alternative is selected by this record.

## Consequences

Each Delivery holds one existing same-Project Asset reference; Slices derive it. Reuse by several Deliveries creates no implicit order or ownership.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **BP-05:** `S18` — `rework/blueprint-lifecycle.md`, lines 98–122; `S44` — `rework/proposal-structure.md`, lines 25–29; `S43` — `rework/project-source.md`, lines 538,542,548.
