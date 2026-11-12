# Record every rework decision with explicit provenance and status

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **partial**. D1 documentation was reviewed and delivered in [PR #38](https://github.com/andthexi/gorchestra/pull/38). Task 0 adds package status/testing guidance and approved instruction routing; runtime usage synchronization remains ongoing. Scope: delivery process.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Ignored notes cannot remain the only record, and the user explicitly requested every distinct decision rather than only major architectural trade-offs.

## Decision

<a id="doc-01"></a>

### DOC-01 — Exhaustive promotion

**Disposition:** accepted. **Implementation:** D1 promotion reviewed and delivered in PR #38; later task synchronization remains ongoing.

Record every distinct rework decision in a focused ADR or inseparable keyed section, including paused scope and small API/field choices. Deduplicate repeated occurrences; preserve explicit supersession and non-decisions. Inventory every artifact and keep self-contained rationale, source labels, disposition, and implementation status. Use actual ADR creation timestamps; original decision dates are unknown unless evidenced.

**Recorded rationale:** Exhaustive traceability is the requested deliverable, not a foundation-only architectural summary.

<a id="doc-02"></a>

### DOC-02 — Synchronized routing

**Disposition:** accepted. **Implementation:** partial; Task 0 updates README/context/testing links and approved root/library/documentation/package instructions; runtime usage remains unimplemented.

Route new Core documentation through docs/core2 and preserve docs/core for the existing library. Update context/usage/testing alongside each real implementation slice; do not advertise planned APIs as working or link nonexistent package usage. Update scope status both in the owning ADR and coverage register.

**Recorded rationale:** Decision acceptance and shipped behavior must remain distinguishable.

## Alternatives and supersession

- **DOC-01:** No additional alternative is selected by this record.
- **DOC-02:** No additional alternative is selected by this record.

## Consequences

Usage/context docs track implemented behavior; ADRs retain accepted, deferred, rejected and superseded decisions. Duplicate source occurrences share one identity and all destinations are checked.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **DOC-01:** `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 320–419,700–752.
- **DOC-02:** `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 326–365; `S20` — `rework/deferred-functionality.md`, lines 152–156.
