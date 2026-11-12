# Gorchestra

Gorchestra is a goal-oriented delivery orchestration project. This repository contains the reusable Core orchestration package and the v1 Server Consumer app layer.

## Workspace layout

This repo is a private pnpm workspace. The root `package.json` owns product process scripts, shared TypeScript, lint, formatting, and test tooling. `pnpm-workspace.yaml` includes packages under `libs/*` and `consumers/*`.

Current workspace packages:

- `libs/core` (`@gorchestra/core`) — a private internal package exported directly from source (`./src/index.ts`) for workspace packages to consume.
- `libs/core2` (`@gorchestra/core2`) — the parallel Core foundation package, currently configuration-only with no runtime API. The Server Consumer has not switched to it. See [package status](libs/core2/README.md) and [domain context](docs/core2/CONTEXT.md).
- `libs/form-draft` (`@gorchestra/form-draft`) — private form draft primitives used by consumer UI forms.
- `consumers/server` (`@gorchestra/consumer-server`) — the private v1 Server Consumer package, started by the root application entrypoint.

## Core redesign documentation

The Server Consumer still uses `@gorchestra/core`. The parallel foundation at `libs/core2` (`@gorchestra/core2`) has package, TypeScript and Vitest configuration, but no runtime source yet. See [package status](libs/core2/README.md) for the implemented boundary, [domain context](docs/core2/CONTEXT.md) for language and relationships, individual [architectural decisions](docs/core2/adr/) for trade-offs, and the [testing guide](docs/core2/testing.md) for verification procedures and limits. Accepted Expedition and downstream designs do not resume that work.

Package manifest declarations remain `latest`; global `pnpm-workspace.yaml` overrides select Equipped `5.3.4` and Valleyed `4.5.24` repo-wide, including transitive dependencies, without local-path or package-specific exceptions. Future version changes belong in those overrides, followed by a pnpm-generated lockfile refresh and complete installed-resolution verification. Existing manifests, Core source and Consumer imports are unchanged. Task 0 verified installation and dependency alignment, not full workspace runtime qualification; see the [verification record and limits](docs/core2/testing.md#task-0-verification-record).

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

At Task 0 it reports no tests, and its TypeScript project reports no inputs. These are expected interim configuration-gate failures, not passing runtime checks. Do not mask them with dummy source/tests; Task 1 supplies actual tested source.

Useful fix commands:

```bash
pnpm lint:fix
pnpm format:fix
```
