# Core foundation

Private ESM workspace package `@gorchestra/core2`, developed alongside the existing Core. The Server Consumer still uses `@gorchestra/core`; this package does not convert legacy stores or replace that API.

## Current status

Task 1 implements Valleyed-backed value validators and parsed Result/error contracts, with inline runtime tests in `src/domain/commons.ts` and `src/errors.ts`. The source entry exports **types only**: `Id`, `AuditStamp`, `Result<T, E>` and `SharedOperationError`. Internal validators are not a public schema API; models, storage schemas, lifecycle classes, codecs and all 17 Portfolio operations remain unimplemented.

Implemented value rules reject boxed strings and constructor-spoofed objects, preserve exact body/protected/caller strings, trim only title edges, and validate lowercase ULIDs and safe integer versions/timestamps. Caller attribution defaults omitted `cid` to null; stored/output AuditStamp requires explicit string/null `cid` without repair. Operation-time ID/stamp generation is not implemented yet.

Invalid-input issues preserve actual native/schema-owned messages and present paths in order, copying no values or causes. Core-authored validators must use static paths and non-input-echoing messages; projection is not a sanitizer for arbitrary unsafe PipeErrors and does not maintain a second wording/path catalog. Parsed Result envelopes preserve the selected pipes' input/output types, transformations and ordinary stripping; specific error shapes exclude `actualVersion` from revision conflicts.

The complete scoped suite has **43 passing runtime tests across two files**; forced ordinary TypeScript, scoped ESLint and formatting pass. These are primitive/error checks only, not proof of storage transactions, lifecycle, codecs or upstream isolation. No dummy tests, separate type suite or import mocks are used.

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
