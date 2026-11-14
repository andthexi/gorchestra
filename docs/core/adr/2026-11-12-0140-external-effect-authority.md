# Separate external-effect intent, approval and receipt

Accepted; **unimplemented**. Expedition, runtime and downstream work remain paused.

Make Operation an independent aggregate owning a proposed external effect and scope, its exact-scope Approval, and effect-specific execution evidence/Receipts; it references the requesting domain work rather than owning it or placing this authority inside that work’s aggregate. This keeps exact intent, permission and observed outcome under one distinct authority, accepting cross-aggregate coordination with the requesting work, whose domain gates still govern whether the effect may be requested or applied. Blueprint acceptance, review and runtime completion do not grant effect permission; changed content cannot reuse approval, and observed success requires external read-back rather than conflating intent, authorization and outcome.

Operation is not every SDK call or runtime submission; a Receipt proves an observation, not retroactive authorization.
