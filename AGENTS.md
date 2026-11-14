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
- Keep maintained documentation self-contained: include necessary context, rationale and evidence in its owning document, and cite durable sources rather than temporary planning notes or local archives.

## Work Guidance

### Domain map

- **Core** is reusable Portfolio-level orchestration, implemented in `libs/core` and documented in `docs/core`.
- **Consumers** are application layers that consume Core and provide user experience, authentication, authorization, and deployment-specific runtime concerns.
- No Consumer application or root process entrypoint is currently implemented.

### Context relationships

- **Consumers → Core**: Consumers create, open, authorize, protect, and operate Portfolios through the Core orchestration model.
- **Core → Consumers**: Core owns Portfolio data; consumers provide user experience, authentication, authorization, and deployment-specific runtime concerns.

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

### Core foundation and shared dependencies

- `libs/core` (`@gorchestra/core`) is the sole implementation package; use unnumbered code identifiers such as `CoreDependencies`. Its current documentation lives in `docs/core/`. Do not restore deleted implementations or application entrypoints without an explicit request.
- Keep Equipped and Valleyed declared as `latest` in package manifests. Set canonical resolved versions only in the global `pnpm-workspace.yaml` overrides; refresh the lockfile through pnpm. These overrides apply repo-wide, including transitive dependencies; no local-path or package-specific override exceptions. This prerelease has no client migrations using the old ledger format; backward conversion is out of scope, not a delivery/deployment gate.
- For `libs/core`, use ordinary project TypeScript checking and behavior-focused runtime tests with the real Equipped InMemoryAdapter. Do not add separate type-test/negative-compile suites or persistent-backend test matrices. This scoped rule replaces the general focused-type-test requirement for this library only. Schema/history checks remain at construction/setup/migrate, not every ordinary operation; domain ownership/revision validation and lifecycle admission still apply.
- Core runtime/overlap tests, ordinary TypeScript, lint/format and Fallow checks run through the root scripts. Use pnpm's workspace overrides and frozen lockfile for dependency consistency rather than a custom dependency-check script. Run heavy checks sequentially with memory headroom.

## Verification

- Use the closest child AGENTS.md for subtree-specific checks.
- Keep root quality commands monorepo-wide: ESLint and Prettier cover maintained repository files, TypeScript builds the root project-reference graph, and pnpm recursively runs package tests sequentially. Register new TypeScript packages in the root references. Keep `lint-staged` directory-independent and sequential so ESLint and Prettier cannot race on staged code. Exclude generated caches and `.trowel/` from repository-wide scans.
- Keep root scripts focused on active quality gates, fix commands and Git-hook setup/checks; do not retain no-op preparation hooks or unused CLI shortcuts.
- Root `tsconfig.json` owns shared compiler rules and the project-reference index; package configs extend it and declare their own file scope and build settings. Project references are not inherited. Typed ESLint uses each file's nearest `tsconfig.json`; include TypeScript tool configs in their owning project rather than maintaining an ESLint-only project.
- Keep the package-wide `minimumReleaseAgeExclude` entries for Equipped, Valleyed, and xi-configs: the user authors and trusts all three packages, including future updates. These exceptions do not change explicit version pins or overrides, or the release-age delay for other packages.
- Keep `verifyDepsBeforeRun: error`: `pnpm run` and `pnpm exec` must stop when installed dependencies are out of sync rather than installing implicitly. Run dependency installation explicitly before retrying; do not bypass this check.
- Keep the Fallow audit script branch-neutral and supply the intended comparison ref explicitly. CI passes `github.event.pull_request.base.sha` through a quoted environment variable and reruns when a PR is retargeted; local audits use `--base <target-ref>`. Do not rely on upstream autodetection, which can yield an empty changeset on a pushed branch.
- Configure Fallow only in the root `.fallowrc.json` and run it from the repository root across all workspace packages. Do not add package-level configs or package-specific analysis filters; let TypeScript project discovery cover the workspace.
- Keep shared `@types/node` declarations aligned with the supported Node major declared in `pnpm-workspace.yaml`, regardless of the runtime used for tooling.
- CI sets up the pinned Node and pnpm versions and invokes root `pnpm` commands directly on the runner. Keep dependency installation explicit and script-free; do not reintroduce a Docker wrapper or claim network/filesystem isolation for these checks.
- For repo-wide source/config changes, run from repo root: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format`, and `pnpm fallow:audit --base <target-ref>`.

## Child DOX Index

- `docs/AGENTS.md` — documentation contracts, context docs, ADR rules, and documentation child index.
- `libs/AGENTS.md` — workspace package contracts and package child index.
