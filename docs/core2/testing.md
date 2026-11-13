# Core testing

## Implemented boundary and scope

**Deferred dependency-blocked acceptance:** the Task 5 Core2 suite passed 193 tests, but an additional deterministic overlap probe fails: hold a missing-Project read, await a separate successful Project create, then let the first invocation roll back its not-found result. Equipped 5.3.6 InMemory restores the earlier whole-store snapshot and deletes the acknowledged creation. The same failure reproduces with native Repo/InMemory alone, without Core or patched native methods. [Equipped #148](https://github.com/andthexi/equipped/issues/148) is closed through merged [PR #178](https://github.com/andthexi/equipped/pull/178), which serializes root sessions and operations; the installed version predates that fix. The user authorized continuing unaffected tasks in draft while awaiting its release. Keep overlap acceptance open, adapt future barriers to serialized admission rather than deadlocking queued work, and do not count the known failing probe as passed. This is separate from the waived full legacy-suite rerun; no Core mutex or weakened rollback semantics is accepted.

The scoped suite exercises the public factory/setup/shutdown and attributed Portfolio's Project, Secret, Asset and Memory boundaries as well as the inherited primitive/model support. Inline tests cover shared primitives/errors, the five model schemas, `src/storage/schema.ts`, the native migration catalog, pure history classification, the operation runner and validated codec helpers. Coverage includes primitive-string rejection, exact IDs and text, required stored stamp fields, faithful safe issue projection, parsed Result envelopes, nested model shapes and Secret metadata projection. Model pipes reuse the actual schema fields, retaining input/output transformations without applying native create defaults.

Real Equipped InMemory create/read tests exercise all five models and logical table names, supplied-ID persistence, native omitted-ID generation through the explicit slot, and missing-slot failure without writes. Async slot tests cover independent awaits and enclosing-context restoration. These model/ID-transport checks are distinct from the domain-operation and codec tests below and do not qualify transaction isolation. Later Memory Revision append remains unimplemented; no provider, network, credentials, fake Repo or module-import mocks are used. Do not introduce dummy tests, discovery exclusions or `passWithNoTests`.

The immutable initial migration has literal table/field regression expectations independent of current schemas. Tests build the actual catalog with native `Migrator.from(repo, adapter).migrations(...).build()`, apply it to fresh InMemory storage, introspect all five logical tables with no foreign keys/indexes, validate the raw ledger and verify a repeated native run leaves it unchanged. Catalog IDs have focused developer assertions for validity, uniqueness and intended order, not another production validator.

History tests use test-owned multi-entry catalogs for empty/proper-prefix/complete and out-of-order membership. They reject malformed raw arrays/entries, nonprimitive or malformed IDs, invalid timestamps, duplicates, unknown IDs and gaps with type-only failures. Precedence is full-entry validation, duplicates, unknown IDs, then prefix coverage; extra keys strip without repairing input. Pure history tests alone do not prove lifecycle atomicity. The lifecycle tests below cover explicit setup and whole-suffix migration; overlapping-transaction isolation and physical-resolver qualification remain outstanding, and Equipped #148/#149 are not certified.

`src/portfolio-client/index.test.ts` exercises real native factory/setup/shutdown calls: dependency rejection before I/O, optional direct startup, no implicit DDL or codec/resolver preflight, ready reopening, metadata-only and CRUD-created nonempty storage, history-first refusals, stale setup views, safe startup/inspection/ledger errors, and awaited factory cleanup. Callable values that impersonate Valleyed's PipeError are rejected with static function issues before startup. Narrow instance-local native faults exercise DDL/history rollback, admission draining, joined/idempotent shutdown, failed cleanup retry, wrapped abort identity and observable unwind failure. Inner-session skip/swallow faults and invalid post-run ledgers cannot issue ready or commit partial setup; retained setup admission stays closed and shutdown works. Ordinary post-run read failure rolls back and permits explicit retry. All instance patches restore in `finally`; there are no fake Repos or module mocks.

The lifecycle module's inline tests use the module-local native catalog seam for proper-prefix classification and complete pending-suffix execution. They establish a real committed prefix and Project, then verify a later authored or declarative failure undoes the suffix's schema/data/ledger changes while preserving pre-existing rows, schema and ledger timestamps. No fixture migrations enter the released catalog, and no migration injection is exported. Tests cover no implicit upgrade during open, fresh ready issuance after commit, retained-view current refusal, history-first empty/container refusals, direct/wrapped/replaced/swallowed/skipped session behavior, incomplete post-run ledgers, ordinary I/O retry, commit waiting/rejection and admitted-migration draining. Callback-bearing mixed-entry error provenance is not inferred from native phase or message.

Public cleanup regressions exercise actual bound Project create/find/list and `as()` during pending cleanup, after a failed first cleanup and after an explicit successful retry. Admission stays closed throughout; shared handles join the same cleanup attempt without reconnecting. These checks do not establish independent overlapping-transaction isolation or online migration safety.

Pending-encoder cleanup regressions use real `secrets.create` with a deterministic callback gate. They verify the session remains active with no placeholder insert, shutdown closes binding and all new Secret calls immediately, callback success/failure settles the admitted transaction before one shared cleanup, and cleanup gates release in `finally`. This completes the codec-draining scenario deferred from the migration slice without adding a dummy operation.

`src/portfolio/index.test.ts` exercises synchronous attribution binding/copying, detached methods, closed admission, safe getter rejection and the absence of lifecycle controls or placeholder namespaces. `src/operations/projects/index.test.ts` uses the real public API for creation, exact field shape, find/missing, complete ID-ascending lists, malformed stored data, storage failures and no implicit child creation. Binding preserves exact caller strings; operation-time stamps and generated IDs are Core-owned.

Inline operation-runtime tests exercise normalization to a real shared-plus-specific error pipe, nested runtime binding, accepted-versus-parsed transforming pipes, input rejection before admission, Result stripping/validation inside the transaction, mutation rollback, safe handler failures, direct/wrapped versus foreign invocation aborts, skipped/swallowed sessions, commit waiting/rejection and shutdown draining. Narrow native instance faults are restored after each case. These are real runtime tests with ordinary TypeScript checking, not a separate type suite or a proof of concurrent rollback isolation.

`src/operations/secrets/index.test.ts` exercises exact raw-value/ID encoding, whitespace-only values/references, safe metadata keys, full stored-record validation before projection, complete sorted lists, detached methods and codec-free reads. Encoder malformed values/throws/rejections return safe failures without writes; input validation precedes callbacks/session. Native before/after-insert, returned-metadata and commit faults exercise rollback without asserting that an external protection store was rolled back. Getter-bearing faults are injected after native cloning where needed; direct safe-pipe tests establish undeclared getter non-evaluation, not an unsupported native row-shaping guarantee.

The same Secret boundary suite covers `updateValue`: missing/corrupt full records refuse before encoding, exact raw values retain their identity, and only `valueRef`/`valueUpdated` are written. A Date-only controllable test clock demonstrates repeated identical whitespace values still encode and stamp with the current bound attribution, without changing title/creation or arranged Asset references. Invalid input never opens a transaction. Codec, native read/write, null/malformed update output and commit failures preserve the old row; deterministic commit/rollback gates prove Results wait for settlement. Pending replacement encoders drain before shared shutdown on success and failure. Safe parsed metadata, no decode/create/retry, and explicit resubmission after ordinary failures are also covered. These tests do not claim rollback of external protection effects or overlapping transaction isolation.

`src/runtime/secrets.ts` contains runtime tests for batch decoding: captured IDs/references survive caller/callback mutation; identical repeats collapse, conflicting references reject before callback, and empty batches call nothing. Exact own enumerable string keys are validated before values and rechecked after parsing, including a changing-key proxy. Empty primitive strings succeed, null gives per-ID failure, and malformed keys/values or exceptions fail the whole captured batch without reading diagnostics. Internal failures do not repeat IDs and the helpers expose no public reveal/decoder endpoint. Synthetic response faults live in the dependency-free `src/testing/secret-codecs.ts` helper.

`src/operations/projects/assets/index.test.ts` covers real Project-scoped create/find/list, missing and corrupt prerequisites before writes, case-insensitive observed duplicates with unchanged casing, ownership refusal and full validation before decisions. A valid duplicate followed by a malformed candidate must fail validation rather than hide the later corruption. Exact ID/repository-input validation precedes transaction admission; native read/write/commit and malformed output faults keep safe error stages and rollback. Complete reverse-inserted lists verify scope and explicit ID order, while detached methods and closed admission use the real bound tree.

The Secret suite also covers `usages`: required full Secret validation before Asset reads, complete ID-sorted full Assets selected by native nested-reference equality, codec-free calls and unchanged references after value replacement. Invalid input, missing parents and selected malformed rows are refused; predicate-excluded unrelated rows are not a whole-store corruption audit. Neither these tests nor observed-duplicate rejection establish concurrent uniqueness or resolve the deferred Equipped overlap defect.

`src/operations/memories/index.test.ts` covers the native initial Memory/Revision pair, full parent validation, required nullable parentage, exact body/title/stamp behavior, compact detached records and complete ID-sorted roots/direct children. Foreign references, malformed inputs before admission, stored corruption before decisions, codec-free behavior and safe native errors are exercised through the public Portfolio. Two-write rollback cases fail before/after the second real `createMany`, corrupt either returned record or reject the session after handler work but before commit. Each root/child attempt captures both generated IDs; after restoring faults, exact Memory and Revision lookups must both be not-found and baseline lists/history unchanged. A missing-Memory history refusal alone is not evidence against orphan revisions.

`src/operations/memories/revisions/index.test.ts` covers exact immutable snapshot lookup without a Memory query or latest substitution, full stored validation and detached returned data. Coherent test-owned historical rows establish complete version-ascending histories without adding a Revision append API. A valid Memory is required even for empty history; missing and corrupt parents are distinct from empty results. Reverse-inserted fixtures cover 125 roots, 125 children and 125 revisions across the two suites. These sequential tests preserve the separate overlap/concurrency acceptance deferral.

Field-declaration regressions reject missing, empty, non-array, unknown-name, nonprimitive and sparse declarations before startup or cleanup. Minimal and reordered valid declarations retain their identity and permit native setup; the existing incompatible nonempty declaration test still fails through native builder validation, not a second Core catalog validator. A public runtime regression uses nongeneric lifecycle annotations through setup and shutdown. The owner's inline runtime test admits precisely typed dependencies into fixed-contract native construction, then uses real InMemory migrations and CRUD with an adapter-specific transforming configuration pipe to verify the resolver pairing. Ordinary TypeScript compilation checks these actual calls and the authored `Migration<StorageAdapter>` catalog; no catalog assertion or separate type-test fixtures are added.

The following policy applies only to `libs/core2`. Existing Core and Consumer suites retain their contracts. Read the [package status](../../libs/core2/README.md), [context](CONTEXT.md) and relevant [ADRs](adr/).

The adapter-selection runtime cases use two real InMemory subclasses with distinct required configuration inputs. Their consumer-side helper narrows the adapter union with an exhaustive switch before each public factory call, then exercises setup and shutdown for both branches. Ordinary compilation checks the branch-specific resolver types and nongeneric results. Union rejection is a static input policy, not a runtime check of an erased TypeScript union; explicit casts and already-erased subtype information are outside that guarantee.

## Task 0 verification record

Task 0 installed all workspace projects with pnpm 11.7.0 and lifecycle scripts disabled. Registry, root/recursive dependency lists and installed manifests were checked, including expanded deduplicated branches: only Equipped 5.3.4 and Valleyed 4.5.24 remained. A frozen script-free install left the pnpm-generated lockfile unchanged. Existing manifest declarations/categories stayed `latest`; unrelated resolved versions were preserved, with three deprecation metadata entries refreshed by pnpm. These are prior Task 0 results, not checks rerun by this documentation merge.

Installation is not full workspace runtime qualification. Nuxt preparation, lint and available scoped checks ran; root TypeScript reported existing-source optional-property mismatches and the new package's expected no-input diagnostic. Server vue-tsc exited 0 with an unresolved route-block plugin warning, not an unqualified pass. Full legacy runtime suites remained unqualified: a test-owned Server listener binds all interfaces through Equipped, and an old Core test can reach the AI SDK global provider. Unrestricted execution has not established an isolated-network boundary for those paths. No source repairs, downgrades or suppressions were added; Equipped #148/#149 are not certified by this gate.

The record above is historical. The later approved Server optional-token fixes resolved the workspace TypeScript errors. Full existing Core/Server suite reruns solely for the known Equipped `5.3.6` / Valleyed `4.5.25` updates were explicitly waived; their absence is no longer an acceptance blocker and is not reported as a test pass. New Core2 behavior tests, typechecking, lint/format and demonstrated dependency failures remain in scope.

## Selected runtime boundaries

- Test the public lifecycle and attribution-bound Portfolio behavior as the main integration boundary. Test small pure helpers directly in their owning modules using `if (import.meta.vitest)`.
- Place standalone boundary tests beside `<boundary>/index.ts` as `<boundary>/index.test.ts`. The folder supplies the name. Lifecycle tests are standalone; the primitive/helper and internal catalog-seam tests remain inline.
- Use a fresh real Equipped `InMemoryAdapter` per fixture. No fake Repo, imported-module mocks, persistent-backend matrix, credentials, network services, or provider calls. This does not certify persistent adapters or weaken the storage contract.
- Supply deterministic synthetic Secret encode/decode callbacks through the real dependency input. Test malformed results, nulls, throws/rejections and pending work without adding production fault hooks or a test-only public API. An explicit codec round-trip contract remains excluded.
- Follow one behavior RED–GREEN–REFACTOR cycle at a time. Keep meaningful fixture reuse; do not add one-use wrappers or public stubs for later operations.
- Use ordinary project TypeScript checking for real production and runtime-test source. No `expectTypeOf`, `tsd`, type-only suites, or positive/negative compile fixtures. Precise public types and runtime validation remain required.
- Keep schema/history checks at construction/setup/migrate, not ordinary operations. Lifecycle admission, ownership, revision checks, stored-read validation and whole-operation transactions remain requirements. Test upstream-dependent guarantees honestly; do not hide #148/#149 with wrappers, skips or downgrades.

## Commands

Install from the repository root using the package manager selected by `package.json`:

```sh
pnpm install --ignore-scripts
pnpm list equipped valleyed --depth Infinity --json
pnpm -r list equipped valleyed --depth Infinity --json
pnpm install --frozen-lockfile --ignore-scripts
```

Parse every direct/transitive occurrence in both list outputs: Equipped must resolve to `5.3.6` and Valleyed to `4.5.25`. Preserve `latest` declarations and unrelated workspace settings. A single successful import is not resolution evidence. The Task 0 record above describes the earlier versions, not the current override.

Normal scoped commands, from the repository root:

```sh
pnpm_config_verify_deps_before_run=error pnpm --filter @gorchestra/core2 test
pnpm_config_verify_deps_before_run=error pnpm exec tsc -b libs/core2 --pretty false
pnpm_config_verify_deps_before_run=error pnpm exec eslint 'libs/core2/**/*.ts'
pnpm_config_verify_deps_before_run=error pnpm exec prettier --check libs/core2 docs/core2
```

The exact lowercase environment setting prevents pnpm run/exec from implicitly installing dependencies. Format only owned changed paths. Root formatting is check-only. Keep applicable workspace typechecking/lint and focused regressions; the full existing Core/Server dependency-update suite reruns were waived as noted above. Classify demonstrated upgrade regressions separately from pre-existing failures and missing generated/native tooling. Existing source repairs need separate authorization. Run TypeScript and ESLint sequentially with memory headroom: concurrent runs previously exhausted this host's memory, while measured sequential runs completed.

## Credential-free verification

Tool configuration is executable code. Review test imports and Nuxt configuration before running; the flags below prevent framework dotenv loading, not arbitrary file reads in application code. Use a clean environment without inherited credentials or preloads. Do not start Server/provider processes or read `.env`, `.trowel/`, or credential files.

After the intentional script-free install, invoke linked binaries directly when decomposing checks. In each package directory, the public Vitest API accepts Vite overrides as its fourth argument:

```sh
node --input-type=module -e '
import { startVitest } from "vitest/node";
await startVitest("test", [], { run: true, config: "vitest.config.ts" }, { envDir: false });
'
```

This runs the actual package configuration, preserving failure/no-test status, without Vite's implicit dotenv reads. Run and report each package separately; the new foundation package has real lifecycle/setup/cleanup, primitive, model, ID-transport, catalog and history tests. Do not equate them with full legacy-suite qualification.

The Server tsconfig requires generated `.nuxt/tsconfig.json`, absent after `--ignore-scripts`. On Linux, the supported Nuxt CLI `--dotenv=/dev/null` option redirects the dotenv filename; **do not use `--no-dotenv`**, which can fall back to `.env`. Disable telemetry and review the installed CLI/c12 behavior before using it:

```sh
NUXT_TELEMETRY_DISABLED=1 NODE_ENV=production node consumers/server/node_modules/nuxt/bin/nuxt.mjs prepare --cwd=consumers/server --dotenv=/dev/null
node node_modules/typescript/bin/tsc -b --pretty false
(cd consumers/server && node node_modules/vue-tsc/bin/vue-tsc.js --noEmit)
```

Run these from the repository root in the clean environment. This is a decomposed typecheck, not a claim that bare `pnpm typecheck` was run: that script invokes Nuxt again without the dotenv option. Preparation generates types; it does not launch the application. Missing native tooling after script-free installation is a real prerequisite failure, not permission for blanket rebuilds or legacy-source edits. No production verification wrapper is introduced.
