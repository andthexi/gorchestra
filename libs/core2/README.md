# @gorchestra/core2

Private ESM workspace package for the parallel Core foundation. The Server Consumer still uses `@gorchestra/core`; this package does not convert legacy stores or replace that API.

The dependency boundary checks the concrete adapter and its resolver together; Core's internals use a fixed storage contract rather than exposing adapter-specific capabilities. Native catalog construction needs no type assertion.

**Overlapping-operation acceptance is blocked by the installed Equipped 5.3.6 InMemory rollback defect.** An overlapping missing-Project lookup can roll back its snapshot after a separate Project creation has committed and returned success, deleting that acknowledged creation. This was reproduced through the public Portfolio API and native Repo/InMemory alone. [Equipped #148](https://github.com/andthexi/equipped/issues/148) is closed through merged [PR #178](https://github.com/andthexi/equipped/pull/178), but this installed release predates the fix. Other implementation work continues in draft while release consumption and overlap verification are deferred. Sequential tests do not establish isolation; no Core serialization workaround or weakened rollback contract is supplied.

## Public surface

`PortfolioClient.new(dependencies)` returns a `Result` containing one privately constructed lifecycle view:

- `PortfolioSetup`: `state: 'uninitialized'`, `setup()` and `shutdown()`.
- `PortfolioClient`: `state: 'ready'`, synchronous `as({ by, cid })` and `shutdown()`.
- `PortfolioMigration`: `state: 'migration'`, explicit `migrate()` and `shutdown()`. A proper nonempty prefix needs multiple released migrations; the current catalog has one entry, so upgrade tests use a private test-owned catalog.

`as()` returns a `Result` containing a privately constructed `Portfolio` with bound Project and Secret create/find/list operations plus `secrets.updateValue`. The Portfolio has no lifecycle controls or rebinding method. Secret usages and Asset/Memory operations are not implemented yet; no placeholder namespaces or methods are exposed. Secret creation and value replacement invoke the required Consumer encoder; metadata reads never invoke codecs. Internal definitions, schemas, Repo, codec helpers, migration injection and owner controls are not Consumer APIs.

Public types include `CoreDependencies<A>`, `FactoryError`, `SetupError`, `MigrationError`, `InvalidInputError`, `StorageOperationFailedError`, `Result<T, E>`, `SharedOperationError`, `Id`, `AuditStamp`, and the schema-derived `Project`, `Asset`, `Secret`, `Memory` and `MemoryRevision` records. `Secret` contains only safe metadata, never `valueRef` or raw values. Source owns the exact [dependency signatures](src/dependencies.ts), [lifecycle API](src/portfolio-client/index.ts) and [error unions](src/errors.ts).

## Open, explicitly initialize, and close

This synthetic InMemory example is suitable for local checks, not a Secret-protection implementation. Its encoder deliberately refuses all Secret writes by returning null:

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
		case 'migration': {
			// Only do this during the caller's explicit maintenance window.
			const upgraded = await opened.value.migrate()
			if (!upgraded.ok) throw new Error(upgraded.error.type)
			console.log(upgraded.value.state) // ready
			break
		}
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

`migrate()` rechecks authoritative history and applies the entire pending suffix in one outer native Repo session. Empty history with no containers returns `storage-not-initialized`; empty history with containers returns `storage-not-empty`; complete history returns `schema-already-current`. Malformed, duplicate, unknown and gapped history precede those refusals. Only a successful complete run and commit returns a fresh ready view; the old migration view keeps its state and later refuses as current. A later migration failure rolls back the whole suffix rather than committing earlier entries, subject to the adapter's actual rollback behavior.

The migration runner retains the same raw-ledger confirmation and invocation-local rollback safeguards as setup. Ordinary I/O failure with successful rollback permits explicit retry; observable protocol/unwind failure closes admission. Native errors from entirely declarative entries are classified as storage failures. Callback-bearing or mixed entries lack precise native failing-change provenance and use a safe `internal-error` fallback; this does not identify the hidden cause. No error-message inspection or automatic retry is performed.

All views share shutdown admission and cleanup. Shutdown closes admission synchronously, drains admitted setup, migration and domain operations including pending encoder callbacks, and joins concurrent cleanup calls. Successful repeats do not disconnect again. A failed cleanup keeps admission closed and permits a later explicit shutdown retry without reconnecting or replaying work. Factory failures await cleanup before returning no capability; observable cleanup failure takes precedence. Same-owner callback reentry is unsupported; deployments must arrange non-overlapping maintenance. An already-admitted transition may finish while shutdown drains it, but its returned ready view cannot bind new work after admission closes.

## Attributed Project operations

Given a ready `client`, binding validates and copies attribution synchronously without storage I/O. `by` is required; `cid` may be omitted or null. Both preserve exact strings, including empty strings and whitespace. Later mutation of the caller's object does not change bound attribution.

```ts
const bound = client.as({ by: 'consumer-authorized-actor', cid: 'request-reference' })
if (!bound.ok) throw new Error(bound.error.type)
const portfolio = bound.value
const created = await portfolio.projects.create({ title: '  Example  ', spec: { type: 'source-control' } })
if (!created.ok) throw new Error(created.error.type)
const found = await portfolio.projects.find({ projectId: created.value.id })
const { list } = portfolio.projects
const listed = await list() // Detached calls retain the Portfolio binding.
```

| Operation         | Input                                         | Success value               | Specific failure beyond shared errors                    |
| ----------------- | --------------------------------------------- | --------------------------- | -------------------------------------------------------- |
| `projects.create` | `{ title, spec: { type: 'source-control' } }` | Project                     | None                                                     |
| `projects.find`   | `{ projectId }`                               | Project                     | `not-found` with resource `project` and the requested ID |
| `projects.list`   | No arguments                                  | Every Project, ID ascending | None                                                     |

Creation generates one ID and one Core UTC audit stamp, trims the title and creates no implicit children. The [definition tree](src/operations/index.ts) supplies the actual runtime binding and inferred signatures; callers pass neither handler context nor metadata. Namespace and function properties are TypeScript-readonly, not runtime-frozen.

Each operation parses input before admission, runs its full handler using native Repo in one transaction, and validates the complete Result before commit. Parsed success returns only after commit. Stored reads are validated before use; malformed rows fail the whole read/list rather than being skipped or repaired. Shared errors distinguish `invalid-input`, `invalid-storage-output`, `invalid-output`, `internal-error` and `storage-operation-failed`. A valid failure rolls back with an invocation-local signal; an unrecognized unwind or skipped/swallowed session protocol closes admission. Ordinary domain operations do not reread migration history or inspect the schema.

## Secret metadata and protection

| Operation             | Input                 | Success value                          | Specific failure beyond shared errors                                             |
| --------------------- | --------------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| `secrets.create`      | `{ title, value }`    | Safe Secret metadata                   | `secret-encoding-failed`                                                          |
| `secrets.find`        | `{ secretId }`        | Safe Secret metadata                   | `not-found` with resource `secret` and the requested ID                           |
| `secrets.list`        | No arguments          | All safe Secret metadata, ID ascending | None                                                                              |
| `secrets.updateValue` | `{ secretId, value }` | Safe Secret metadata                   | `not-found` with resource `secret` and the requested ID; `secret-encoding-failed` |

All public Secret results contain only `id`, `title`, `created` and `valueUpdated`. Neither plaintext nor `valueRef` is returned. Creation trims the title but preserves the exact nonempty raw value, including whitespace-only strings. Core generates the ID, awaits `encode({ secretId, value })` inside the operation transaction, validates an exact nonempty primitive reference, and only then inserts the complete row with matching creation/value-update stamps. Null, empty/nonstring results, throws and rejections return type-only `secret-encoding-failed`; there is no placeholder row, implicit retry or decode-after-encode. Native write/commit failures remain storage failures. A local rollback does not undo an external protection-store effect.

`find` and `list` validate the full stored record, including its protected reference, before safe projection; a corrupt reference cannot be hidden by dropping that field. One malformed member fails the whole list. Reads and Project operations do not invoke either codec. Detached Secret methods retain their Portfolio binding.

[`updateValue`](src/operations/secrets/update-value.ts) requires and validates the complete existing Secret before calling the encoder with the same ID and exact new raw value. It writes only the new `valueRef` and invocation's `valueUpdated` stamp; identity, title, creation attribution and Asset references stay unchanged. Repeating the same accepted value still invokes the encoder and records the operation—there is no equality-based no-op. Empty raw values are invalid; whitespace-only values remain valid. Missing/corrupt records fail before encoding, and encoder failures leave the old database row unchanged. Null or malformed native update output fails as `invalid-output` rather than returning fabricated metadata. The existing transaction boundary validates the Result before commit and waits for commit/rollback before settling.

Given a bound `portfolio`, an existing `secretId`, and a Consumer-supplied `newValue`:

```ts
const replaced = await portfolio.secrets.updateValue({ secretId, value: newValue })
if (!replaced.ok) throw new Error(replaced.error.type)
// replaced.value contains only safe metadata, never the value or reference.
```

The internal [codec helpers](src/runtime/secrets.ts) also validate the supplied batch decoder. They capture distinct already-validated Secret IDs and exact references independently of callback-mutated request objects. Identical repeated pairs collapse; conflicting references for one ID violate an internal authoring invariant before callback invocation. Empty requests return an empty map without invoking the callback.

Decoder response data must have exactly the requested own enumerable string keys and primitive string/null values. Empty decoded strings succeed; null fails only that ID in an otherwise valid response. Malformed keys/values or a thrown/rejected response fail every requested ID without inspecting diagnostics. Internal results are keyed by ID with no repeated ID inside each Result; there is no public decode or reveal method. Symbols and nonenumerable properties are not record data keys, and inherited properties cannot satisfy requests. No decoded values are cached across operations.

Shutdown waits for an already-admitted encoder and its transaction to settle before cleanup, on both success and failure. Callbacks must not reenter operations or shutdown on the same owner.

## Implemented validation

[Shared values](src/domain/commons.ts) validate primitive strings, lowercase ULIDs, safe integer versions/timestamps and attribution. Titles trim outer whitespace; bodies and protected/caller strings remain exact. Caller attribution defaults omitted `cid` to null, while stored Audit Stamps require explicit string/null `cid`. The operation runner prepares one stamp per invocation inside the transaction and reuses it across owned writes.

The model modules own the implemented shapes: [Project](src/domain/project.ts), [Asset](src/domain/asset.ts), [Secret](src/domain/secret.ts), [Memory](src/domain/memory.ts) and [MemoryRevision](src/domain/memory-revision.ts). Specs and revision summaries remain nested objects. Whole-record validation derives from the actual Equipped fields without applying create defaults; public Secret metadata explicitly selects its four safe field pipes. Parsing trims titles and strips undeclared fields without modifying the input or writing repairs to storage.

[Explicit-ID transport](src/storage/schema.ts) preserves the identity generated with Equipped `Instance.createId()` through native primary-key generation, which runs even when a row already supplies its ID. Native InMemory create/read tests exercise all five models and prove that a missing ID slot fails rather than generating a replacement. Project and Secret creation use this internal write support; Asset/Memory operations remain pending.

[Result and error contracts](src/errors.ts) parse envelopes through Valleyed and preserve its transformations and normal field stripping. Invalid-input issues retain safe schema-owned wording and present paths in order, without copying values or causes. Core-authored validators must use static paths and non-input-echoing messages; issue projection is not a sanitizer for arbitrary custom errors.

## Internal migration support

The [initial migration](src/storage/migrations/initial-foundation.ts) snapshots the five logical tables as native Equipped changes under the permanent ID `01m76d124c6e848k2hfvb4mar2`. It does not import current model schemas, flatten nested objects, or add foreign keys or unique indexes. Released IDs and definitions stay unchanged; new migrations append in ID order to the [catalog](src/storage/migrations/index.ts). Native `Migrator.from(repo, adapter).migrations(...).build()` retains responsibility for definition validation and adapter compatibility; there is no second catalog validator or runner.

The internal [history classifier](src/storage/history.ts) validates the entire unknown ledger through the shared ID and safe-millisecond pipes before checking duplicates, unknown IDs and contiguous-prefix membership, in that order. It returns `empty`, `migration` or `ready`, or a type-only `schema-metadata-invalid` / `schema-version-unrecognized` error. Entry order and timestamp order do not determine progression; undeclared fields strip normally without input mutation or repair. Its catalog IDs are trusted internal authoring data, not a public input boundary.

Native InMemory tests exercise factory classification, explicit setup and whole-suffix upgrade, DDL/data/ledger rollback, stale transition refusals and shared cleanup. A module-local test catalog establishes a committed prefix and verifies that later authored/declarative failure preserves the earlier Project, schema and full ledger timestamps while removing pending changes. It is not a public migration-injection API and does not add released migrations. Overlap isolation, persistent backends and physical-resolver qualification remain outside this result; neither legacy conversion nor Equipped #148/#149 qualification is supplied by these tests.

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
