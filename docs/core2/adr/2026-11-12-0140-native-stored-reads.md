# Use native Repo with explicit validated reads

## Status

Decision disposition: accepted, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Equipped schemas do not automatically revalidate ordinary persisted fields before handlers use them. Restricting top-level methods alone does not revoke builders or raw SQL.

## Decision

<a id="read-01"></a>

### READ-01 — Validate stored facts before use

**Disposition:** accepted. **Implementation:** unimplemented.

Handlers use native Equipped Repo as context.storage plus shared explicit schema-derived read/error helpers. Validate full or appropriate projected rows before ownership/version/reference decisions, writes or external effects; fail a whole list on a malformed member as invalid-storage-output. Distinguish missing records, actual I/O failure and invalid final output. Never repair/write back parsed data or silently skip it.

**Recorded rationale:** Final output validation is too late for authoritative decisions and external callbacks.

<a id="read-h01"></a>

### READ-H01 — Historical guarded storage view

**Disposition:** superseded. **Implementation:** unimplemented.

Earlier automatic validation/restricted context.storage facade and builder-lifetime guard were superseded and rejected in favor of native Repo plus explicit helpers.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** The user selected native Repo plus explicit shared validation/error helpers rather than a recursive guarded facade. Internal authoring restrictions remain without claims of runtime revocation.

<a id="read-02"></a>

### READ-02 — Authoring discipline not runtime sandbox

**Disposition:** accepted. **Implementation:** unimplemented.

Internal handlers must not use raw SQL, independent session/commit/rollback, storage reconfiguration, escaped builders/context or unawaited work; never recursively enter public Portfolio wrappers. Enforce by review, feasible linting and tests, not claims that native methods are absent or builders revoked.

**Recorded rationale:** The shared wrapper governs correctly authored handlers without a second ORM/runtime capability system.

## Alternatives and supersession

- **READ-01:** Supersedes [READ-H01](2026-11-12-0140-native-stored-reads.md#read-h01).
- **READ-H01:** Superseded by [READ-01](2026-11-12-0140-native-stored-reads.md#read-01).
- **READ-02:** No additional alternative is selected by this record.

## Consequences

Internal authors must obey transaction discipline; no runtime Repo/builder facade or escaped-work drainage guarantee is claimed.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **READ-01:** `S35` — `rework/foundation-model-contract.md`, lines 101–103; `S46` — `rework/sdk-handler-tree.md`, lines 228–238; `S34` — `rework/foundation-full-audit.md`, lines 31–45.
- **READ-H01:** `S34` — `rework/foundation-full-audit.md`, lines 33,45; `S35` — `rework/foundation-model-contract.md`, lines 101–103.
- **READ-02:** `S46` — `rework/sdk-handler-tree.md`, lines 226,236–238.
