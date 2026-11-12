# Keep MVP choices explicit and conceptual approval separate from implementation

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation and paused domain design.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

The user selected a simplest-viable-MVP policy and accepted conceptual responsibilities without approving every unresolved field or implementation proposal.

## Decision

<a id="scope-06"></a>

### SCOPE-06 — Conceptual decisions versus build details

**Disposition:** accepted. **Implementation:** unimplemented.

Preserve the accepted conceptual model and selected detailed choices; unselected fields/API/error/concurrency contracts remain unresolved for separately scoped feature work. Historical Secret→Memory/MemoryRevision→Project→Asset→consolidation review order was a selected design process, not current feature delivery order. Do not reopen settled relationships merely because schemas require implementation.

**Recorded rationale:** The user stopped a field-by-field conceptual interview without revoking prior decisions or selecting unanswered proposals.

<a id="scope-07"></a>

### SCOPE-07 — MVP-first decision policy

**Disposition:** accepted. **Implementation:** unimplemented.

Default to the simplest viable option that gets to a working MVP quickly. Do not add robustness or optimization machinery merely to eliminate a documented, accepted MVP compromise, or repeatedly reopen explicit user choices for a more elaborate design. For each accepted compromise, record the chosen behavior, why it accelerates the MVP, limitations or failure cases, and conditions that would justify revisiting it. Keep deferred improvements separate from MVP requirements; a visible shortcut is not silently a permanent contract.

**Recorded rationale:** The confirmed policy prioritizes reaching the working MVP while making the cost and revisit conditions of each accepted compromise visible.

## Alternatives and supersession

- **SCOPE-06:** No additional alternative is selected by this record.
- **SCOPE-07:** No additional alternative is selected by this record.

## Consequences

Accepted compromises must remain visible with limitations and revisit conditions; deferred robustness or optimization is not an MVP requirement. A conceptual checkpoint neither revokes selected details nor accepts unanswered proposals. The historical review order is not the new stacked delivery sequence.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **SCOPE-06:** `S42` — `rework/pre-delivery-mvp.md`, lines 45–49,202–206,225–227; `S36` — `rework/foundation-plan-audit.md`, lines 293–297; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 19–33.
- **SCOPE-07:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 35–39.
