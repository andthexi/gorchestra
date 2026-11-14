# @gorchestra/core

Private ESM workspace package for the Core foundation and the repository's sole implementation package. Core owns Portfolio data and domain operations; Consumer applications supply user experience, authorization, storage configuration and Secret protection.

Core uses Equipped for persistence. See [why we chose Equipped](../../docs/core/adr/2026-11-14-1432-equipped-storage.md) for the dependency's responsibilities and the boundary with Core and Consumers.

This prerelease has no client migrations applied using the old ledger format. Backward conversion of that format is out of scope, not a delivery or deployment prerequisite.

## Public surface

`PortfolioClient.new(dependencies)` returns a `Promise<Result<…>>` containing one privately constructed lifecycle view:

- `PortfolioSetup`: `state: 'uninitialized'`, `setup()` and `shutdown()`.
- `PortfolioClient`: `state: 'ready'`, synchronous `as({ by, cid })` and `shutdown()`.
- `PortfolioMigration`: `state: 'migration'`, explicit `migrate()` and `shutdown()`. A proper nonempty prefix needs multiple released migrations; the current catalog has one entry, so upgrade tests use a private test-owned catalog.

`as()` returns a `Result` containing a privately constructed `Portfolio` with bound Project/Secret create/find/list, Secret value replacement/usages, Project-scoped Asset create/find/list, Memory create/find/list and Revision create/find/list. The Portfolio has no lifecycle controls or rebinding method. All 17 foundation operation leaves are implemented; the tested scope is the native InMemory contract, not application integration or certification of every adapter. Secret creation and value replacement invoke the required Consumer encoder; metadata reads, Asset/Memory operations and Secret usages never invoke codecs. Internal definitions, schemas, Repo, codec helpers, migration injection and owner controls are not Consumer APIs.

Public types include `CoreDependencies<A>`, `FactoryError`, `SetupError`, `MigrationError`, `InvalidInputError`, `StorageOperationFailedError`, `Result<T, E>`, `SharedOperationError`, `Id`, `AuditStamp`, and the schema-derived `Project`, `Asset`, `Secret`, `Memory` and `MemoryRevision` records. `Secret` contains only safe metadata, never `valueRef` or raw values. Source owns the exact [dependency signatures](src/dependencies.ts), [lifecycle API](src/portfolio-client/index.ts) and [error unions](src/errors.ts).

`new`, `setup`, `migrate`, `shutdown` and every domain operation are asynchronous; `as` returns a synchronous Result. Results are `{ ok: true, value }` or `{ ok: false, error }`; successful shutdown has `value: undefined`. An operation takes either no arguments or one required input object as listed below—never a dummy argument, caller context or metadata object. Expected failures are values; callers must inspect `ok`.

## Open, explicitly initialize, and close

This synthetic InMemory example is suitable for local checks, not a Secret-protection implementation. Its encoder deliberately refuses all Secret writes by returning null:

