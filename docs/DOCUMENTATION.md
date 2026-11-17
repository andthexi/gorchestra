# Documentation guide

## Document roles

- `AGENTS.md` files are concise navigation maps, not stores of project behavior, implementation contracts or plans. Link to the owning documents and tell readers when to read them.
- `CONTEXT.md` owns domain language and relationships.
- Package READMEs own implemented usage and status; engineering guides own implementation and verification conventions.
- Each context's `FUTURE.md` owns deferred work and future plans, including accepted but unimplemented work. Distinguish planned work, deferred decisions and post-MVP improvements. Record scope, rationale/current limitation, revisit trigger and durable references; do not invent deadlines or imply implementation approval.
- ADRs retain architectural decisions and rationale. Replace duplicated backlog detail with links to `FUTURE.md`; accepted architecture need not be deleted because implementation is later.
- When work ships, remove or update its FUTURE entry and move implemented behavior into its owning documentation. Do not preserve completed-work diaries there.

## Local Contracts

- Context files define current domain language and relationships, not implementation specifications, task status or verification logs. Follow the existing `CONTEXT.md` language/relationships structure.
- Package READMEs document implemented usage; source owns exact schemas, signatures and runtime contracts. Keep future plans and deferred work in the owning context's `FUTURE.md`; detailed delivery acceptance criteria belong in approved Changes, not a duplicate contract catalog. ADR directories contain individual decisions, not a second README/index.
- Offer ADRs sparingly, only when **all three** are true: the decision is hard to reverse, surprising without context, and the result of a real tradeoff with genuine alternatives. If any is missing, skip the ADR. This rule applies to `docs/core/` too; acceptance or deferral alone is insufficient. Keep plain model/API facts, task sequencing, backlog exclusions, research and future review checkpoints out of ADRs.
- Prefer a short title and 1–3 sentences covering context, decision and why. Add status, considered options or consequences only when they genuinely add value; do not require boilerplate sections or exhaustive source/decision bookkeeping.
- Keep decision disposition separate from implementation status. `docs/core/` documents the current `libs/core` design. Package documentation owns current implementation status; documentation for removed implementations is not retained here. Use Consumer for the application boundary, not as a reference to an existing application or a migration from one.
- ADR filenames use sortable date+time prefixes: `YYYY-MM-DD-HHMM-slug.md`.
- Update relevant context docs or ADRs when a change alters durable domain language, decisions, responsibilities, or relationships.
- Prefer linking to canonical source or context over duplicating detailed rules in multiple docs.
- Documents must retain the context, decisions and evidence needed to stand on their own. Do not cite temporary planning folders, local archives or brainstorming notes; use substantive explanations and durable source citations instead.

## Work Guidance

- Read the nearest context file before changing domain documentation.
- Read relevant ADRs before changing or superseding a documented decision.
- If source changes and docs changes are part of the same semantic change, keep them synchronized in the same branch.
- Keep usage/context documentation concise, operational, and current. When a qualifying decision is superseded, link its replacement and retain only the history needed to understand the tradeoff; do not preserve planning conversations as ADRs.

## Verification

- From repo root, run `pnpm format` after Markdown/documentation changes.
- If documentation changes accompany source changes, also run the relevant source verification from that subtree.
