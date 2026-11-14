# Make schema transitions explicit and whole-run atomic

Accepted. Explicit setup and pending-suffix migration use one outer native session for schema/data/ledger changes and return a fresh ready view only after commit. See [package status](../../../libs/core/README.md#internal-migration-support).

Initialization and upgrading are separate user intents, and committing each successful migration would leave partial progress when a later step fails. Setup runs the full catalog on admitted empty storage and migration runs its pending suffix from a recognized nonempty prefix, each inside one outer transaction covering all schema/data changes and new ledger entries; only a committed complete run returns a ready client. Whole-run atomicity trades intermediate progress for an all-or-nothing invocation without automatic upgrade-on-open, implicit repair, reset, downgrade or legacy conversion.

History validation precedes state-specific refusals, even through stale capability objects. Deployments must arrange non-overlapping maintenance: native capabilities do not provide a cross-process shared/exclusive nonblocking guard, and rollback preserves pre-call state only when the adapter actually rolls back successfully.
