# Derive discovery views from Expedition-owned facts

Accepted; **unimplemented** in this documentation-only snapshot. Expedition, runtime and downstream work remain paused.

Maintaining a separately edited Map or stored Frontier would create competing authoritative representations of the same discovery. Expedition instead owns Questions, Findings, Decisions, context versions and Blueprints; Map assembles the applicable facts and Frontier derives open, unblocked, unclaimed Questions. Context changes create complete immutable bundle versions rather than field patches, whole-Map replacements or audit-diff reconstruction, keeping historical context readable without copying discovery collections.

Evidence stays immutable with its citing content rather than becoming a separate registry or full-source archive. It records concrete support distinct from producer provenance, but neither a stored citation nor human acceptance certifies truth or future source availability.

Sources: `rework/aggregate-ownership.md`, Expedition ownership and derived views; `rework/expedition-discovery.md`, context replacement and Evidence.
