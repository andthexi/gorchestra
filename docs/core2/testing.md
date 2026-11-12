# Core testing

## Configuration gate and scope

Task 0 contains only package/configuration wiring and repository-wide dependency alignment. There is no `src/` implementation or runtime suite yet. A no-input TypeScript diagnostic and a no-tests Vitest exit are expected **interim failures**, not successful compilation or behavioral verification. Task 1 must supply actual tested source. Do not use dummy source, artificial tests, discovery exclusions or `passWithNoTests` to manufacture success.

The following policy applies only to `libs/core2`. Existing Core and Consumer suites retain their contracts. Read the [package status](../../libs/core2/README.md), [context](CONTEXT.md), [contract reference](contracts.md#internal-definition-and-verification-boundary), and [ADR index](adr/README.md).

## Task 0 verification record

Task 0 installed all workspace projects with pnpm 11.7.0 and lifecycle scripts disabled. Registry, root/recursive dependency lists and installed manifests were checked, including expanded deduplicated branches: only Equipped 5.3.4 and Valleyed 4.5.24 remained. A frozen script-free install left the pnpm-generated lockfile unchanged. Existing manifest declarations/categories stayed `latest`; unrelated resolved versions were preserved, with three deprecation metadata entries refreshed by pnpm. These are prior Task 0 results, not checks rerun by this documentation merge.

Installation is not full workspace runtime qualification. Nuxt preparation, lint and available scoped checks ran; root TypeScript reported existing-source optional-property mismatches and the new package's expected no-input diagnostic. Server vue-tsc exited 0 with an unresolved route-block plugin warning, not an unqualified pass. Full legacy runtime suites remained unqualified: a test-owned Server listener binds all interfaces through Equipped, and an old Core test can reach the AI SDK global provider. Unrestricted execution has not established an isolated-network boundary for those paths. No source repairs, downgrades or suppressions were added; Equipped #148/#149 are not certified by this gate.

## Selected runtime boundaries

- Test the public lifecycle and attribution-bound Portfolio behavior as the main integration boundary. Test small pure helpers directly in their owning modules using `if (import.meta.vitest)`.
- Place standalone boundary tests beside `<boundary>/index.ts` as `<boundary>/index.test.ts`. The folder supplies the name. These paths are conventions for later slices, not existing tests.
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

Parse every direct/transitive occurrence in both list outputs: Equipped must resolve to `5.3.4` and Valleyed to `4.5.24`. Preserve `latest` declarations and unrelated workspace settings. A single successful import is not resolution evidence.

Normal scoped commands, from the repository root:

```sh
pnpm_config_verify_deps_before_run=error pnpm --filter @gorchestra/core2 test
pnpm_config_verify_deps_before_run=error pnpm exec tsc -b libs/core2 --pretty false
pnpm_config_verify_deps_before_run=error pnpm exec eslint 'libs/core2/**/*.ts'
pnpm_config_verify_deps_before_run=error pnpm exec prettier --check libs/core2 docs/core2
```

The exact lowercase environment setting prevents pnpm run/exec from implicitly installing dependencies. Format only owned changed paths. Root formatting is check-only. Existing workspace checks remain required because the dependency overrides are repository-wide; classify upgrade regressions separately from pre-existing failures and missing generated/native tooling. Existing source repairs need separate authorization.

## Credential-free verification

Tool configuration is executable code. Review test imports and Nuxt configuration before running; the flags below prevent framework dotenv loading, not arbitrary file reads in application code. Use a clean environment without inherited credentials or preloads. Do not start Server/provider processes or read `.env`, `.trowel/`, or credential files.

After the intentional script-free install, invoke linked binaries directly when decomposing checks. In each package directory, the public Vitest API accepts Vite overrides as its fourth argument:

```sh
node --input-type=module -e '
import { startVitest } from "vitest/node";
await startVitest("test", [], { run: true, config: "vitest.config.ts" }, { envDir: false });
'
```

This runs the actual package configuration, preserving failure/no-test status, without Vite's implicit dotenv reads. Run and report each package separately, including the empty foundation package.

The Server tsconfig requires generated `.nuxt/tsconfig.json`, absent after `--ignore-scripts`. On Linux, the supported Nuxt CLI `--dotenv=/dev/null` option redirects the dotenv filename; **do not use `--no-dotenv`**, which can fall back to `.env`. Disable telemetry and review the installed CLI/c12 behavior before using it:

```sh
NUXT_TELEMETRY_DISABLED=1 NODE_ENV=production node consumers/server/node_modules/nuxt/bin/nuxt.mjs prepare --cwd=consumers/server --dotenv=/dev/null
node node_modules/typescript/bin/tsc -b --pretty false
(cd consumers/server && node node_modules/vue-tsc/bin/vue-tsc.js --noEmit)
```

Run these from the repository root in the clean environment. This is a decomposed typecheck, not a claim that bare `pnpm typecheck` was run: that script invokes Nuxt again without the dotenv option. Preparation generates types; it does not launch the application. Missing native tooling after script-free installation is a real prerequisite failure, not permission for blanket rebuilds or legacy-source edits. No production verification wrapper is introduced.
