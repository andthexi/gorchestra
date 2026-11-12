# @gorchestra/core2

Private ESM workspace package for the parallel Core foundation. The Server Consumer still uses `@gorchestra/core`; this package does not convert legacy stores or replace that API.

The dependency boundary checks the concrete adapter and its resolver together; Core's internals use a fixed storage contract rather than exposing adapter-specific capabilities. Native catalog construction needs no type assertion.

## Public surface

`PortfolioClient.new(dependencies)` returns a `Result` containing one privately constructed lifecycle view:

- `PortfolioSetup`: `state: 'uninitialized'`, `setup()` and `shutdown()`.
- `PortfolioClient`: `state: 'ready'` and `shutdown()`.
- `PortfolioMigration`: `state: 'migration'` and `shutdown()`. A proper nonempty prefix needs multiple released migrations; the current catalog has one entry. Upgrade execution is not implemented yet.

This is an intermediate lifecycle surface. There is no `as()`, attributed Portfolio facade, domain operation tree or `migrate()` yet; no placeholder methods are exposed. Secret callbacks are required dependencies but no implemented operation invokes them. Internal schemas, Repo, migration injection and owner controls are not Consumer APIs.

Public types include `CoreDependencies<A>`, `FactoryError`, `SetupError`, `StorageOperationFailedError`, `Result<T, E>`, `SharedOperationError`, `Id`, `AuditStamp`, and the schema-derived `Project`, `Asset`, `Secret`, `Memory` and `MemoryRevision` records. `Secret` contains only safe metadata, never `valueRef` or raw values. Source owns the exact [dependency signatures](src/dependencies.ts), [lifecycle API](src/portfolio-client/index.ts) and [error unions](src/errors.ts).

## Open, explicitly initialize, and close

This synthetic InMemory example is suitable for local checks, not a Secret-protection implementation:

```ts
import { InMemoryAdapter } from 'equipped/orm/adapters/in-memory'
import { PortfolioClient, type CoreDependencies } from '@gorchestra/core2'

const dependencies: CoreDependencies<InMemoryAdapter> = {
	storage: {
		adapter: InMemoryAdapter.create({}),
		resolveSchema: (schema) => ({ table: schema.name }),
	},
	secrets: {
		encode: () => Promise.resolve(null),
		decode: () => Promise.resolve({}),
	},
}

const opened = await PortfolioClient.new(dependencies)
if (!opened.ok) throw new Error(opened.error.type)
try {
	switch (opened.value.state) {
		case 'uninitialized': {
			// Only do this when initialization is the caller's explicit intent.
			const initialized = await opened.value.setup()
			if (!initialized.ok) throw new Error(initialized.error.type)
			console.log(initialized.value.state) // ready
			break
		}
		case 'ready':
			break
		case 'migration':
			throw new Error('This package does not implement upgrade execution yet.')
		default:
			throw new Error('Unexpected lifecycle state.')
	}
} finally {
	const closed = await opened.value.shutdown()
	if (!closed.ok) throw new Error(closed.error.type)
}
```

The resolver's return type uses Equipped's schema-config-pipe-first `InferAdapterConfig<A>`; for InMemory it requires `{ table: string }`. The factory infers `A` from the supplied adapter, not its resolver or capability constraint. After dependency admission, a nongeneric owner constructs native `Repo<StorageAdapter>` and `Migrator<StorageAdapter>` directly; the lifecycle views do not carry `A`. The original adapter and resolver remain paired and Core treats configuration results as opaque. Neither an existing Repo nor a catalog is cast to another adapter type.

`CoreDependencies<A>` admission is capability-based, not a database allowlist. Its type constraint checks the immutable catalog against native `Migration<A>` and requires definite singleton tuple slots for each required field type (currently `string`, `number`, and `object`). Widened arrays cannot establish that support. `A` must be a single adapter type, not a union: when selecting between implementations, narrow the adapter in a branch and construct its matching dependency pair there before calling `PortfolioClient.new`. Otherwise independent adapter and resolver unions could permit mismatched configurations even when both implementations support the catalog. Keep concrete adapter types at this input boundary instead of annotating instances as base `OrmAdapter`. Internally, authored migrations are checked with `satisfies Migration<StorageAdapter>` while retaining their literal definitions; operations use Core's fixed contract, not optional capabilities of a selected implementation.

Required native methods, a nonempty array of recognized primitive field-type names, and both callbacks are checked before startup without calling the resolver or codecs. Missing, malformed and empty declarations return `invalid-input`; the adapter and its declaration are not copied or rewritten. Equipped's native builder still checks the actual catalog against declared support, and its construction failures follow existing cleanup/error handling. These checks do not certify an adapter's implementation or transaction isolation. Optional adapter `connect()`/`disconnect()` are called directly; global Equipped startup/shutdown is not used.

Opening reads and validates the native ledger. Valid empty history requires native inspection to find no application containers: even a metadata-only table or CRUD-created table is `storage-not-empty`. Opening never applies migrations or creates application tables. Malformed and unrecognized history precede storage-state refusals and are never repaired.