```ts
import { InMemoryAdapter } from 'equipped/orm/adapters/in-memory'
import { PortfolioClient, type CoreDependencies } from '@gorchestra/core'

const dependencies: CoreDependencies<InMemoryAdapter> = {
	storage: {
		adapter: InMemoryAdapter.create({}),
		resolveSchema: (name) => ({ table: name }),
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

The resolver maps logical names, including `_equipped_migrations`, to the supplied adapter's configuration; for InMemory it returns `{ table: string }`. The adapter and resolver must remain paired. Core treats configuration results as opaque.

`CoreDependencies<A>` requires the capabilities and field types used by Core's catalog and operations, not a particular database. Keep the concrete adapter type at this boundary; when selecting between implementations, narrow the adapter in a branch and construct its matching resolver there before calling `PortfolioClient.new`.

Core checks required methods, field declarations and callbacks before startup without invoking the resolver or codecs. Invalid dependencies return `invalid-input`. Core manages the supplied adapter's optional `connect()`/`disconnect()` directly; it does not start the global Equipped runtime.

Consumers must provide one isolated Portfolio boundary covering application CRUD, migration DDL, the native ledger and introspection. Prefixes or sharing an adapter object alone do not prove that isolation; Core neither detects it nor supplies a cross-process online-migration guard. Quiesce operations for maintenance, retire prior handles and reopen afterward. See [Portfolio isolation](../../docs/core/adr/2026-11-12-0140-portfolio-authority.md) and [explicit schema transitions](../../docs/core/adr/2026-11-12-0140-explicit-schema-transitions.md).

Opening reads and validates the native ledger. Valid empty history requires native inspection to find no application containers: even a metadata-only table or CRUD-created table is `storage-not-empty`. Opening never applies migrations or creates application tables. Malformed and unrecognized history precede storage-state refusals and are never repaired.

`setup()` rechecks history and emptiness inside one outer native Repo session, applies the entire catalog, then validates the raw ledger as complete before permitting commit. Only successful commit returns a fresh ready client sharing the original owner. The retained setup view stays uninitialized and refuses another setup with `storage-already-initialized`. Setup failures unwind the transaction; native I/O failures are `storage-operation-failed`, unexpected authoring failures are `internal-error`, and history errors remain type-only. A resolved migration run with an incomplete or invalid ledger is a protocol failure: it aborts the outer transaction and keeps admission closed, while shutdown remains available. An ordinary post-run ledger read failure permits explicit setup retry after successful rollback.

`migrate()` rechecks authoritative history and applies the entire pending suffix in one outer native Repo session. Empty history with no containers returns `storage-not-initialized`; empty history with containers returns `storage-not-empty`; complete history returns `schema-already-current`. Malformed, duplicate, unknown and gapped history precede those refusals. Only a successful complete run and commit returns a fresh ready view; the old migration view keeps its state and later refuses as current. A later migration failure rolls back the whole suffix rather than committing earlier entries, subject to the adapter's actual rollback behavior.

The migration runner retains the same raw-ledger confirmation and invocation-local rollback safeguards as setup. Ordinary I/O failure with successful rollback permits explicit retry; observable protocol/unwind failure closes admission. Native errors from entirely declarative entries are classified as storage failures. Callback-bearing or mixed entries lack precise native failing-change provenance and use a safe `internal-error` fallback; this does not identify the hidden cause. No error-message inspection or automatic retry is performed.

All views share shutdown admission and cleanup. Shutdown closes admission synchronously, drains admitted setup, migration and domain operations including pending encoder callbacks, and joins concurrent cleanup calls. Successful repeats do not disconnect again. A failed cleanup keeps admission closed and permits a later explicit shutdown retry without reconnecting or replaying work. Factory failures await cleanup before returning no capability; observable cleanup failure takes precedence. Same-owner callback reentry is unsupported; deployments must arrange non-overlapping maintenance. An already-admitted transition may finish while shutdown drains it, but its returned ready view cannot bind new work after admission closes.

## Attributed Project operations

[Project operation source](src/operations/projects/index.ts).

Given a ready `client`, binding validates and copies attribution synchronously without storage I/O. `by` is required; `cid` may be omitted or null. Both preserve exact strings, including empty strings and whitespace. Later mutation of the caller's object does not change bound attribution. `by` and `cid` are attribution/correlation, not authorization or idempotency keys; the Consumer authorizes access before binding.

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

Each operation parses input before admission, runs its full handler using native Repo in one transaction, and validates the complete Result before commit. Parsed success returns only after commit. Stored reads are validated before use; malformed rows fail the whole read/list rather than being skipped or repaired. Shared errors distinguish `invalid-input`, `invalid-storage-output`, `invalid-output`, `internal-error` and `storage-operation-failed`. A valid failure rolls back with an invocation-local signal; an unrecognized unwind or skipped/swallowed session protocol closes admission. Ordinary domain operations do not reread migration history or inspect the schema. There is no write-replay or operation-status API: resubmission is a new invocation, and an uncertain response does not establish that the earlier write rolled back.

## Secret metadata and protection

[Secret operation source](src/operations/secrets/index.ts).

| Operation             | Input                 | Success value                          | Specific failure beyond shared errors                                             |
| --------------------- | --------------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| `secrets.create`      | `{ title, value }`    | Safe Secret metadata                   | `secret-encoding-failed`                                                          |
| `secrets.find`        | `{ secretId }`        | Safe Secret metadata                   | `not-found` with resource `secret` and the requested ID                           |
| `secrets.list`        | No arguments          | All safe Secret metadata, ID ascending | None                                                                              |
| `secrets.updateValue` | `{ secretId, value }` | Safe Secret metadata                   | `not-found` with resource `secret` and the requested ID; `secret-encoding-failed` |

Secret metadata returned by create/find/list/updateValue contains only `id`, `title`, `created` and `valueUpdated`. Neither plaintext nor `valueRef` is returned. Creation trims the title but preserves the exact nonempty raw value, including whitespace-only strings. Core generates the ID, awaits `encode({ secretId, value })` inside the operation transaction, validates an exact nonempty primitive reference, and only then inserts the complete row with matching creation/value-update stamps. Null, empty/nonstring results, throws and rejections return type-only `secret-encoding-failed`; there is no placeholder row, implicit retry or decode-after-encode. Native write/commit failures remain storage failures. A local rollback does not undo an external protection-store effect.

`find` and `list` validate the full stored record, including its protected reference, before safe projection; a corrupt reference cannot be hidden by dropping that field. One malformed member fails the whole list. Reads and Project operations do not invoke either codec. Detached Secret methods retain their Portfolio binding.

[`updateValue`](src/operations/secrets/update-value.ts) requires and validates the complete existing Secret before calling the encoder with the same ID and exact new raw value. It writes only the new `valueRef` and invocation's `valueUpdated` stamp; identity, title, creation attribution and Asset references stay unchanged. Repeating the same accepted value still invokes the encoder and records the operation—there is no equality-based no-op. Empty raw values are invalid; whitespace-only values remain valid. Missing/corrupt records fail before encoding, and encoder failures leave the old database row unchanged. Null or malformed native update output fails as `invalid-output` rather than returning fabricated metadata. The existing transaction boundary validates the Result before commit and waits for commit/rollback before settling. There is no expected-old-value/version guard: the last successful commit wins, so stale-screen replacement can overwrite a newer value.

Given a bound `portfolio`, an existing `secretId`, and a Consumer-supplied `newValue`:

```ts
const replaced = await portfolio.secrets.updateValue({ secretId, value: newValue })
if (!replaced.ok) throw new Error(replaced.error.type)
// replaced.value contains only safe metadata, never the value or reference.
```

The internal [codec helpers](src/runtime/secrets.ts) also validate the supplied batch decoder. They capture distinct already-validated Secret IDs and exact references independently of callback-mutated request objects. Identical repeated pairs collapse; conflicting references for one ID violate an internal authoring invariant before callback invocation. Empty requests return an empty map without invoking the callback.

Decoder response data must have exactly the requested own enumerable string keys and primitive string/null values. Empty decoded strings succeed; null fails only that ID in an otherwise valid response. Malformed keys/values or a thrown/rejected response fail every requested ID without inspecting diagnostics. Internal results are keyed by ID with no repeated ID inside each Result; there is no public decode or reveal method. Symbols and nonenumerable properties are not record data keys, and inherited properties cannot satisfy requests. No decoded values are cached across operations.

Shutdown waits for an already-admitted encoder and its transaction to settle before cleanup, on both success and failure. Callbacks must not reenter operations or shutdown on the same owner.

## Project Assets and Secret usages

[Asset operation source](src/operations/projects/assets/index.ts) and [Secret usages](src/operations/secrets/usages.ts).

| Operation                | Input                    | Success value                                      | Specific failure beyond shared errors                                                |
| ------------------------ | ------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `projects.assets.create` | `{ projectId, spec }`    | Asset                                              | `not-found` for Project/Secret; `duplicate-asset-target` with the existing `assetId` |
| `projects.assets.find`   | `{ projectId, assetId }` | Asset                                              | `not-found` for Project/Asset                                                        |
| `projects.assets.list`   | `{ projectId }`          | All Project Assets, ID ascending                   | `not-found` for Project                                                              |
| `secrets.usages`         | `{ secretId }`           | All referring Assets across Projects, ID ascending | `not-found` for Secret                                                               |

Given a bound `portfolio` and existing same-Portfolio `projectId` and `secretId`:

```ts
const configured = await portfolio.projects.assets.create({
	projectId,
	spec: {
		type: 'repository',
		source: { provider: 'github', owner: 'Example', name: 'App', secretId },
	},
})
if (!configured.ok) throw new Error(configured.error.type)
const found = await portfolio.projects.assets.find({ projectId, assetId: configured.value.id })
const assets = await portfolio.projects.assets.list({ projectId })
const usages = await portfolio.secrets.usages({ secretId })
```

An Asset contains only `id`, `projectId`, nested `spec` and `created`; it has no title or expanded Secret. Creation validates the complete required Project and Secret, then every returned Project-scoped candidate before comparing owner/name case-insensitively. A same-Project duplicate is refused even when a different Secret is selected; a different Project may use the same target. Stored casing is preserved. An observed duplicate is rejected without a write, but concurrent duplicate prevention is not promised.

Repository owner/name are separate exact ASCII identifiers, not URLs or combined locators. Asset creation generates one ID and stamp and writes only the Asset. It never invokes codecs or GitHub; valid configuration is not proof of provider access, and the required explicit Secret has no anonymous fallback.

Asset find first requires the Project, validates the full Asset, then checks ownership. A valid Asset belonging to another Project returns `not-found` for the requested Asset without disclosing its owner. Asset list requires the Project even for an empty result. Usages requires the complete Secret before querying current nested Asset references; it returns full Assets, not copied reverse lists, IDs or counters. Secret value replacement preserves those references. These reads do not expand related records or verify live provider state.

Native scoped queries select the relevant rows; Core validates every returned row before sorting or use, and one malformed row fails the whole list. This is not a scan for corruption in unrelated rows excluded by the predicate. Lists are complete plain arrays without pagination or implicit limits. All four leaves use the existing whole-operation transaction and parsed Result boundary.

## Memory hierarchy and immutable revision reads

[Memory operation source](src/operations/memories/index.ts) and [Revision operation source](src/operations/memories/revisions/index.ts).

| Operation                 | Required input              | Success value                                 | Specific failure beyond shared errors   |
| ------------------------- | --------------------------- | --------------------------------------------- | --------------------------------------- |
| `memories.create`         | `{ parentId, title, body }` | `{ memory, revision }`, starting at version 1 | `not-found` for the parent Memory       |
| `memories.find`           | `{ memoryId }`              | Compact Memory                                | `not-found` for Memory                  |
| `memories.list`           | `{ parentId }`              | Roots or direct children, ID ascending        | `not-found` for a nonnull parent Memory |
| `memories.revisions.find` | `{ revisionId }`            | Exact full MemoryRevision                     | `not-found` for MemoryRevision          |
| `memories.revisions.list` | `{ memoryId }`              | Complete full history, version ascending      | `not-found` for Memory                  |

Given a bound `portfolio`:

```ts
const created = await portfolio.memories.create({ parentId: null, title: '  Notes  ', body: '  exact body\n' })
if (!created.ok) throw new Error(created.error.type)
const { memory, revision } = created.value
const roots = await portfolio.memories.list({ parentId: null })
const children = await portfolio.memories.list({ parentId: memory.id })
const snapshot = await portfolio.memories.revisions.find({ revisionId: revision.id })
const history = await portfolio.memories.revisions.list({ memoryId: memory.id })
```

`parentId` is always required: explicit null creates/lists roots; an ID creates/lists direct children of a required, fully validated same-Portfolio Memory. There is no omitted-root default, recursive listing, reparenting or copied child collection. Duplicate titles are allowed. Titles trim outer whitespace; bodies preserve exact primitive strings, including empty strings, whitespace and Unicode.

[Creation](src/operations/memories/create.ts) generates one Memory ID and one Revision ID, uses a separate explicit-ID slot for each native insert, and shares one invocation stamp across both records. The Memory stores only `id`, `parentId`, `revision: { id, version, title }` and original `created`; the full immutable Revision stores `id`, `memoryId`, `version`, `title`, `body` and `created`. Both inserts and complete Result validation stay inside one transaction. A failed second insert, malformed final pair or failed commit must not leave either record behind, subject to the adapter's actual rollback behavior.

Memory find/list return compact records without bodies or revision attribution. Exact Revision find needs only `revisionId`, queries that snapshot directly and never follows the latest head or requires a redundant Memory ID. Revision list requires the full valid Memory even when history is empty, and returns all selected full snapshots by version. Every selected row is validated before use or sorting; one malformed row fails the list. Returned data is detached from storage, not a live persistence entity. These operations perform no codec/provider calls or storage repair.

### Append an immutable revision

`memories.revisions.create({ memoryId, expectedVersion, title, body })` returns the committed `{ memory, revision }` pair. All four fields are required. Alongside shared failures it may return `not-found` for Memory, `revision-conflict` containing only `memoryId` and the submitted `expectedVersion`, or type-only `revision-version-exhausted`.

Keep the version associated with the body being edited, rather than substituting a newer summary version before submission:

```ts
const appended = await portfolio.memories.revisions.create({
	memoryId: memory.id,
	expectedVersion: revision.version,
	title: 'Updated notes',
	body: 'New full snapshot',
})
if (!appended.ok) throw new Error(appended.error.type)
// appended.value contains this invocation's committed head and full snapshot.
```

The [append handler](src/operations/memories/revisions/create.ts) validates the complete Memory, rejects a version mismatch, then rejects a matching maximum safe-integer version before allocating a successor or ID. It updates only the compact `revision` through native many-update with both ID and typed nested `revision.version` equality at the actual write.

The entire returned update list is validated: zero matches is a conflict, malformed or multiple matches are `invalid-storage-output`, and exactly one validated Memory permits the matching full Revision insert in the same transaction. The new snapshot shares the generated ID/version/title with the compact summary and carries the invocation's stamp. Parentage, original Memory creation and all earlier snapshots remain unchanged; identical content still creates a new revision. Failure rolls back the summary and new snapshot subject to actual adapter behavior; there is no automatic retry, latest-head refresh or returned `actualVersion`.

## Implemented validation

[Shared values](src/domain/commons.ts) validate primitive strings, lowercase ULIDs, safe integer versions/timestamps and attribution. Titles trim outer whitespace; bodies and protected/caller strings remain exact. Caller attribution defaults omitted `cid` to null, while stored Audit Stamps require explicit string/null `cid`. The operation runner prepares one stamp per invocation inside the transaction and reuses it across owned writes.

The model modules own the implemented shapes: [Project](src/domain/project.ts), [Asset](src/domain/asset.ts), [Secret](src/domain/secret.ts), [Memory](src/domain/memory.ts) and [MemoryRevision](src/domain/memory-revision.ts). Specs and revision summaries remain nested objects. Whole-record validation derives from the actual Equipped fields without applying create defaults; public Secret metadata explicitly selects its four safe field pipes. Parsing trims titles and strips undeclared fields without modifying the input or writing repairs to storage.

[Explicit-ID transport](src/storage/schema/index.ts) preserves Core's generated identity through native primary-key generation. A missing ID slot fails rather than generating a replacement; the initial Memory and Revision inserts each receive their own slot.

[Result and error contracts](src/errors.ts) parse envelopes through Valleyed and preserve its transformations and normal field stripping. Invalid-input issues retain safe schema-owned wording and present paths in order, without copying values or causes. Core-authored validators must use static paths and non-input-echoing messages; issue projection is not a sanitizer for arbitrary custom errors.

## Internal migration support

The [initial migration](src/storage/migrations/initial-foundation.ts) snapshots the five logical tables under the permanent ID `01m76d124c6e848k2hfvb4mar2`. It does not import current model schemas, flatten nested objects, or add foreign keys or unique indexes. Released IDs and definitions stay unchanged; new migrations append in ID order to the [catalog](src/storage/migrations/index.ts).

The internal [history classifier](src/storage/history.ts) validates the entire unknown ledger through the shared ID and safe-millisecond pipes before checking duplicates, unknown IDs and contiguous-prefix membership, in that order. It returns `empty`, `migration` or `ready`, or a type-only `schema-metadata-invalid` / `schema-version-unrecognized` error. Entry order and timestamp order do not determine progression; undeclared fields strip normally without input mutation or repair. Its catalog IDs are trusted internal authoring data, not a public input boundary.

## Dependencies and verification

Dependency declarations live in [package.json](package.json); shared resolutions are controlled by root [workspace overrides](../../pnpm-workspace.yaml).

From the repository root:

```sh
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm fallow:check
pnpm fallow:audit --base origin/main
```

Replace the example audit base with the intended comparison branch or commit; CI uses the PR target's commit.

The package test configuration disables Vite dotenv loading with `envDir: false`, and workspace policy rejects implicit dependency installation. Run direct checks without inherited credentials or preloads; this does not provide network or filesystem isolation.

See [domain context](../../docs/core/CONTEXT.md) for language and relationships, and individual [architectural decisions](../../docs/core/adr/) for the reasons behind the design.
