# Gorchestra

Gorchestra is a goal-oriented delivery orchestration project. This repository currently contains the reusable Core orchestration package; no application entrypoint or Consumer app is implemented.

## Workspace layout

This repo is a private pnpm workspace. The root `package.json` owns shared TypeScript, lint, formatting, and tests. `pnpm-workspace.yaml` includes packages under `libs/*`.

Current workspace packages:

- `libs/core` (`@gorchestra/core`) — the sole implementation package, exported directly from TypeScript source. It provides native storage opening, explicit setup/migration, shared cleanup, attributed Project/Secret/Asset operations, Core-owned Secret protection, derived Secret usages, Memory hierarchy and immutable Revision operations, plus encrypted Portfolio export and atomic import. See [package status](libs/core/README.md) and [domain context](docs/core/CONTEXT.md).

## Core documentation

Use [Core future work](docs/core/FUTURE.md) for planned, deferred and post-MVP work. The [documentation guide](docs/DOCUMENTATION.md) defines the per-context `FUTURE.md` convention; `AGENTS.md` files only navigate to the owning documents. Engineering conventions live in the [repository guide](docs/ENGINEERING.md) and [Core guide](docs/core/ENGINEERING.md).

The foundation at `libs/core` provides schema-derived domain records, Portfolio Secret Protection and an immutable native migration catalog. Its state-specific lifecycle API opens storage, explicitly initializes or upgrades it and shares shutdown ownership across issued views. Storage-backed operations validate native migration history under shared or exclusive storage-wide admission and retain transaction protection through settlement. Core protects Secret values and returns metadata only from ordinary Secret operations; Consumers supply the encryption key or explicitly select plaintext storage. Portfolio Snapshots always encrypt exported Secret values, and import atomically replaces domain data while retaining the destination's Secret Protection. See [package usage and status](libs/core/README.md), [domain context](docs/core/CONTEXT.md), and individual [architectural decisions](docs/core/adr/). Accepted Expedition and downstream designs do not resume that work.

Dependency declarations live in package manifests; shared overrides in `pnpm-workspace.yaml` apply across the workspace, including transitive dependencies. Change shared resolutions centrally and refresh the lockfile through pnpm. This is a prerelease with no client migrations applied using the old ledger format; backward conversion is out of scope. Core checks concrete adapter dependencies at admission and uses a fixed storage contract internally.

## Common commands

Install dependencies from the repository root:

```bash
pnpm install --frozen-lockfile --ignore-scripts
```

Run the common quality gates from the repository root:

```bash
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm fallow:check
pnpm fallow:audit --base origin/main
```

The audit base above is an example: supply the branch or commit you intend to compare against. CI supplies the PR target's commit from the event, not a fixed branch or the source branch's upstream.

Use the Node and pnpm versions pinned in `pnpm-workspace.yaml` and `package.json`. Root quality gates cover the monorepo: ESLint and Prettier check maintained repository files, TypeScript builds the root project-reference graph, pnpm runs package tests sequentially, and Fallow uses the root configuration. No application startup or package preparation is needed. `lint-staged` lints staged JavaScript/TypeScript and formats supported staged files regardless of directory. `prepare` installs Git hooks when explicitly invoked or lifecycle scripts are enabled. `verifyDepsBeforeRun: error` rejects missing or out-of-sync dependencies instead of installing implicitly.

The normal scoped foundation test command is:

```sh
pnpm --filter @gorchestra/core test
```

The package has real Portfolio/Project, operation-boundary, lifecycle/setup/cleanup, primitive, model, explicit-ID, migration-catalog and history runtime tests.

Useful fix commands:

```bash
pnpm lint:fix
pnpm format:fix
```
