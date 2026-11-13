# Use native Repo with explicit validation

Accepted. Project, Secret and Asset handlers use native Repo with shared storage-call classification and schema-derived stored-read validation; protected fields and ownership prerequisites are validated before use. Memory operations remain pending; see [package usage](../../../libs/core2/README.md#project-assets-and-secret-usages).

Persisted fields are not automatically revalidated by Equipped, and final output validation is too late once a handler has used corrupt data to make an ownership decision or external call. Supply native Repo directly to internal handlers with explicit shared schema-derived read/error helpers, rather than build the previously proposed recursive guarded Repo/builder facade or a second flattened persistence representation. This keeps one model-owned schema and the native storage API, accepting authoring discipline instead of claiming runtime sandboxing or revocation of escaped builders.

Validate relevant stored records before decisions/effects and fail a malformed list rather than skip or repair members. Handlers must stay within the wrapper's transaction, await their work, and never use raw SQL, independent commits or escaped contexts; review and tests enforce these restrictions, not absent native methods.

Sources: `rework/foundation-model-contract.md`, revised direct Repo integration; `rework/sdk-handler-tree.md`, storage authoring rules; accepted Core Foundation Implementation Plan, model schema ownership.
