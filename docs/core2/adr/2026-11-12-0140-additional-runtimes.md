# Defer additional runtime integrations and discovery machinery

## Status

Decision disposition: deferred. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: outside foundation scope; paused and unimplemented.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Core portability must not require implementing every potential runtime adapter at once.

## Decision

<a id="cut-09"></a>

### CUT-09 — Defer additional runtime integrations and discovery machinery

**Disposition:** deferred. **Implementation:** unimplemented.

Hermes is immediate runtime integration direction. Claude Code, Codex, handwritten/remote adapters and dynamic discovery/registration are potential future work, not current required adapters. Core portability remains without implementing all of them.

**Recorded rationale:** Explicit MVP cuts are not a commitment or schedule to implement the saved options.

## Alternatives and supersession

- **CUT-09:** No additional alternative is selected by this record. The decision is to defer/exclude this capability, not approval of an unresolved implementation.

## Consequences

Hermes is immediate direction; other adapters and dynamic registration remain future possibilities without changing Core domain ownership.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **CUT-09:** `S20` — `rework/deferred-functionality.md`, lines 131; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 76,895–903.
