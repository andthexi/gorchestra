# Gorchestra

Gorchestra is a goal-oriented delivery orchestration project. This repository contains the reusable Core orchestration package and the v1 Server Consumer app layer.

## Workspace layout

This repo is a private pnpm workspace. The root `package.json` owns product process scripts, shared TypeScript, lint, formatting, and test tooling. `pnpm-workspace.yaml` includes packages under `libs/*` and `consumers/*`.

Current workspace packages:

- `libs/core` (`@gorchestra/core`) — a private internal package exported directly from source (`./src/index.ts`) for workspace packages to consume.
- `libs/form-draft` (`@gorchestra/form-draft`) — private form draft primitives used by consumer UI forms.
- `consumers/server` (`@gorchestra/consumer-server`) — the private v1 Server Consumer package, started by the root application entrypoint.

## Core redesign documentation

The Server Consumer still uses `@gorchestra/core`. A parallel Core foundation is planned at `libs/core2` (`@gorchestra/core2`), but **the package is unimplemented and not yet scaffolded** in the documentation-only decision-promotion task. See [new Core context](docs/core2/CONTEXT.md), the [ADR index](docs/core2/adr/README.md), and the [complete decision coverage register](docs/core2/adr/decision-coverage.md). Existing [Core documentation](docs/core/CONTEXT.md) remains authoritative for the Consumer-used library. Recording paused Expedition/runtime/downstream decisions does not resume their implementation.

The accepted dependency policy keeps package manifest declarations as `latest` and centralizes repo-wide exact resolution in global `pnpm-workspace.yaml` overrides: Equipped `5.3.4`, Valleyed `4.5.24`, including transitive dependencies and without local-path or package-specific exceptions. **Task 0 applies and verifies those overrides and the generated lockfile; D1 changes no dependency configuration or installed packages.** See the [dependency decision](docs/core2/adr/2026-11-12-0140-canonical-dependencies.md).

## Common commands

Install dependencies from the repository root:

```bash
pnpm install
```

Run the common quality gates from the repository root:

```bash
pnpm lint
pnpm format
pnpm typecheck
pnpm test
```

Useful fix commands:

```bash
pnpm lint:fix
pnpm format:fix
```
