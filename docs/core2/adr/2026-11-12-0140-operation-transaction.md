# Validate and commit each complete handler in one transaction

## Status

Decision disposition: accepted, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Returning ok:false from an Equipped session callback does not abort it; post-commit validation cannot undo already committed writes.

## Decision

<a id="tx-01"></a>

### TX-01 — Uniform execution boundary

**Disposition:** accepted. **Implementation:** unimplemented.

Parse public input before transaction/callback; admit through shared owner; open one repo.session, prepare context/stamp, await complete handler including callbacks, and validate complete Result inside the transaction. Parsed success commits and returns only after commit; valid failure or invalid Result aborts. No direct/phased opt-out, independent/nested commits or post-commit result construction.

**Recorded rationale:** One uniform boundary keeps every operation-owned application write subject to final validation.

<a id="tx-h01"></a>

### TX-H01 — Historical credential read transaction release

**Disposition:** superseded. **Implementation:** unimplemented.

Earlier credential acquisition closed its database read transaction before resolution/provider I/O. The captured pair rule survives, but early release is superseded by the whole-handler transaction.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** The simpler uniform whole-handler transaction was selected, including callback/provider awaits. Captured credentials remain stable, but locks may delay competing writes.

<a id="tx-02"></a>

### TX-02 — Invocation-specific abort transport

**Disposition:** accepted. **Implementation:** unimplemented.

Retain the already validated safe failure locally. Throw a private invocation-specific signal; recognize only exact identity directly or an EquippedError for session whose cause is that same object. No message matching, unbounded cause traversal, arbitrary similar cause, public signal serialization or retry. Preserve observable cleanup failure precedence.

**Recorded rationale:** Supported wrapping must not relabel a domain failure as storage failure or mask actual cleanup failure.

## Alternatives and supersession

- **TX-01:** Supersedes [TX-H01](2026-11-12-0140-operation-transaction.md#tx-h01).
- **TX-H01:** Superseded by [TX-01](2026-11-12-0140-operation-transaction.md#tx-01).
- **TX-02:** No additional alternative is selected by this record.

## Consequences

External awaits extend lock/connection time and database rollback cannot reverse external effects. Shorter phased execution remains unselected post-MVP research.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **TX-01:** `S46` — `rework/sdk-handler-tree.md`, lines 265–280; `S35` — `rework/foundation-model-contract.md`, lines 83; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 522–552.
- **TX-H01:** `S46` — `rework/sdk-handler-tree.md`, lines 282; `S43` — `rework/project-source.md`, lines 508–512; `S49` — `rework/source-model-exploration.md`, lines 129.
- **TX-02:** `S46` — `rework/sdk-handler-tree.md`, lines 284–286; `S35` — `rework/foundation-model-contract.md`, lines 107–109; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 538–550.
