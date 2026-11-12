# @gorchestra/core2

Private ESM workspace package for the parallel Core foundation. The Server Consumer still uses `@gorchestra/core`; this package does not convert legacy stores or replace that API.

## Public surface

The package entry currently exports these types only:

- `Id` — a validated Core record identity.
- `AuditStamp` — local operation time and Consumer-supplied attribution.
- `Result<T, E>` — `{ ok: true; value: T } | { ok: false; error: E }`.
- `SharedOperationError` — the shared safe operation-error union.
- `Project`, `Asset`, `Secret`, `Memory` and `MemoryRevision` — plain records derived from their model schemas. `Secret` contains only safe metadata, never `valueRef` or raw values.

There are no public runtime values yet. The five internal model schemas and explicit-ID transport are implemented; lifecycle capabilities, migrations, Secret callbacks and Portfolio operations are not. Internal schemas and validators are not a supported Consumer API.

## Implemented validation

[Shared values](src/domain/commons.ts) validate primitive strings, lowercase ULIDs, safe integer versions/timestamps and attribution. Titles trim outer whitespace; bodies and protected/caller strings remain exact. Caller attribution defaults omitted `cid` to null, while stored Audit Stamps require explicit string/null `cid`. Operation-time stamp preparation remains unimplemented.

The model modules own the implemented shapes: [Project](src/domain/project.ts), [Asset](src/domain/asset.ts), [Secret](src/domain/secret.ts), [Memory](src/domain/memory.ts) and [MemoryRevision](src/domain/memory-revision.ts). Specs and revision summaries remain nested objects. Whole-record validation derives from the actual Equipped fields without applying create defaults; public Secret metadata explicitly selects its four safe field pipes. Parsing trims titles and strips undeclared fields without modifying the input or writing repairs to storage.

[Explicit-ID transport](src/storage/schema.ts) preserves the identity generated with Equipped `Instance.createId()` through native primary-key generation, which runs even when a row already supplies its ID. Native InMemory create/read tests exercise all five models and prove that a missing ID slot fails rather than generating a replacement. This is internal write support, not a public create operation.

[Result and error contracts](src/errors.ts) parse envelopes through Valleyed and preserve its transformations and normal field stripping. Invalid-input issues retain safe schema-owned wording and present paths in order, without copying values or causes. Core-authored validators must use static paths and non-input-echoing messages; issue projection is not a sanitizer for arbitrary custom errors.

## Dependencies and verification

Dependency declarations remain `latest`. Global `pnpm-workspace.yaml` overrides select Equipped `5.3.4` and Valleyed `4.5.24`; change versions centrally rather than in individual manifests.

From the repository root:

```sh
pnpm_config_verify_deps_before_run=error pnpm --filter @gorchestra/core2 test
pnpm_config_verify_deps_before_run=error pnpm exec tsc -b libs/core2 --pretty false
pnpm_config_verify_deps_before_run=error pnpm exec eslint 'libs/core2/**/*.ts'
pnpm_config_verify_deps_before_run=error pnpm exec prettier --check libs/core2
```

The standard test command can load dotenv through Vite. Use the [credential-free verification procedure](../../docs/core2/testing.md#credential-free-verification) for isolated checks; the [testing guide](../../docs/core2/testing.md) records coverage and outstanding qualification limits.

See [domain context](../../docs/core2/CONTEXT.md) for language and relationships, and individual [architectural decisions](../../docs/core2/adr/) for the reasons behind the design.
