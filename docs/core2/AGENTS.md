# Core documentation DOX

## Ownership and scope

- This subtree owns the redesign's domain context, contract reference and architectural decisions for `libs/core2` (`@gorchestra/core2`). The package is **unimplemented and not scaffolded** in this documentation-only snapshot.
- Existing `libs/core` and [its documentation](../core/CONTEXT.md) remain authoritative for the Server Consumer. Add live package instructions and usage/testing guides only alongside actual implementation.
- Use unnumbered Core/domain names in prose and code. The suffix is only a path/package disambiguator.

## Local contracts

- Read [context](CONTEXT.md), the [contract reference](contracts.md), the [ADR index](adr/README.md) and the affected records before changing a decision.
- Offer an ADR only if **all three** hold: it is hard to reverse, surprising without context, and the result of a real tradeoff with genuine alternatives. If any is missing, skip it. Accepted-but-unimplemented choices can qualify; acceptance, importance or deferral alone cannot. Task/PR delivery, backlog-only exclusions, research, easy-to-change conventions and future review checkpoints are not ADRs.
- Prefer a short title and 1–3 sentences for context, decision and why. Add status, considered options or consequences only when useful, not mandatory subsections. Keep the timestamp filename convention.
- Keep plain field shapes and operation signatures in the contract reference rather than creating one ADR per fact. Consolidate tightly related choices without inventing alternatives or reasons. No exhaustive source/section register or decision-count target is required.
- Use accepted or superseded decision status, separate from implementation status. Preserve relevant rejected alternatives in the decision's rationale; link actual replacement ADRs when superseding a decision. Do not reproduce every intermediate planning exchange.
- ADRs must be self-contained. Source-note labels can support provenance, but ignored notes are not runtime dependencies. Unselected proposals, audit recommendations, examples and probe outputs are not accepted contracts.
- Accepted design does not authorize paused Expedition/runtime work or change existing Core behavior. Keep usage claims aligned with actual implementation; do not advertise executable examples before the package exists.

## Verification

- Check that retained ADRs explain real choices and limitations, the index reaches them, and relative links (including replacement links) and owned Markdown formatting are valid.
- Preserve existing Core/Consumer source and `docs/core/**`. Do not force-add or rewrite ignored source notes or unrelated files.
