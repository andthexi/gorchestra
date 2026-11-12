# Build the foundation beside the existing Core

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: delivery process.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

The redesigned API and data model intentionally break compatibility. Existing Consumers must continue to work without a cutover hidden inside the foundation task.

## Decision

<a id="pkg-01"></a>

### PKG-01 — Parallel package

**Disposition:** accepted. **Implementation:** unimplemented.

Place the new private ESM library at `libs/core2`, named `@gorchestra/core2`, with source entry `./src/index.ts`; retain existing Core and all Consumer imports. No compatibility shim, implicit legacy conversion, or retirement of the old library.

**Recorded rationale:** A parallel package isolates the clean-break implementation while Consumers still use the original.

<a id="pkg-02"></a>

### PKG-02 — Unnumbered identifiers

**Disposition:** accepted. **Implementation:** unimplemented.

Use Core, CoreDependencies, PortfolioClient and ordinary domain names in code and prose. `core2` is only a path/package disambiguator, not a type, variable, error-message, or example-value suffix.

**Recorded rationale:** Both libraries implement the same domain; the number prevents package/path collision only.

<a id="pkg-03"></a>

### PKG-03 — Independent source

**Disposition:** accepted. **Implementation:** unimplemented.

Do not import implementation from existing Core or ignored rework. Reimplement only small generic patterns when needed; keep exports minimal and constructors non-public.

**Recorded rationale:** Old lifecycles/model shapes must not leak into the new package.

## Alternatives and supersession

- **PKG-01:** No additional alternative is selected by this record.
- **PKG-02:** No additional alternative is selected by this record.
- **PKG-03:** No additional alternative is selected by this record.

## Consequences

Task 0 creates the private package; D1 creates documentation only. Existing stores, source, exports, migrations, and docs/core remain unchanged.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **PKG-01:** `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 5–13,28–60,754–802; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 92–98.
- **PKG-02:** `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 234–235,320–322.
- **PKG-03:** `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 312–318.
