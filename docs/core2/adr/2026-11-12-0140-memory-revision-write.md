# Append complete revisions with an atomic expected-version predicate

## Status

Decision disposition: accepted, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

A transactional read/check followed by primary-key-only update does not ensure a single winner.

## Decision

<a id="mem-04"></a>

### MEM-04 — Version sequence and exhaustion

**Disposition:** accepted. **Implementation:** unimplemented.

Use positive safe-integer JavaScript/JSON versions, starting at 1 and incrementing exactly once per successful append. No coercion/string/bigint/fractional/unsafe values; failed writes consume no committed version. Matching maximum version refuses as type-only revision-version-exhausted before writes, never wrap/reset/round.

**Recorded rationale:** Safe numeric order is explicit and separate from clocks/IDs.

<a id="mem-05"></a>

### MEM-05 — Atomic conditional append

**Disposition:** accepted. **Implementation:** unimplemented.

Create Memory and revision 1 atomically without expectedVersion. For later complete title/body snapshot, validate Memory then expectedVersion against revision.version. Use native `.all().where(id AND revision contains expectedVersion).update({ revision: nextSummary })`; validate returned rows, require one match before inserting the corresponding full revision in the same wrapper transaction. Zero matches conflict; unexpected multiplicity is invalid-storage-output. Preserve parent/created/history; same content still appends.

**Recorded rationale:** The full expected-version predicate must reach the write; `.one().where().update()` discarded it in inspected evidence.

<a id="mem-06"></a>

### MEM-06 — Conflict and committed result

**Disposition:** accepted. **Implementation:** unimplemented.

Return `{ type: "revision-conflict", memoryId, expectedVersion }` with no actualVersion or follow-up read solely for it. No revision/summary/stamp commits on conflict. Successful create/append returns `{ memory, revision }` from the same committed invocation, not a later refreshed Memory paired with an older written revision.

**Recorded rationale:** The conditional write does not supply a conflicting row; consumers can explicitly reread instead of receiving an invented observation.

<a id="mem-h02"></a>

### MEM-H02 — Historical actualVersion payload

**Disposition:** superseded. **Implementation:** unimplemented.

Earlier selected revision-conflict included actualVersion from the failed check. The conditional-write amendment removes it rather than performing a follow-up read or inventing a version.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** The selected conditional write returns no conflicting row. A follow-up observation would not be the failed atomic comparison's version, so actualVersion was removed without a reread.

## Alternatives and supersession

- **MEM-04:** No additional alternative is selected by this record.
- **MEM-05:** No additional alternative is selected by this record.
- **MEM-06:** Supersedes [MEM-H02](2026-11-12-0140-memory-revision-write.md#mem-h02).
- **MEM-H02:** Superseded by [MEM-06](2026-11-12-0140-memory-revision-write.md#mem-06).

## Consequences

Version controls history and optimistic concurrency; IDs identify exact citations. Output shape validation alone does not establish pair consistency.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **MEM-04:** `S35` — `rework/foundation-model-contract.md`, lines 320–332; `S48` — `rework/secret-memory-original-review.md`, lines 115; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 1230.
- **MEM-05:** `S35` — `rework/foundation-model-contract.md`, lines 466–472; `S46` — `rework/sdk-handler-tree.md`, lines 108,114–120; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 1229–1244; `E01` — `linked scratch evidence: conditional-memory-probe.mjs`, lines 1–47.
- **MEM-06:** `S35` — `rework/foundation-model-contract.md`, lines 397–407,470–472; `S46` — `rework/sdk-handler-tree.md`, lines 118; `S48` — `rework/secret-memory-original-review.md`, lines 161–165.
- **MEM-H02:** `S48` — `rework/secret-memory-original-review.md`, lines 117; `S36` — `rework/foundation-plan-audit.md`, lines 85; `S35` — `rework/foundation-model-contract.md`, lines 470.
