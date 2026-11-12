# Documentation DOX

## Purpose

The `docs/` tree contains canonical domain context, contract references, ADRs, and durable documentation for Gorchestra.

## Ownership

- `docs/AGENTS.md` owns documentation-wide contracts and the documentation Child DOX Index.
- Child docs own local domain documentation contracts.
- Documentation should explain durable language and decisions, not duplicate package implementation details.

## Local Contracts

- Context files define current domain language for their scope.
- Offer ADRs sparingly, only when **all three** are true: the decision is hard to reverse, surprising without context, and the result of a real tradeoff with genuine alternatives. If any is missing, skip the ADR. This rule applies to `docs/core2/` too; acceptance or deferral alone is insufficient. Keep plain model/API facts in reference docs and task sequencing, backlog exclusions, research and future review checkpoints out of ADRs.
- Prefer a short title and 1–3 sentences covering context, decision and why. Add status, considered options or consequences only when they genuinely add value; do not require boilerplate sections or exhaustive source/decision bookkeeping.
- Keep decision disposition separate from implementation status. `docs/core/` owns the existing `libs/core`; `docs/core2/` owns the parallel `libs/core2`. The parallel package currently has configuration only, not runtime implementation; keep usage documentation synchronized with each implemented slice.
- ADR filenames use sortable date+time prefixes: `YYYY-MM-DD-HHMM-slug.md`.
- Update relevant context docs or ADRs when a change alters durable domain language, decisions, responsibilities, or relationships.
- Prefer linking to canonical source or context over duplicating detailed rules in multiple docs.

## Work Guidance

- Read the nearest context file before changing domain documentation.
- Read relevant ADRs before changing or superseding a documented decision.
- If source changes and docs changes are part of the same semantic change, keep them synchronized in the same branch.
- Keep usage/context documentation concise, operational, and current. When a qualifying decision is superseded, link its replacement and retain only the history needed to understand the tradeoff; do not preserve planning conversations as ADRs.

## Verification

- From repo root, run `pnpm format` after Markdown/documentation changes.
- If documentation changes accompany source changes, also run the relevant source verification from that subtree.

## Child DOX Index

- `docs/core/AGENTS.md` — Core domain context and ADR documentation contracts for the existing `libs/core`.
- `docs/core2/AGENTS.md` — parallel Core foundation documentation for `libs/core2`; contract reference and selected architectural tradeoffs, with separate configuration/runtime/paused status. Start at [context](core2/CONTEXT.md), [contracts](core2/contracts.md), the [ADR index](core2/adr/README.md), and the [testing guide](core2/testing.md).
- `docs/consumers/AGENTS.md` — Consumer context and ADR documentation contracts.
