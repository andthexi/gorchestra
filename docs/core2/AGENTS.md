# Core Documentation DOX

## Purpose

The `docs/core2/` tree documents domain language and architectural decisions for the parallel Core design at `libs/core2` (`@gorchestra/core2`). Existing `libs/core` and [its documentation](../core/CONTEXT.md) remain authoritative for the Server Consumer.

## Ownership

- `CONTEXT.md` owns domain terms and relationships, following the existing Core and Consumer documentation structure.
- `adr/` owns individual architectural decisions. Do not add an ADR README, decision inventory or standalone contract specification.
- Package README/source own implemented usage, schemas and API details. The implementation plan owns pending task requirements; focused testing documentation owns verification procedures.

## Local Contracts

- Read [context](CONTEXT.md) and affected [ADRs](adr/) before changing language or decisions.
- Use unnumbered Core/domain names in prose and code. The numeric suffix is only a path/package disambiguator.
- Offer an ADR only if **all three** hold: it is hard to reverse, surprising without context, and the result of a real tradeoff with genuine alternatives. If any is missing, skip it. Acceptance, importance, task delivery, deferral or a future review checkpoint alone is insufficient.
- Prefer a short title and 1–3 sentences for context, decision and why. Add status, options or consequences only when useful. Keep the `YYYY-MM-DD-HHMM-slug.md` filename convention.
- Keep decisions self-contained; source-note labels may support rationale but are not dependencies readers need to understand it. Preserve actual replacement links without reproducing intermediate planning exchanges or inventing alternatives.
- Keep acceptance separate from implementation status. Accepted designs do not authorize paused Expedition/downstream work, a Consumer cutover or changes to existing Core behavior.

## Work Guidance

- Keep `CONTEXT.md` a glossary, not a schema/API specification, task checklist or verification report.
- Document working package usage alongside source changes. Do not move unimplemented method tables or implementation plans into the glossary or a renamed catalog.
- Prefer source/context links over duplicating detailed contracts across documents.

## Verification

- Check relative links and owned Markdown formatting. Verify relevant source behavior when documenting implemented usage.
- Preserve existing Core/Consumer source and `docs/core/**`; do not force-add or rewrite ignored notes or unrelated files.

## Child DOX Index

- `adr/` — Core architectural decisions. No child AGENTS.md currently required.
