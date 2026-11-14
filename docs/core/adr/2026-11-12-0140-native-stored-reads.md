# Use native Repo with explicit validation

Accepted. Project, Secret, Asset and Memory/Revision handlers use native Repo with shared storage-call classification and schema-derived stored-read validation; protected fields and required parent/ownership records are validated before use. See [package usage](../../../libs/core/README.md#memory-hierarchy-and-immutable-revision-reads).

Persisted fields are not automatically revalidated by Equipped, and final output validation is too late once a handler has used corrupt data to make an ownership decision or external call. Supply native Repo directly to internal handlers with explicit shared schema-derived read/error helpers, rather than build a recursive guarded Repo/builder facade or a second flattened persistence representation. Model modules own the schemas; stored-record validation derives from those fields without applying create defaults. This keeps one model-owned schema and the native storage API, accepting authoring discipline instead of claiming runtime sandboxing or revocation of escaped builders.

Validate relevant stored records before decisions/effects and fail a malformed list rather than skip or repair members. Handlers must stay within the wrapper's transaction, await their work, and never use raw SQL, independent commits or escaped contexts; review and tests enforce these restrictions, not absent native methods.
