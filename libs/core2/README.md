# @gorchestra/core2

Private ESM workspace package for the parallel Core foundation. The Server Consumer still uses `@gorchestra/core`; this package does not convert legacy stores or replace that API.

## Public surface

The package entry currently exports these types only:

- `Id` — a validated Core record identity.
- `AuditStamp` — local operation time and Consumer-supplied attribution.
- `Result<T, E>` — `{ ok: true; value: T } | { ok: false; error: E }`.
- `SharedOperationError` — the shared safe operation-error union.

There are no public runtime values yet. Models, storage schemas, lifecycle capabilities, Secret callbacks and Portfolio operations are not implemented. Internal validators are not a supported Consumer schema API.

## Implemented validation

[Shared values](src/domain/commons.ts) validate primitive strings, lowercase ULIDs, safe integer versions/timestamps and attribution. Titles trim outer whitespace; bodies and protected/caller strings remain exact. Caller attribution defaults omitted `cid` to null, while stored Audit Stamps require explicit string/null `cid`. Operation-time identity and stamp generation are not implemented.

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
