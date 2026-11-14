# Use Equipped as Core's storage foundation

Accepted.

Core uses Equipped's typed schemas, capability-aware Repo and adapter-backed transactions, migration runner, locking, ledger and introspection rather than maintaining a second persistence abstraction or migration engine, keeping domain records and storage operations on one typed model while letting Consumers supply the backend.

This couples Core to Equipped's APIs and the selected adapter's supported behavior: transaction atomicity, isolation and durability come from that backend, not from Core reimplementing them, and neither an installed dependency nor InMemory tests certify another adapter or make external effects transactional.

Core still owns [input and stored-data validation](2026-11-12-0140-native-stored-reads.md), [operation boundaries and Result-to-abort handling](2026-11-12-0140-operation-transaction.md), [explicit lifecycle and shutdown admission](2026-11-12-0140-portfolio-lifecycle.md), [catalog/history policy](2026-11-12-0140-migration-catalog.md) and domain rules such as Revision version checks; Consumers own [Portfolio isolation, authorization and maintenance](2026-11-12-0140-portfolio-authority.md) and [Secret protection](2026-11-12-0140-secret-protection.md).
