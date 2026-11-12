# Gorchestra

Gorchestra is a goal-oriented delivery orchestration project. This repository contains the reusable Core orchestration package and the v1 Server Consumer app layer.

## Workspace layout

This repo is a private pnpm workspace. The root `package.json` owns product process scripts, shared TypeScript, lint, formatting, and test tooling. `pnpm-workspace.yaml` includes packages under `libs/*` and `consumers/*`.

Current workspace packages:

- `libs/core` (`@gorchestra/core`) — a private internal package exported directly from source (`./src/index.ts`) for workspace packages to consume.
- `libs/core2` (`@gorchestra/core2`) — the parallel Core foundation package with validated native storage opening, explicit atomic setup, shared cleanup, primitives and model schemas; upgrades and domain operations are not implemented yet. The Server Consumer has not switched to it. See [package status](libs/core2/README.md) and [domain context](docs/core2/CONTEXT.md).
- `libs/form-draft` (`@gorchestra/form-draft`) — private form draft primitives used by consumer UI forms.
- `consumers/server` (`@gorchestra/consumer-server`) — the private v1 Server Consumer package, started by the root application entrypoint.

## Core redesign documentation

The Server Consumer still uses `@gorchestra/core`. The parallel foundation at `libs/core2` (`@gorchestra/core2`) provides value/error primitives, five model schemas, safe schema-derived public types, internal explicit-ID transport and an immutable native migration catalog with pure history classification. Its public lifecycle API now opens native storage, explicitly initializes an empty store and shares shutdown ownership across privately issued views. Upgrade execution, attribution binding and Portfolio operations are not implemented yet. See [package usage and status](libs/core2/README.md), [domain context](docs/core2/CONTEXT.md), individual [architectural decisions](docs/core2/adr/), and the [testing guide](docs/core2/testing.md). Accepted Expedition and downstream designs do not resume that work.

Package manifest declarations remain `latest`; global `pnpm-workspace.yaml` overrides select Equipped `5.3.6` and Valleyed `4.5.25` repo-wide, including transitive dependencies, without local-path or package-specific exceptions. Future version changes belong in those overrides, followed by a pnpm-generated lockfile refresh and complete installed-resolution verification. Existing manifests and legacy Core source are unchanged; the Server's Core-storage resolver annotation now uses Equipped's `InferAdapterConfig<A>`. Core2 checks concrete adapter dependencies at admission and uses a fixed storage contract internally; see [package status](libs/core2/README.md). Task 0 verified installation and dependency alignment, not full workspace runtime qualification; see the [verification record and limits](docs/core2/testing.md#task-0-verification-record).

## Common commands

Install dependencies from the repository root:

```bash
pnpm install --ignore-scripts
```

Run the common quality gates from the repository root:

```bash
pnpm lint
pnpm format
pnpm typecheck
pnpm test
```

The script-free install does not run Server's Nuxt preparation. For credential-free checks, use the [reviewed preparation and disabled-dotenv test procedure](docs/core2/testing.md#credential-free-verification), not bare application/typecheck scripts. Set `pnpm_config_verify_deps_before_run=error` on pnpm run/exec commands to prevent implicit installs.

The normal scoped foundation test command is:

```sh
pnpm_config_verify_deps_before_run=error pnpm --filter @gorchestra/core2 test
```

The package has real lifecycle/setup/cleanup, primitive, model, explicit-ID, migration-catalog and history runtime tests; see [current coverage and limits](docs/core2/testing.md#implemented-boundary-and-scope). These checks do not establish full legacy runtime qualification.

Useful fix commands:

```bash
pnpm lint:fix
pnpm format:fix
```