`setup()` rechecks history and emptiness inside one outer native Repo session, applies the entire catalog, then validates the raw ledger as complete before permitting commit. Only successful commit returns a fresh ready client sharing the original owner. The retained setup view stays uninitialized and refuses another setup with `storage-already-initialized`. Setup failures unwind the transaction; native I/O failures are `storage-operation-failed`, unexpected authoring failures are `internal-error`, and history errors remain type-only. A resolved migration run with an incomplete or invalid ledger is a protocol failure: it aborts the outer transaction and keeps admission closed, while shutdown remains available. An ordinary post-run ledger read failure permits explicit setup retry after successful rollback.

All views share shutdown admission and cleanup. Shutdown closes admission synchronously, drains admitted setup, and joins concurrent cleanup calls. Successful repeats do not disconnect again. A failed cleanup keeps admission closed and permits a later explicit shutdown retry without reconnecting or replaying work. Factory failures await cleanup before returning no capability; observable cleanup failure takes precedence. Same-owner callback reentry is unsupported; deployments must arrange non-overlapping maintenance.

## Implemented validation

[Shared values](src/domain/commons.ts) validate primitive strings, lowercase ULIDs, safe integer versions/timestamps and attribution. Titles trim outer whitespace; bodies and protected/caller strings remain exact. Caller attribution defaults omitted `cid` to null, while stored Audit Stamps require explicit string/null `cid`. Operation-time stamp preparation remains unimplemented.

The model modules own the implemented shapes: [Project](src/domain/project.ts), [Asset](src/domain/asset.ts), [Secret](src/domain/secret.ts), [Memory](src/domain/memory.ts) and [MemoryRevision](src/domain/memory-revision.ts). Specs and revision summaries remain nested objects. Whole-record validation derives from the actual Equipped fields without applying create defaults; public Secret metadata explicitly selects its four safe field pipes. Parsing trims titles and strips undeclared fields without modifying the input or writing repairs to storage.

[Explicit-ID transport](src/storage/schema.ts) preserves the identity generated with Equipped `Instance.createId()` through native primary-key generation, which runs even when a row already supplies its ID. Native InMemory create/read tests exercise all five models and prove that a missing ID slot fails rather than generating a replacement. This is internal write support, not a public create operation.

[Result and error contracts](src/errors.ts) parse envelopes through Valleyed and preserve its transformations and normal field stripping. Invalid-input issues retain safe schema-owned wording and present paths in order, without copying values or causes. Core-authored validators must use static paths and non-input-echoing messages; issue projection is not a sanitizer for arbitrary custom errors.

## Internal migration support

The [initial migration](src/storage/migrations/initial-foundation.ts) snapshots the five logical tables as native Equipped changes under the permanent ID `01m76d124c6e848k2hfvb4mar2`. It does not import current model schemas, flatten nested objects, or add foreign keys or unique indexes. Released IDs and definitions stay unchanged; new migrations append in ID order to the [catalog](src/storage/migrations/index.ts). Native `Migrator.from(repo, adapter).migrations(...).build()` retains responsibility for definition validation and adapter compatibility; there is no second catalog validator or runner.

The internal [history classifier](src/storage/history.ts) validates the entire unknown ledger through the shared ID and safe-millisecond pipes before checking duplicates, unknown IDs and contiguous-prefix membership, in that order. It returns `empty`, `migration` or `ready`, or a type-only `schema-metadata-invalid` / `schema-version-unrecognized` error. Entry order and timestamp order do not determine progression; undeclared fields strip normally without input mutation or repair. Its catalog IDs are trusted internal authoring data, not a public input boundary.

Native InMemory tests exercise factory classification, explicit atomic setup, DDL/ledger rollback, stale setup refusal and shared cleanup. A module-local test catalog covers proper-prefix classification and a later authored failure; it is not a public migration-injection API. Upgrade execution, comprehensive upgrade/isolation and physical-resolver qualification remain later work. Neither legacy conversion nor Equipped #148/#149 qualification is supplied by these setup tests.

## Dependencies and verification

Dependency declarations remain `latest`. Global `pnpm-workspace.yaml` overrides select Equipped `5.3.6` and Valleyed `4.5.25`; change versions centrally rather than in individual manifests.

From the repository root:

```sh
pnpm_config_verify_deps_before_run=error pnpm --filter @gorchestra/core2 test
pnpm_config_verify_deps_before_run=error pnpm exec tsc -b libs/core2 --pretty false
pnpm_config_verify_deps_before_run=error pnpm exec eslint 'libs/core2/**/*.ts'
pnpm_config_verify_deps_before_run=error pnpm exec prettier --check libs/core2
```

The standard test command can load dotenv through Vite. Use the [credential-free verification procedure](../../docs/core2/testing.md#credential-free-verification) for isolated checks; the [testing guide](../../docs/core2/testing.md) records coverage and outstanding qualification limits.

See [domain context](../../docs/core2/CONTEXT.md) for language and relationships, and individual [architectural decisions](../../docs/core2/adr/) for the reasons behind the design.
