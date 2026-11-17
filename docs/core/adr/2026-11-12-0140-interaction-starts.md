# Persist interaction starts before contacting the harness

Accepted architecture. Delivery scope and deferred recovery work are owned by [FUTURE.md](../FUTURE.md#agentinteraction-infrastructure).

Local rollback cannot undo a remote harness session. Commit the interaction and launch intent before contacting the harness, then atomically record successful startup and its session association in a separate transaction. A failed or uncertain call leaves the saved interaction unstarted and its target/purpose reservation intact rather than claiming an all-or-nothing launch or silently replacing the session.

Core infers tools from the interaction's purpose rather than persisting a separate tool list. The harness may execute before acknowledgment is stored; permitting scoped context reads in that window avoids discarding useful work without treating a tool call as startup confirmation or domain progression. Startup confirmation records the association, not the harness's current execution state; completion ends bound Core authority without deleting the session or transcript.

The Consumer integration owns duplicate prevention; Core does not add deduplication or an exactly-once external-effects guarantee. No transaction or database lock spans the harness call. Retry, repair and abandonment are not part of this architecture's initial delivery; their disposition and revisit criteria live in [deferred decisions](../FUTURE.md#deferred-decisions), not an implicit recovery protocol.
