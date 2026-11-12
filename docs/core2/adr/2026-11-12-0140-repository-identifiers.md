# Validate exact local GitHub repository identifiers

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Repository owner/name are identifiers, not titles or URLs. Credentials do not change target identity.

## Decision

<a id="repo-01"></a>

### REPO-01 — Provider and identifier contract

**Disposition:** accepted. **Implementation:** unimplemented.

Support source-control Projects, repository Assets, provider github, host github.com only. Require separate exact owner/name, each matching `[A-Za-z0-9._-]+` except exact `.` and `..`. Reject whitespace, controls, URLs, combined locators, separators, non-ASCII and encoded repairs. Preserve casing; no full GitHub naming policy, field-specific length maximum, truncation or stored lowercase shadows.

**Recorded rationale:** A bounded local contract avoids URL parsing/provider policy duplication.

## Alternatives and supersession

- **REPO-01:** No additional alternative is selected by this record.

## Consequences

Structural admission does not prove provider naming validity, existence, access or stable remote object identity.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **REPO-01:** `S43` — `rework/project-source.md`, lines 98,114–138,420–456; `S35` — `rework/foundation-model-contract.md`, lines 506–509.
