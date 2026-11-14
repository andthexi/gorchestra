# Gorchestra

## Purpose

Gorchestra is a goal-oriented delivery orchestration platform for coordinating planning, execution, review, and shipping work.

This root AGENTS.md is the project-wide DOX rail: it gives repo-wide instructions, global domain orientation, durable modeling preferences, and the top-level child index.

## Ownership

- Root owns project-wide agent process, global domain relationships, and the Child DOX Index.
- Child AGENTS.md files own local contracts for their subtrees.
- The closer AGENTS.md controls local work details, but child docs must not weaken root-level contracts.
- Do not scan or treat `.trowel/` as project source.
- Never add `fallow-ignore` suppressions; resolve Fallow findings by improving code or adjusting the underlying design instead of hiding them.

## Local Contracts

- AGENTS.md files are binding work contracts for their subtrees.
- Before editing, read this file and every AGENTS.md on the path to each target file.
- Do not rely on memory. Re-read the applicable AGENTS chain in the current session before editing.
- After meaningful changes, update the closest owning AGENTS.md and any affected parent or child indexes.
- Keep AGENTS.md files concise, current, operational, and focused on stable contracts rather than diary entries.

## Work Guidance

### Domain map

- **Core** is reusable Portfolio-level orchestration. Core owns Portfolio data and portable Portfolio Snapshots.
- **Consumers** are application layers that consume Core and provide user experience, authentication, authorization, and deployment-specific runtime concerns.
- **Server Consumer** is the v1 deployed multi-user app with Workspaces, Workspace Members, Workspace Owners, and a registry of Portfolios.
- **CLI Consumer** is a future local app layer that may infer a local user and Portfolio Owner without exposing Workspace concepts.

### Context relationships

- **Consumers → Core**: Consumers create, open, authorize, protect, and operate Portfolios through the Core orchestration model.
- **Server Consumer → Core**: The Server Consumer registers Portfolios inside Workspaces, maps Workspace Owner authority to Portfolio Owner authority for the default Portfolio in v1, and handles server-specific Secret-at-rest protection.
- **CLI Consumer → Core**: A future CLI Consumer can infer one local user and Portfolio Owner without exposing Workspace concepts.
- **Core → Consumers**: Core owns Portfolio data and portable Portfolio Snapshots; consumers provide user experience, authentication, authorization, and deployment-specific runtime concerns.

### Global modeling preferences

- Do not export a variable, function, type, or class from a file until another module or public package surface needs it; keep declarations file-local by default.
- Keep operation flow inline at its owning entry point. A file-local production helper referenced only once by that same module is presumed unnecessary and should be inlined; retain a helper only when it is reused or its interface hides substantial complexity. Apply the same rule to one-use test-registration wrappers, while retaining reusable test fixtures that improve setup readability.
- Core lifecycle data shapes use `field: RuntimeRecord` for runtime lifecycle timestamps, direct domain-named `AuditStamp` fields for consumer-authorized operations, and domain-specific embedded records when a lifecycle moment has additional fields.
- Authoritative Delivery lifecycle gates such as queueing and closure live on direct Delivery lifecycle fields with domain-named `AuditStamp` records; non-lifecycle execution facts remain Actions.
- Embedded records must contain all fields that change atomically with that lifecycle moment, so the model cannot represent half-updated states.
- Prefer discriminated unions over nullable peer fields when exactly one variant applies.
- Make invalid Consumer code combinations unrepresentable in public APIs wherever the language can express the invariant. Model legal lifecycle states, dependency combinations, and operation ordering in types and construction boundaries; do not expose an operation known to be invalid in the handle's state and rely only on documentation or a later runtime error.
- Return only fully established capabilities from factories and transitions; keep prerequisite-sensitive constructors non-public. Use discriminated/state-specific interfaces and mutually exclusive input types rather than caller-managed readiness booleans, redundant setup steps, or optional dependencies that fail only when used. A failed prerequisite must not trigger an implicit corrective action.
- Preserve runtime validation, authoritative scope/version checks, and atomic lifecycle/concurrency guards for untyped or forged inputs, stale aliases, shutdown races, and external state changes. TypeScript types cannot consume existing aliases or prove that external state remains valid across an await; do not claim otherwise. When implementing a protocol contract, cover supported usage and rejected call combinations with focused type tests as well as necessary runtime tests.
- For discriminated-union control flow, use exhaustive `switch` statements with throwing `default` branches for impossible cases; do not use union-key object indexing for behavior, formatting, or other discriminant-dependent dispatch. Inert registry/data maps are allowed when they are not control flow.
- Prefer passing identifiers and inferring authoritative fields inside Core over duplicating inferable values in consumer-facing API inputs, so callers cannot provide contradictory values.
- For Core-owned provider/runtime behavior and Core Service calls that perform external actions, resolved values should be available at the boundary so service/provider code does not infer, load, or calculate authoritative context itself.
- Parse and validate external, serialized, or otherwise unknown data through Valleyed pipes rather than hand-written parsing/type guards; use `v.fromJson(v.object(...))` for expected JSON shapes.

### Parallel Core foundation and shared dependencies

- The Core implementation in `libs/core` remains documented by `docs/core/`; the parallel foundation in `libs/core2` is documented by `docs/core2/`. Both implement the Core domain; the numeric suffix is only a package/path disambiguator. Use unnumbered code identifiers such as `CoreDependencies`. Do not migrate Consumers, import the old implementation into the new library, or change old Core contracts as part of this work.
- Keep Equipped and Valleyed declared as `latest` in package manifests. Set canonical resolved versions only in the global `pnpm-workspace.yaml` overrides: Equipped `5.3.4` and Valleyed `4.5.24`; refresh the lockfile through pnpm. These overrides apply repo-wide, including transitive dependencies; no local-path or package-specific override exceptions. Dependency alignment does not authorize rewriting existing package manifests or legacy source.
- For `libs/core2`, use ordinary project TypeScript checking and behavior-focused runtime tests with the real Equipped InMemoryAdapter. Do not add separate type-test/negative-compile suites or persistent-backend test matrices. This scoped rule replaces the general focused-type-test requirement for this library only. Schema/history checks remain at construction/setup/migrate, not every ordinary operation; domain ownership/revision validation and lifecycle admission still apply.

## Verification

- Use the closest child AGENTS.md for subtree-specific checks.
- For repo-wide source/config changes, run from repo root: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format`, and `pnpm fallow:audit`.

## Child DOX Index

- `consumers/AGENTS.md` — consumer application package contracts and package child index.
- `docs/AGENTS.md` — documentation contracts, context docs, ADR rules, and documentation child index.
- `libs/AGENTS.md` — workspace package contracts and package child index.
