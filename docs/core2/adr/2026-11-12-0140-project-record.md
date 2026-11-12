# Keep Project a lean immutable undertaking

## Status

Decision disposition: accepted, deferred, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Projects own durable Assets but must not duplicate their configuration or inherit host runtime settings.

## Decision

<a id="project-01"></a>

### PROJECT-01 — Project shape

**Disposition:** accepted. **Implementation:** unimplemented.

Persist/return `id`, `title`, `spec: { type: "source-control" }`, `created`. Require nested spec and discriminator explicitly, no default/root-type alias/empty config. Future variant-specific keys belong inside their spec branch, but no hypothetical variants are added. No description, tags, runtime config, source envelope, child lists/counts or copied Asset configuration.

**Recorded rationale:** Nested discriminated configuration keeps variants coherent while current Project stays minimal.

<a id="project-h01"></a>

### PROJECT-H01 — Historical root discriminator

**Disposition:** superseded. **Implementation:** unimplemented.

Earlier selected Project stored a root `type: "source-control"`. The checkpoint amendment moves it into required spec.type, without retaining both or supporting old input.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** Project was moved to a required nested discriminated spec matching Asset, keeping future variant-specific fields within the branch and no duplicate root type.

<a id="project-02"></a>

### PROJECT-02 — Title rename deferral

**Disposition:** deferred. **Implementation:** unimplemented.

Defer Project rename/updateTitle and any generic substitute; remove updated entirely, with no null/derived alias or alternate stamp. Current fields remain fixed, created never follows child activity. Creation still trims title, permits duplicate labels and creates no implicit Assets/Secrets.

**Recorded rationale:** Without a supported edit, a redundant latest-update field has no current purpose.

<a id="project-h02"></a>

### PROJECT-H02 — Historical title mutation

**Disposition:** superseded. **Implementation:** unimplemented.

Project title-only rename previously atomically changed title/updated, even for the same canonical title, with last-successful-commit-wins and no expected-old-title/version guard. Created/identity/type/relationships were fixed and stamps initialized together. This capability and updated are parked by deferral.

**Original rationale:** Title-only edits preserved identity and child relationships. Atomic last-successful-commit-wins deliberately accepted stale-screen overwrites without an extra Project version or expected-title guard; same-value writes followed apply-and-record.

**Reason superseded:** The user deferred title renaming and removed Project.updated. The source records that scope choice without a more specific reason for the cut.

## Alternatives and supersession

- **PROJECT-01:** Supersedes [PROJECT-H01](2026-11-12-0140-project-record.md#project-h01).
- **PROJECT-H01:** Superseded by [PROJECT-01](2026-11-12-0140-project-record.md#project-01).
- **PROJECT-02:** Supersedes [PROJECT-H02](2026-11-12-0140-project-record.md#project-h02). The decision is to defer/exclude this capability, not approval of an unresolved implementation.
- **PROJECT-H02:** Superseded by [PROJECT-02](2026-11-12-0140-project-record.md#project-02).

## Consequences

Creation may precede Asset setup; Expedition admission separately requires a complete repository Asset.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **PROJECT-01:** `S35` — `rework/foundation-model-contract.md`, lines 334–349; `S43` — `rework/project-source.md`, lines 19–46.
- **PROJECT-H01:** `S02` — `rework/README.md`, lines 9,91; `S35` — `rework/foundation-model-contract.md`, lines 336–338; `S49` — `rework/source-model-exploration.md`, lines 105.
- **PROJECT-02:** `S43` — `rework/project-source.md`, lines 15–17,40–46; `S46` — `rework/sdk-handler-tree.md`, lines 78–86.
- **PROJECT-H02:** `S43` — `rework/project-source.md`, lines 48–54; `S42` — `rework/pre-delivery-mvp.md`, lines 71; `S36` — `rework/foundation-plan-audit.md`, lines 43–45; `S46` — `rework/sdk-handler-tree.md`, lines 80–82.
