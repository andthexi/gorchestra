# Documentation DOX

## Purpose

The `docs/` tree contains canonical domain context, ADRs, coverage notes, and durable documentation for Gorchestra.

## Ownership

- `docs/AGENTS.md` owns documentation-wide contracts and the documentation Child DOX Index.
- Child docs own local domain documentation contracts.
- Documentation should explain durable language and decisions, not duplicate package implementation details.

## Local Contracts

- Context files define current domain language for their scope.
- ADRs normally record durable, surprising, or trade-off-heavy decisions. For the Core redesign in `docs/core2/`, the user explicitly requires every distinct rework decision, including small field/API choices, paused scope, deferrals, rejected alternatives and superseded history; do not apply the normal materiality filter there.
- Keep decision disposition separate from implementation status. `docs/core/` owns the existing `libs/core`; `docs/core2/` owns the parallel `libs/core2`. The parallel package currently has configuration only, not runtime implementation; keep usage documentation synchronized with each implemented slice.
- ADR filenames use sortable date+time prefixes: `YYYY-MM-DD-HHMM-slug.md`.
- Update relevant context docs or ADRs when a change alters durable domain language, decisions, responsibilities, or relationships.
- Prefer linking to canonical source or context over duplicating detailed rules in multiple docs.

## Work Guidance

- Read the nearest context file before changing domain documentation.
- Read relevant ADRs before changing or superseding a documented decision.
- If source changes and docs changes are part of the same semantic change, keep them synchronized in the same branch.
- Keep usage/context documentation concise, operational, and current. Preserve superseded ADR decisions with explicit replacement links; do not delete the redesign's required decision history as stale usage guidance.

## Verification

- From repo root, run `pnpm format` after Markdown/documentation changes.
- If documentation changes accompany source changes, also run the relevant source verification from that subtree.

## Child DOX Index

- `docs/core/AGENTS.md` — Core domain context and ADR documentation contracts for the existing `libs/core`.
- `docs/core2/AGENTS.md` — parallel Core foundation documentation for `libs/core2`; exhaustive ADR coverage and separate configuration/runtime/paused status. Start at [context](core2/CONTEXT.md), the [ADR index](core2/adr/README.md), and the [testing guide](core2/testing.md).
- `docs/consumers/AGENTS.md` — Consumer context and ADR documentation contracts.
