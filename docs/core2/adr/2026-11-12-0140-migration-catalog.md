# Use the native migration ledger

Accepted; **unimplemented** in this documentation-only snapshot.

A separate Core version marker or last-version-only tracker would duplicate Equipped's migration authority and require conversion or another runner. Use the native `id`/`appliedAt` ledger with an immutable, append-only catalog of author-time ULID migrations, and classify raw history by exact catalog membership and contiguous-prefix coverage rather than a maximum ID, timestamp order or `Migrator.status` projection. This preserves every released upgrade path without a second schema-version counter, but makes released IDs and changes permanent and requires rejecting malformed, duplicate, gapped or unknown history rather than repairing it.

Empty history does not prove empty application storage: inspect the same isolated boundary before granting setup, including empty application containers. Native empty-ledger initialization during classification is the sole bookkeeping exception to an otherwise non-migrating factory; it grants no permission to create application schema or mark migrations applied. Use the ordinary native builder and its validation, not a bypass or second Core catalog runner.

Sources: `rework/foundation-model-contract.md`, ledger adoption, immutable catalog and history classification; `rework/equipped-migration-capabilities.md`, native capabilities.
