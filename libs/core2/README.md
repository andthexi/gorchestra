# Core foundation

Private ESM workspace package `@gorchestra/core2`, developed alongside the existing Core. The Server Consumer still uses `@gorchestra/core`; this package does not convert legacy stores or replace that API.

## Current status

Task 0 supplies package configuration, a normal TypeScript project reference, and package-local Vitest discovery. **No runtime source, models, lifecycle classes, or Portfolio operations exist yet.** The source export declares `./src/index.ts` for later implementation; that file is intentionally absent, so the package is not importable yet.

The scoped TypeScript check reports no input files and Vitest reports no tests at this interim configuration gate. These are not passing runtime checks. Task 1 adds the first real tested source; do not add dummy exports/tests or `passWithNoTests` to conceal the gap.

## Dependencies and checks

Both dependencies remain declared as `latest`. Global `pnpm-workspace.yaml` overrides select Equipped `5.3.4` and Valleyed `4.5.24` throughout the repository; the generated lockfile records resolution. Change versions centrally, not in individual manifests.

From the repository root:

```sh
pnpm_config_verify_deps_before_run=error pnpm --filter @gorchestra/core2 test
pnpm_config_verify_deps_before_run=error pnpm exec tsc -b libs/core2 --pretty false
pnpm_config_verify_deps_before_run=error pnpm exec eslint 'libs/core2/**/*.ts'
pnpm_config_verify_deps_before_run=error pnpm exec prettier --check libs/core2
```

The standard test command can load dotenv through Vite. For credential-free verification use the explicit disabled-dotenv procedure in the [testing guide](../../docs/core2/testing.md), not an unreviewed application command.

See [domain context](../../docs/core2/CONTEXT.md), the [foundation contract reference](../../docs/core2/contracts.md), [testing policy](../../docs/core2/testing.md), and the [ADR index](../../docs/core2/adr/README.md). Accepted lifecycle, storage, Secret-safety and operation contracts are design requirements, not implemented guarantees. Real InMemoryAdapter tests will be the only storage-backed test suite; no persistent backend is qualified by this configuration. Equipped #148/#149 remain independent evidence boundaries, not fixed by installing the canonical versions.
