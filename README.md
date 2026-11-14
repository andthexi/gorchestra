# Gorchestra

Gorchestra is a goal-oriented delivery orchestration project. This repository contains the reusable Core orchestration package and the v1 Server Consumer app layer.

## Workspace layout

This repo is a private pnpm workspace. The root `package.json` owns product process scripts, shared TypeScript, lint, formatting, and test tooling. `pnpm-workspace.yaml` includes packages under `libs/*` and `consumers/*`.

Current workspace packages:

- `libs/core` (`@gorchestra/core`) — a private internal package exported directly from source (`./src/index.ts`) for workspace packages to consume.
- `libs/form-draft` (`@gorchestra/form-draft`) — private form draft primitives used by consumer UI forms.
- `consumers/server` (`@gorchestra/consumer-server`) — the private v1 Server Consumer package, started by the root application entrypoint.

## Core redesign documentation

The Server Consumer still uses `@gorchestra/core`. A parallel Core foundation is planned at `libs/core2` (`@gorchestra/core2`), but **the package is unimplemented and not yet scaffolded** in this documentation-only snapshot. The [new Core context](docs/core2/CONTEXT.md) defines domain language and relationships; individual [architectural decisions](docs/core2/adr/) explain consequential choices and their trade-offs. Existing [Core documentation](docs/core/CONTEXT.md) remains authoritative for the Consumer-used library. Package usage documentation follows implementation; accepted Expedition and downstream designs do not resume that work.

The planned dependency policy keeps package manifest declarations as `latest` and centralizes repo-wide exact resolution in global `pnpm-workspace.yaml` overrides: Equipped `5.3.4`, Valleyed `4.5.24`, including transitive dependencies and without local-path or package-specific exceptions. The implementation must apply those overrides, refresh the lockfile through pnpm and verify actual installed resolution. **This documentation snapshot changes no dependency configuration or installed packages.**

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
