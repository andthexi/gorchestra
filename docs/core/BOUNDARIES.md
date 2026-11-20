# Core operation boundaries

Core owns domain invariants, external-data validation and explicit atomic changes. Consumers own deployment-wide maintenance coordination. The [transaction ADR](adr/2026-11-12-0140-operation-transaction.md) and [lifecycle ADR](adr/2026-11-12-0140-portfolio-lifecycle.md) explain the tradeoffs.

## Transactions

The shared runner does not automatically wrap operation handlers in transactions. Handlers explicitly use a shared transaction helper around work that must commit together. A failed Result or exception aborts that transaction; the helper does not parse Core-authored Results.

Memory creation groups the Memory and first Revision. Revision append groups the immutable revision and conditional head update. Setup and migration retain whole-run atomicity; Snapshot import retains atomic replacement. External calls do not imply rollback of prior database commits, and database rollback cannot undo external effects. Observable rollback/cleanup failure takes precedence over a retained safe failure.

Local lifecycle admission and shutdown draining remain in Core. Transactions, authoritative domain guards and backend-internal transaction locks are distinct from maintenance coordination and remain required.

## Validation and public responses

Validate incoming external data with Valleyed before use: Consumer inputs, storage reads and write responses, provider/harness responses and imported payloads. Model-owned schemas supply stored-data validation without create-time defaults. Malformed external data must not influence authority decisions or be passed through as a trusted response.

Adapters return ordinary success values and throw or reject on failure; they do not return Core Results. Core validates their responses, catches synchronous throws and asynchronous rejections, and constructs its own safe Result without exposing raw adapter diagnostics.

Core trusts typed Results it constructs from validated data rather than runtime-parsing them again in the runner or transaction helper. Construct the public representation and safe errors explicitly. Output-pipe transforms and field stripping are not response-construction mechanisms. Secret responses contain metadata only; Consumer validation cannot prevent a leak that already crossed the boundary.

## Public contracts

A standalone contracts tree mirrors public operation namespaces and provides complete Result and error pipes without opening a Portfolio. Coverage includes domain operations, opening, setup, migration, attribution binding, shutdown and Snapshot export/import. Error unions include shared errors as well as operation-specific errors. Contracts expose no internal handlers, storage resources or protected schemas.

Success pipes for live Portfolio/lifecycle handles validate the expected instances in-process, preserving exact identity without cloning, method calls or I/O. They do not reconstruct capabilities from JSON or certify that an instance remains open or usable later.

Verify actual returned values against these contracts in behavior tests, including safe Secret projection, malformed external returns, handle identity and plain-object lookalike rejection. Use ordinary TypeScript and the real Equipped InMemoryAdapter.

## Maintenance

Consumers serialize maintenance actions across all clients sharing a Portfolio. They prevent new ordinary access and client opening, drain whole in-flight operations, and keep access paused until maintenance settles. This covers pending harness calls and their later database continuations as well as new interaction-bound Core tool calls; it does not require closing harness sessions. Migration requires stopping existing clients and reopening compatible clients afterward.

Core does not acquire explicit maintenance-coordination locks around opening, ordinary operations, setup, migration, export or import, and does not require the corresponding adapter lock capability. There is no local-lock substitute, optional-lock fallback, queue or automatic recovery. Core does not promise protection against a Consumer violating the maintenance protocol.

Native history is checked at opening and explicit setup/migration, not on ordinary domain operations. Snapshot-specific compatibility checks remain. Domain ownership/revision guards, external-boundary validation, Secret protection, explicit transaction atomicity and local shutdown admission remain independent requirements.

Possible Core-managed maintenance coordination is tracked in [future work](FUTURE.md#core-managed-maintenance-coordination).
