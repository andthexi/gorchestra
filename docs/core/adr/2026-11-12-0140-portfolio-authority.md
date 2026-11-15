# Keep Portfolio isolation separate from Consumer tenancy

Accepted. Core implements the dependency and single-Portfolio boundary; coherent storage isolation and authorization remain Consumer responsibilities. See [package usage](../../../libs/core/README.md#open-explicitly-initialize-and-close).

Core must remain portable across Consumers rather than inherit any application's tenancy, membership and authentication model. Consumers therefore own Portfolio registry, selection, authorization and backend configuration, while each Core instance operates one Portfolio whose application data, schema changes, native migration ledger and introspection share an isolated boundary; prefixes or a shared adapter object alone are insufficient. This keeps deployment-specific tenancy out of Core, at the cost of requiring Consumers to provision a coherent boundary rather than relying on a Core isolation detector or fallback namespace.

Portfolio containment, references and SDK namespaces do not make all records one aggregate: aggregate ownership governs consistency, not physical embedding, automatic cascades or a ban on cross-aggregate transactions.
