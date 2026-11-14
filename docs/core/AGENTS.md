# Core Documentation DOX

## Purpose

The `docs/core/` tree documents domain language and architectural decisions for the current Core implementation at `libs/core` (`@gorchestra/core`).

## Ownership

- `CONTEXT.md` owns domain terms and relationships in glossary form.
- `adr/` owns individual architectural decisions. Do not add an ADR README, decision inventory or standalone contract specification.
- The [package README](../../libs/core/README.md) and [source instructions](../../libs/core/AGENTS.md) own implemented usage, schemas, API details and verification guidance.

## Local Contracts

- Read [context](CONTEXT.md) and affected [ADRs](adr/) before changing language or decisions.
- Use unnumbered Core/domain names in prose and code. The package is `@gorchestra/core`; its documentation lives in this directory.
- Describe current boundaries and accepted designs without retired implementation comparisons or coexistence/cutover instructions. Consumer remains an architectural role; no Consumer application is implemented.
- Offer an ADR only if **all three** hold: it is hard to reverse, surprising without context, and the result of a real tradeoff with genuine alternatives. If any is missing, skip it. Acceptance, importance, task delivery, deferral or a future review checkpoint alone is insufficient.
- Prefer a short title and 1–3 sentences for context, decision and why. Add status, options or consequences only when useful. Keep the `YYYY-MM-DD-HHMM-slug.md` filename convention.
- Keep decisions self-contained with their context, chosen approach, tradeoff and limits. Include substantive evidence or cite maintained source material; never use temporary planning notes as citations. Preserve actual replacement links without reproducing intermediate planning exchanges or inventing alternatives.
- Keep acceptance separate from implementation status. Accepted designs do not authorize paused Expedition/downstream work or a new Consumer application.

## Work Guidance

- Keep `CONTEXT.md` a glossary, not a schema/API specification, task checklist or verification report.
- Document working package usage alongside source changes. Do not move unimplemented method tables or implementation plans into the glossary or a renamed catalog.
- Prefer source/context links over duplicating detailed contracts across documents.
- Keep the Equipped choice and dependency-owned storage responsibilities in the [storage foundation ADR](adr/2026-11-14-1432-equipped-storage.md); package usage documents Core-owned behavior and Consumer obligations rather than repeating dependency guarantees.

## Verification

- Check relative links and owned Markdown formatting. Verify relevant source behavior when documenting implemented usage.
- Document the direct root `pnpm` workflow accurately: checks run on the runner, not in a container or offline sandbox.
- Do not force-add or rewrite ignored notes or unrelated files.

## Child DOX Index

- `adr/` — Core architectural decisions. No child AGENTS.md currently required.
