# Core documentation DOX

## Ownership and scope

- This subtree owns the redesign's domain context and full decision history for `libs/core2` (`@gorchestra/core2`). Package/configuration wiring exists; runtime implementation and behavior tests remain unimplemented at Task 0. Do not present accepted designs or configuration checks as executable API guarantees.
- Existing `libs/core` and [its documentation](../core/CONTEXT.md) remain unchanged; the Server Consumer still uses that implementation. See the parallel [package status](../../libs/core2/README.md), [package instructions](../../libs/core2/AGENTS.md), and [testing guide](testing.md).
- Use unnumbered Core/domain names in prose and code. The suffix is only a path/package disambiguator.

## Local contracts

- Read [context](CONTEXT.md), the [ADR index](adr/README.md), and [coverage register](adr/decision-coverage.md) before changing a decision.
- Record every distinct rework decision, including small field/API choices, paused functionality, explicit deferrals, rejected alternatives, and superseded history. The usual architectural-materiality filter does not apply here.
- Keep decision disposition separate from implementation status. Accepted design is not implemented behavior or authorization to resume paused Expedition/runtime work.
- Keep one stable coverage identity per choice; duplicate occurrences share it. Every decision must have a focused ADR section, provenance, rationale, and explicit reciprocal supersession links where applicable.
- Source paths are provenance labels, not required imports or links to ignored notes. ADRs must be self-contained. Unselected proposals, audit recommendations, fictional examples, and probe output are not accepted contracts.
- Usage/context/testing documentation must follow actual implementation in each slice. Preserve D1 provenance as a historical review snapshot; record later implementation status separately. Paused Expedition, Blueprint, Delivery and runtime decisions remain documentation-only until separately authorized.

## Verification

- Check coverage source inventory, decision destinations, statuses, duplicates, and reciprocal supersession; check relative links and Markdown formatting on owned paths.
- Preserve existing Core/Consumer source and `docs/core/**`. Do not force-add ignored source notes or rewrite unrelated files.
