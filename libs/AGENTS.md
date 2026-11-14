# Libraries DOX

## Purpose

The `libs/` tree contains workspace packages that implement Gorchestra source surfaces.

## Ownership

- `libs/AGENTS.md` owns package-workspace contracts and the package Child DOX Index.
- Each package owns its local source, package manifest, tests, and package-local tool config.
- Root tooling owns repo-wide lint, typecheck, formatting, package manager, and project-reference orchestration.
- Root `.fallowrc.json` owns Fallow analysis for all workspace packages; packages do not maintain separate Fallow configs.

## Local Contracts

- Packages live under `libs/*` and are included by `pnpm-workspace.yaml`.
- Package tests should be configured in the package, not in root Vitest config.
- Package source changes that alter durable domain language or decisions must be synchronized with relevant docs.

## Work Guidance

- Prefer package-local configs for package behavior and root configs for repo-wide orchestration.
- Keep package boundaries explicit through package manifests and TypeScript project references.
- Register each TypeScript package in root `tsconfig.json` and define its runtime test command in its manifest; root typechecking and recursive tests must cover every implementation package.
- Include package TypeScript tool configs alongside source in the package's `tsconfig.json` so ordinary typechecking and typed ESLint share the same project.
- Do not add new packages without adding or updating the relevant child AGENTS.md entry.

## Verification

- From repo root, run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm fallow:audit --base <target-ref>` after package source changes, using the intended comparison branch or commit.
- Use package-specific verification from the nearest child AGENTS.md when available.

## Child DOX Index

- `libs/core/AGENTS.md` — the remaining Core implementation package, documented in `docs/core`; ordinary TypeScript and InMemoryAdapter runtime tests.
