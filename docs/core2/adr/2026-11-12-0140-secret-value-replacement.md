# Rotate shared credentials without rebinding Assets

Accepted. Secret value replacement and stable Asset usages are implemented; overlapping-operation acceptance remains deferred. See [package usage](../../../libs/core2/README.md#secret-metadata-and-protection).

Renewing a shared credential should not recreate its identity or rewrite every Asset binding. Replace only the existing Secret's `valueRef` and `valueUpdated` atomically, with last successful commit winning rather than an expected-old-value/version guard, and encode/apply even identical submitted values. This preserves bindings and unrelated fields with less concurrency machinery, deliberately accepting stale-screen overwrites and repeated attribution rather than equality checks, credential decoding or automatic token revocation.

Sources: `rework/project-source.md`, Secret replacement; `rework/foundation-model-contract.md`, atomic owned-field writes.
