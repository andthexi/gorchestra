# Keep validation stages distinct and public failures safe

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Input, stored facts, final Results and dependency failures carry different trust and secrecy risks.

## Decision

<a id="err-01"></a>

### ERR-01 — Shared error contract

**Disposition:** accepted. **Implementation:** unimplemented.

Compose exactly invalid-input, invalid-output, invalid-storage-output, internal-error and storage-operation-failed centrally for domain leaves. Specific leaf unions remain narrow. Invalid-input carries ordered `{ path?: string, message: string }[]` projected from Valleyed messages; all other shared variants are type-only. No values, raw errors, SQL, causes, operation metadata, dynamic protected keys or input-echoing text. Preserve absent root paths and parsed values.

**Recorded rationale:** Safe failure stages remain distinguishable without leaking data.

## Alternatives and supersession

- **ERR-01:** No additional alternative is selected by this record.

## Consequences

Consumers receive safe errors, not raw exceptions; error labels alone do not prove rollback or retry safety.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **ERR-01:** `S46` — `rework/sdk-handler-tree.md`, lines 202–222; `S35` — `rework/foundation-model-contract.md`, lines 435–458; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 480–520.
