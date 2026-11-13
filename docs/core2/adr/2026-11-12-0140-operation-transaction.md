# Commit only a validated complete operation

Accepted. The shared operation runner and Project/Secret/Asset operations implement input/Result validation, whole-handler transactions and invocation-local rollback, including awaited Secret encoding and Asset prerequisite reads. Multi-record domain writes remain later work; see [package usage](../../../libs/core2/README.md#project-assets-and-secret-usages).

Returning a failure value from an Equipped session does not abort it, and validation after commit cannot undo writes. Every domain operation therefore parses input before execution, runs its complete handler—including callbacks and provider awaits—in one transaction, validates and returns the parsed Result, and commits only success; failures abort using a private invocation-specific signal recognized by exact identity, including supported Equipped session wrapping. The uniform boundary replaces phased execution and early credential-read transaction release, accepting longer-held locks in exchange for one local commit boundary.

Final validation is deliberately shape-only with ordinary Valleyed field stripping, not a second relational consistency checker; handlers must maintain and test cross-record invariants. Database rollback cannot reverse external effects, and an observable rollback/cleanup failure takes precedence over the retained safe failure Result.

Sources: `rework/sdk-handler-tree.md`, whole-handler transaction and rollback transport; `rework/foundation-model-contract.md`, output validation and supported abort wrapping.
