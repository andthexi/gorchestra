# Rotate shared credentials without rebinding Assets

Accepted. Secret value replacement and stable Asset usages are implemented. See [package usage](../../../libs/core/README.md#secret-metadata-and-protection) for replacement semantics and [verification scope](../../../libs/core/README.md#dependencies-and-verification).

Renewing a shared credential should not recreate its identity or rewrite every Asset binding. Core protects the exact new nonempty value under the existing Secret and Portfolio protection identities, writes only the schema-owned `value` union and `valueUpdated` stamp atomically, and applies even identical submitted values with fresh encrypted nonces.
