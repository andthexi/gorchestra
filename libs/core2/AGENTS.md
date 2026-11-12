# Core package DOX

## Ownership and status

- This private package is `@gorchestra/core2` at `libs/core2`, developed alongside the Consumer-used `@gorchestra/core`. Tested primitives, five model schemas, safe schema-derived public types and internal explicit-ID transport are implemented. Migrations, lifecycle and Portfolio operations remain unimplemented; the package entry still exports types only.
- Use unnumbered Core/domain identifiers such as `CoreDependencies`, `PortfolioClient` and `Portfolio`. The numeric suffix is only a package/path disambiguator.
- Read [package status](README.md), [domain context](../../docs/core2/CONTEXT.md), [ADRs](../../docs/core2/adr/), and [testing guidance](../../docs/core2/testing.md) before implementing a slice.

## Local contracts

- Do not import implementation from `libs/core`, `@gorchestra/core`, or ignored `rework/`. Do not switch Consumers, convert legacy data, or add compatibility shims.
- Keep dependency declarations as `latest`. Global `pnpm-workspace.yaml` overrides own the exact Equipped `5.3.4` and Valleyed `4.5.24` resolution, including transitive installs. Do not add package-specific exceptions or local dependency paths.
- Model modules own Equipped schemas; derive record pipes and types from those fields. Keep Secret storage references out of public metadata. Return parsed Results and safe failures without leaking raw values, references, causes or diagnostics.
- Reuse `storage/schema.ts` for schema-derived validation and invocation-local explicit IDs. Native primary-key generation requires the slot even when create input includes an ID. Stored validation must not apply create defaults or caller-attribution defaults; keep nested fields intact and select public Secret fields explicitly.
- Keep lifecycle constructors non-public and return only established state-specific capabilities. One private owner retains storage/admission/cleanup; Consumers receive attribution-bound domain operations without lifecycle controls.
- Keep the native Repo visible inside operations, not behind a recursive facade. Validate input before storage/callbacks, validate stored reads before use, and validate the complete Result inside one wrapper-owned transaction before commit.
- Setup and migration are explicit, atomic whole-run operations. Schema/history checks occur at construction/setup/migrate, not ordinary domain calls. Preserve ownership/revision validation and closed-admission guards without implicit repair, polling, retry or fallback.
- Export declarations only when another module or the public surface needs them. Do not expose raw definitions, Repo, migration injection, test hooks or internal constructors through the package entry.
- Use `<boundary>/index.ts` with neighboring `<boundary>/index.test.ts`; operation namespace indexes compose actual leaves. Keep small pure-helper runtime tests in their owning modules with `if (import.meta.vitest)`. Do not create empty public namespaces or duplicate a hand-maintained operation type registry.
- Keep current package/context/testing documentation synchronized with each implemented slice. ADR acceptance is separate from implementation status. Expedition, Blueprint, Delivery, runtime integration and Consumer cutover remain outside this foundation implementation.

## Verification

- Follow test-first vertical behavior slices at lifecycle/Portfolio boundaries, with smaller direct runtime tests for pure helpers. Use real Equipped InMemoryAdapter and deterministic synthetic Secret callbacks. No module-import mocks, fake Repo, persistent-backend qualification matrix or production failure-injection options.
- Use ordinary TypeScript compilation of production/runtime-test source. No dedicated type tests, negative-compile fixtures, `expectTypeOf`, or `tsd`. This is the root's explicitly selected scoped test policy, not a waiver of precise public types or runtime validation.
- Run the package runtime suite, `tsc -b libs/core2`, scoped ESLint/Prettier and applicable workspace regression checks using the credential-free commands in the [testing guide](../../docs/core2/testing.md). Disable framework dotenv loading; do not read `.env` or credentials, call real providers, or claim partial suites are full verification.
- Task 1's real primitive suite resolves the prior configuration-only missing-source/no-tests gap. Later slices must implement and test actual behavior; do not add stubs, dummy tests, `passWithNoTests`, or Fallow suppressions to conceal gaps.
- Report actual dependency-backed guarantees. A reproduced Equipped isolation/mapping failure is a blocker, not permission for a Core serialization/wrapper workaround, a skipped passing claim, or a silent downgrade.
