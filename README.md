# Gorchestra

Gorchestra is a goal-oriented delivery orchestration project. This repository currently contains the reusable Core orchestration package; no application entrypoint or Consumer app is implemented.

## Workspace layout

This repo is a private pnpm workspace. The root `package.json` owns shared TypeScript, lint, formatting, and tests. `pnpm-workspace.yaml` includes packages under `libs/*`.

Current workspace packages:

- `libs/core` (`@gorchestra/core`) — the sole implementation package, exported directly from TypeScript source. It provides native storage opening, explicit setup/migration, shared cleanup, attributed Project/Secret/Asset operations, derived Secret usages, Memory hierarchy and immutable Revision append/read operations. See [package status](libs/core/README.md) and [domain context](docs/core/CONTEXT.md).

## Core documentation

The foundation at `libs/core` provides value/error primitives, five model schemas, safe schema-derived public types, internal explicit-ID transport and an immutable native migration catalog with pure history classification. Its public lifecycle API opens native storage, explicitly initializes or upgrades an admitted store and shares shutdown ownership across privately issued views. A ready client binds attribution synchronously to Project/Secret/Asset operations, derived Secret usages and Memory creation/hierarchy/revision operations, using a shared transaction and Result-validation boundary. Secret writes validate the Consumer encoder and return safe metadata; other domain operations invoke no codecs or providers. Initial Memory creation writes a compact head and full first revision together; later append conditionally updates the summary and inserts an immutable snapshot with exact conflict/exhaustion failures. See [package usage and status](libs/core/README.md), [domain context](docs/core/CONTEXT.md), and individual [architectural decisions](docs/core/adr/). Accepted Expedition and downstream designs do not resume that work.

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
