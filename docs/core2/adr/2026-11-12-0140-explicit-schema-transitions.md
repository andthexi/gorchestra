# Make schema transitions explicit and whole-run atomic

Accepted. Explicit setup uses one outer native session with tested schema/ledger rollback and fresh ready issuance. Upgrade execution and comprehensive whole-upgrade qualification remain unimplemented; see [package status](../../../libs/core2/README.md#internal-migration-support).

Initialization and upgrading are separate user intents, and committing each successful migration would leave partial progress when a later step fails. Setup runs the full catalog on admitted empty storage and migration runs its pending suffix from a recognized nonempty prefix, each inside one outer transaction covering all schema/data changes and new ledger entries; only a committed complete run returns a ready client. This replaces automatic upgrade-on-open and per-version commits, trading intermediate progress for an all-or-nothing invocation without implicit repair, reset, downgrade or legacy conversion.

History validation precedes state-specific refusals, even through stale capability objects. Deployments must arrange non-overlapping maintenance: native capabilities do not provide the previously proposed cross-process shared/exclusive nonblocking guard, and rollback preserves pre-call state only when the adapter actually rolls back successfully.

Sources: `rework/foundation-model-contract.md`, whole-run atomicity and history-first lifecycle checks; `rework/equipped-migration-capabilities.md`, transaction composition.
