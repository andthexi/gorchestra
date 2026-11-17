# Core future work

This is the owning register for Core's future plans, deferred decisions and post-MVP improvements. It is not an implementation claim or authorization to create, execute or ship a Change. Current usage lives in the [package README](../../libs/core/README.md); [context](CONTEXT.md) owns domain language, and ADRs retain architectural rationale.

## Planned work

### Foundation boundaries

**Disposition:** Approved delivery scope in [Change #66](https://github.com/andthexi/gorchestra/issues/66); consult its Slices for live progress. Do not infer completion from this plan.

**Why:** Separate domain atomicity, external-boundary validation and Consumer maintenance responsibilities instead of imposing a blanket runtime boundary.

- Remove automatic whole-handler transactions from the shared operation runner, not only for interaction startup. Handlers explicitly call a shared transaction helper around work that must commit together; the helper aborts its transaction on a failed Result or exception without parsing Core-authored Results. This accepted change is unimplemented; preserve required domain atomicity, external-boundary validation, storage admission and safe errors rather than treating wrapper removal as permission for partial atomic updates. Do not infer rollback of previously committed phases from a later failure Result.
- Validate data entering Core from external boundaries through Valleyed, including Consumer inputs, storage reads and write-returned data, harness/provider responses and imported payloads. Trust typed Results assembled inside Core from validated data rather than revalidating them in the runner or transaction helper. Construct the declared public values and safe errors explicitly; do not rely on final output parsing for transformations, field stripping or Secret protection. Expose public operation Result and error pipes for Consumer-side validation without exposing internal handlers or storage schemas. This accepted boundary-only validation design is unimplemented; behavior tests must verify returned values conform to the public contracts.
- Export those pipes in a separate public contracts tree mirroring the operation namespaces, usable without creating or opening a Portfolio. Access to validation contracts grants no operation authority and exposes no internal handlers or storage resources.
- Cover every public Result-returning operation in that contracts surface, including opening, setup, migration, attribution binding, shutdown and Snapshot export/import as well as domain operations. Include each operation's complete error union, not only handler-specific errors.
- Success pipes for live Portfolio/lifecycle handles validate the expected instances in-process and preserve their identity without cloning, invoking methods or performing I/O. They neither serialize handles nor reconstruct them from JSON, and validation does not certify that a handle remains open or usable later.
- Deliver the accepted work as two separately reviewed Changes: first the Core foundation refactor (explicit transactions, boundary-only validation, public contracts and Consumer-owned maintenance coordination), then dependent AgentInteraction infrastructure. This sequencing does not authorize Change creation or execution before their respective reviews.

- Remove Core's explicit maintenance locks from opening, ordinary operations, setup, migration, export and import, including the corresponding adapter capability requirement. Do not introduce local substitutes, optional-lock fallbacks or queues.
- Consumers serialize maintenance, prevent new access and client opening, drain whole in-flight operations across all clients and keep access paused through settlement. This includes pending harness calls and their database continuations and interaction-bound tool calls, not closure of harness sessions. Migration requires reopening compatible clients.
- Remove ordinary-operation migration-history reads; retain opening/setup/migration history checks and Snapshot compatibility. Local shutdown admission, explicit transaction atomicity, domain concurrency guards and backend-internal transaction locks remain.
- Preserve safe Secret projection, malformed-boundary rejection, rollback and Revision concurrency behavior. Verify actual responses against public contracts and live-handle identity preservation with ordinary TypeScript and real InMemory behavior tests; run root quality gates sequentially.
- No schema changes, backward-compatibility layer, Consumer implementation or AgentInteraction implementation belongs in this Change.

**References:** [Transactions](adr/2026-11-12-0140-operation-transaction.md), [external-data validation](adr/2026-11-12-0140-native-stored-reads.md), [lifecycle](adr/2026-11-12-0140-portfolio-lifecycle.md).

### AgentInteraction infrastructure

**Disposition:** Next separate Change, dependent on the foundation refactor. Design discussion remains open; no Change has been created for this scope.

**Why:** Establish the session and interaction infrastructure before integrating Expedition, without delivering proposals prematurely.

- Agent Interactions are Core-created domain records paired with one harness session for their lifetime through a Consumer-supplied dependency. A new purpose requires a new interaction/session; missing or failed sessions must not cause implicit replacement. Keep Core proposal/domain state distinct from harness-owned execution and transcripts; this boundary is accepted, not yet implemented.
- Supply the harness through public `CoreDependencies.harness` in the initial infrastructure delivery, before Expedition integration. This dependency does not expose generic interaction creation or acceptance to Consumers.
- Do not persist or require a harness-instance identity or session-namespace identifier. Resolve stored session references through the configured harness dependency; selecting the correct dependency remains the Consumer's responsibility, including after import.
- Route ongoing Consumer conversation directly to the harness, not through Core. Keep proposal submission and human-authorized domain operations separate from conversational messages.
- Core owns purpose-specific session instructions and resolves domain context before invoking the harness dependency. The dependency adapts the resolved request to the harness without loading authoritative domain records or deciding domain behavior.
- Interaction-bound reads return current permitted domain data, with record/version identities where applicable; they do not rewrite the saved startup request. Acceptance still rechecks purpose-specific domain prerequisites rather than trusting startup context or prior reads.
- Core infers each interaction's Core tools from its persisted purpose at runtime and binds their authority to its target and purpose; the dependency exposes them through the harness. Do not persist tool definitions, schemas or handlers, or accept a separately selected per-interaction tool list. Never let agent arguments select another interaction's authority or expose human-only acceptance as an agent tool.
- Consumers control harness-native tools and sandbox permissions. Do not introduce harness-specific permission management into Core or treat native-tool access as permission to bypass Core domain operations.
- Keep the Consumer-supplied harness dependency a generic adapter for session-level operations. The harness manages its internal runs; do not infer a Consumer/Core run controller or separate run-submission API from session creation.
- Keep harness session lookup by ID read-only. Lookup does not repair an interaction, release its reservation or transition it to terminal error; import and ordinary domain reads do not trigger harness checks.
- Trust the Consumer-supplied harness integration to prevent duplication; do not add Core-owned deduplication, retention-window tracking or probes to verify that guarantee. Retry APIs and retry-specific semantics are deferred until a concrete need arises; no automatic retry.
- A user-authorized domain action creates and commits the interaction's identifier and exact resolved creation request before calling the harness to create its session. The saved request excludes tools, which Core infers from the interaction's purpose. After success, atomically persist `started` as an embedded record containing the confirmation timestamp and harness session reference, never a boolean with independently nullable peer fields. It records startup success, not whether the harness is currently executing. Preserve uncertain starts without a retry or repair operation; do not add a background queue.
- Use separate explicit transactions for interaction startup's database phases, with no transaction or database lock held across the harness call. Do not add shared maintenance-coordination locks to these phases for MVP; Consumers drain whole in-flight operations before maintenance. Preserve atomic target/purpose reservation guards independently of maintenance coordination.
- When session creation fails after the interaction is committed, return a safe error type and the saved interaction's ID so the Consumer can identify the saved interaction. Never expose raw harness diagnostics or imply that the committed interaction was rolled back.
- After the starting record commits, permit interaction-bound context reads even before acknowledgment. These calls neither confirm startup nor advance target state. Proposal-related early calls belong to the later Expedition integration, not this infrastructure delivery.
- Enforce one unfinished interaction per target and purpose across clients. Awaiting-confirmation and startup-confirmed interactions reserve the slot; a second start fails rather than reusing it implicitly. Different targets remain independently eligible; no startup retry is delivered.
- Initial AgentInteraction scope excludes retry, abandonment, repair operations and repair-driven terminal error transitions. If session creation fails or its outcome is unknown, leave the started marker unset and retain the saved interaction and target/purpose reservation. Do not add timeout-based release, replacement or automatic recovery; repair semantics are deferred.
- Deliver AgentInteraction infrastructure independently of Expedition. Proposal schemas, collections, versioning, submission, review, acceptance/rejection operations and their tests are deferred to Expedition integration, alongside Expedition schemas, charting, Question research, Blueprint drafting and Delivery execution. Do not add proposal placeholders to this infrastructure delivery.
- Keep generic interaction creation and lifecycle controls internal to Core, for later target-specific domain operations. The calling Core domain operation supplies the already-resolved target, purpose, instructions and context, not a tool list. Shared interaction infrastructure persists the request, uses Core's purpose-inferred tools for session creation and records `started`; resolve those tools before invoking the harness dependency. Consumers supply the harness dependency, not arbitrary domain definitions or acceptance handlers. Verify session lifecycle and tool-binding infrastructure with test-owned definitions and real storage, without implementing proposal behavior or placeholder Expedition features.
- Completion rejects further calls to all interaction-bound Core tools, including reads, but does not close the paired harness session or delete its transcript. Enforce this against persisted lifecycle state even when the harness retains an earlier tool binding; separately Consumer-authorized queries remain available. A late startup acknowledgment cannot reopen a completed interaction or reclaim its released reservation.
- Preserve the accepted [proposal lifecycle](adr/2026-11-12-0140-proposal-lifecycle.md) as later Expedition design, not an acceptance criterion for the initial AgentInteraction infrastructure.
- MVP Snapshot import preserves AgentInteraction records, saved startup requests and original harness-session associations rather than making them inert; proposal history will join this contract when delivered with Expedition. Restore access according to the imported lifecycle state and ordinary authorization checks, without startup retry; do not call the harness during import. Source and destination may therefore refer to the same session. See [imported-session isolation](#imported-session-isolation-and-rebinding) for the deferred improvement.

**Open decisions:** Exact harness create/find and tool-call interfaces; public read surface (find/list is proposed, not accepted); persisted schema and migration; atomic target/purpose reservation implementation; shutdown behavior and verification. Do not fill these gaps with a retry protocol.

**References:** [Persist before harness contact](adr/2026-11-12-0140-interaction-starts.md), [context](CONTEXT.md#relationships).

### Expedition and proposals

**Disposition:** Later delivery after AgentInteraction, not automatically post-MVP and not authorized by the infrastructure Change.

Deliver Expedition context versions, discovery facts and derived Map/Frontier, charting, Question research, complete immutable proposal versions, review and exact-version acceptance, then Blueprint materialization. Proposal submission uses expected-current concurrency checks; acceptance cannot silently substitute a newer version. Initial charting is accepted atomically. Blueprint acceptance requires accepted charting and all current Questions resolved, creates one coherent Delivery/Slice graph and marks planning complete without starting execution.

When proposal support arrives, unaccepted submissions may arrive before startup acknowledgment, but acceptance remains blocked until startup is confirmed. This does not add proposal behavior to the initial interaction delivery.

**Revisit:** When the interaction prerequisite is available and this delivery is separately reviewed. Exact serialized proposal/dependency fields remain to be specified.

**References:** [Discovery](adr/2026-11-12-0140-discovery-ownership.md), [charting](adr/2026-11-12-0140-charting-acceptance.md), [proposals](adr/2026-11-12-0140-proposal-lifecycle.md), [structured dependencies](adr/2026-11-12-0140-nested-proposals.md), [Blueprint](adr/2026-11-12-0140-blueprint-materialization.md).

### Delivery, review and external effects

**Disposition:** Later, separately reviewed delivery; not part of either current Change.

Implement execution against accepted Assets and Instructions, independent Slice review followed by combined Delivery review, verified whole-Delivery integration, and external-effect intent/Approval/Receipt boundaries. Completion or a submitted merge is not proof of integration. Preserve exact accepted scope and explicit authority rather than inferring progression from runtime termination.

**Revisit:** After planning/materialization exists. A combined-review failure after Slice completion has no selected correction workflow; see [review recovery](#delivery-review-recovery).

**References:** [Slice review](adr/2026-11-12-0140-slice-review.md), [Delivery integration](adr/2026-11-12-0140-delivery-merge.md), [external effects](adr/2026-11-12-0140-external-effect-authority.md), [explicit progression](adr/2026-11-12-0140-explicit-progression.md).

### Repository-provider and Consumer integration

**Disposition:** Future work, with concrete interfaces and delivery scope still to be reviewed.

Core owns repository-provider semantics and resolved Asset/Secret context; Consumers supply runtime integration, authentication and deployment concerns. The accepted Hermes Consumer direction is a thin plugin bridge to a one-shot Core host, not a new chat daemon. No concrete Consumer application or harness adapter is delivered by the current Changes.

**Revisit:** With the domain operations that need live repository access and the chosen Consumer. Select provider API/ref handling and remote redirect/name-reuse behavior without implicit credential fallback.

**References:** [Repository boundary](adr/2026-11-12-0140-repository-runtime-boundary.md), [Hermes Consumer](adr/2026-11-12-0140-hermes-consumer.md), [Asset identity](adr/2026-11-12-0140-asset-record.md).

## Deferred decisions

### Startup retry

**Disposition:** Deferred until a concrete situation demonstrates a need. The earlier explicit-retry agreement is superseded; no retry API or retry-specific protocol is currently designed or delivered.

**Current plan:** Save the interaction before session creation, record `started` only after success, and retain the unstarted record/reservation on failure or uncertainty. The Consumer integration owns duplicate prevention. This does not grant retry eligibility.

**Revisit:** A real failed/uncertain startup requiring recovery. Decide semantics then rather than prebuilding replay, request-retention windows or automatic retries.

### Startup repair and abandonment

**Disposition:** Deferred; semantics unresolved, not a commitment to a particular recovery API.

**Current plan:** No repair, abandonment, timeout release or repair-driven terminal error transition. Failure/uncertainty retains the interaction and reservation; lookup and import do not mutate lifecycle or create replacement sessions.

**Revisit:** A concrete stuck interaction or cancellation requirement. Safe reservation release and outstanding harness calls must be reasoned through before authorizing a design.

### Delivery review recovery

**Disposition:** Deferred decision.

**Current design:** Combined-review failure blocks merge and does not reopen completed Slices. No Correction/RevisionGate workflow is selected.

**Revisit:** During Delivery review design, before claiming a complete recovery path. Do not waive gates or rewrite history to bypass the missing workflow. [Rationale](adr/2026-11-12-0140-slice-review.md).

## Post-MVP improvements

### Imported-session isolation and rebinding

MVP import preserves interaction identities and original harness-session associations, subject to configured dependency and normal authority checks; import itself makes no harness calls. Source and destination may therefore refer to the same session. Consider explicit isolation, detachment and rebinding after MVP when independent restored environments require it; no implicit replacement or new harness-instance identity is approved.

### Core-managed maintenance coordination

MVP Consumers serialize maintenance and pause/drain access across all clients for setup/migration/export/import. Core does not promise cross-client maintenance exclusion under the planned foundation refactor. Revisit Core-managed draining/exclusion post-MVP when deployment experience warrants it; preserve transaction and domain concurrency requirements independently. [Lifecycle rationale](adr/2026-11-12-0140-portfolio-lifecycle.md).

### Bounded-memory Snapshots

MVP export/import handles complete encrypted strings in memory without streaming or a Core-enforced size cap. Large Portfolios can exhaust memory and cause long Consumer maintenance pauses. Revisit streaming, bounded-memory processing and size controls post-MVP using observed Portfolio sizes; no threshold or transport protocol is chosen. [Current Snapshot behavior](../../libs/core/README.md#encrypted-portfolio-snapshots).
