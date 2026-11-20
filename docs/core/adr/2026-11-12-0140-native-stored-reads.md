# Use native Repo with explicit validation

See [operation boundaries](../BOUNDARIES.md) for the owning contract.

Persisted fields are not automatically revalidated by Equipped, and validation must precede any ownership decision or external call that uses them. Supply native Repo directly to internal handlers with explicit shared schema-derived read/error helpers, rather than build a recursive guarded Repo/builder facade or a second flattened persistence representation. Validate storage-returned data on both reads and writes before using it or including it in a response; model modules own the schemas, and stored-record validation derives from those fields without applying create defaults. This keeps one model-owned schema and the native storage API, accepting authoring discipline instead of claiming runtime sandboxing or revocation of escaped builders.

Validate relevant stored records before decisions/effects and fail a malformed list rather than skip or repair members. Handlers must respect their [transaction boundaries](2026-11-12-0140-operation-transaction.md), await their work, and never use raw SQL or let storage work escape its admitted scope; review and tests enforce these restrictions, not absent native methods. Removal of the automatic whole-handler transaction does not permit commits that split a required atomic domain change.

Core-authored responses are trusted compositions of validated data, not another external input. Construct public projections explicitly, especially metadata-only Secret responses, rather than relying on final pipe validation to strip protected fields. Public Result and error pipes describe the Consumer boundary; Consumer validation cannot substitute for Core's own confidentiality guarantees.
