# Grant state-specific lifecycle capabilities

Accepted; **unimplemented** in this documentation-only snapshot.

An unrestricted manager can only reject setup, migration and domain calls at runtime, and a readiness check cannot grant a capability across an await. `PortfolioClient.new` therefore asynchronously acquires one Core-owned storage lifetime and returns a state-specific `PortfolioSetup`, `PortfolioMigration` or ready `PortfolioClient`; explicit successful transitions return a fresh ready view over that same owner instead of mutating a discriminant that callers may already have narrowed. This replaces the unrestricted manager, separate connection/status steps and per-operation or borrowed lifetimes, preventing locally invalid typed combinations without claiming linear ownership or compile-time safety for stale aliases.

Bootstrap retains the lifecycle handle and gives application code an immutable attribution-bound `Portfolio`, not shutdown or rebinding authority. Shutdown closes shared admission, drains admitted work, and joins cleanup; observable cleanup failure leaves admission closed and only a later explicit shutdown retries cleanup. Retained transition views recheck authoritative history, and ordinary calls still enforce runtime admission and domain guards.

Sources: `rework/foundation-model-contract.md`, SDK classes and shutdown; `rework/consumer-api-safety-audit.md`, capability refinement; `rework/sdk-handler-tree.md`, bound attribution.
