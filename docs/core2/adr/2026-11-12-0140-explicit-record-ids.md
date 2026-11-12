# Preserve a single generated identity through native creation

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Equipped evaluates primary-key onCreate even when an explicit ID is present. Secret encoding and related records must not use a different generated ID from persistence.

## Decision

<a id="schema-02"></a>

### SCHEMA-02 — Explicit generated-ID transport

**Disposition:** accepted. **Implementation:** unimplemented.

Generate each intended record ID once and use that identity for related records and Consumer encoding. Native create validation calls onCreate even with a supplied ID; use a small invocation-local explicit-ID slot/pattern so the same supplied ID survives creation. A missing slot is an authoring failure, not permission to generate a different identity.

**Recorded rationale:** Secret encode context and persisted identity must agree; this scoped transport is unrelated to rejected callback-reentry tracking.

## Alternatives and supersession

- **SCHEMA-02:** No additional alternative is selected by this record.

## Consequences

A small invocation-local explicit-ID transport supplies native creation. It is not the rejected callback-reentry tracker or a second ID generator.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **SCHEMA-02:** `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 876–891; `S34` — `rework/foundation-full-audit.md`, lines 245.
