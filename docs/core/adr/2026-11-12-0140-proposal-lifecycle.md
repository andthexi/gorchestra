# Separate stored proposals from human acceptance

Accepted; **unimplemented**. Expedition, runtime and downstream work remain paused.

An agent can propose work but cannot supply its own authority or substitute content for what a human reviewed. Tools therefore save immutable unaccepted versions in a trusted Consumer-bound AgentInteraction and return immediately; separate human acceptance loads the exact current stored proposal and applies domain changes, instead of holding a transaction across review, accepting a replacement payload or deriving approval from chat. Only the latest eligible version can be accepted, rejection never revives an older version, and accepted history cannot be rewritten by later runtime observations.

Consumer binding selects the interaction and Core derives its target; model arguments cannot choose arbitrary actor, approval or target IDs. AgentInteraction owns integration state, not transcripts or target facts, so runtime termination is not domain completion and acceptance may precede it; repeated acceptance returns an already-accepted error rather than replayed success. Human proposal acceptance and embedded Evidence supply discovery review without a parallel Artifact/Review layer, while relevant domain/provenance gates—not every unrelated Map change—control staleness.
