# Core future work

This register contains deferred work and future plans outside the current Changes. Settled contracts belong in [operation boundaries](BOUNDARIES.md), [Core engineering guidance](ENGINEERING.md), [context](CONTEXT.md) and the relevant ADRs. Changes track implementation; this document is not an implementation-status ledger or authorization to execute work.

## Planned work

### Expedition and proposals

**Disposition:** Later delivery after AgentInteraction, not automatically post-MVP and not authorized by the infrastructure Change.

Deliver Expedition context versions, discovery facts and derived Map/Frontier, charting, Question research, complete immutable proposal versions, review and exact-version acceptance, then Blueprint materialization. Proposal submission uses expected-current concurrency checks; acceptance cannot silently substitute a newer version. Initial charting is accepted atomically. Blueprint acceptance requires accepted charting and all current Questions resolved, creates one coherent Delivery/Slice graph and marks planning complete without starting execution.

Proposal submission and acceptance follow purpose-specific domain gates and interaction closure, not a startup-confirmation field. This does not add proposal behavior to the initial interaction delivery.

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

### Interaction reservation concurrency

**Disposition:** Accept the purpose/target check-and-insert race for now. Stronger concurrency coordination is deferred; no storage-level uniqueness constraint, reverse target reference or additional reservation-coordination mechanism is included in the current scope.

**Current limitation:** The universal policy remains one open AgentInteraction per purpose type and target within a Portfolio, enforced by a Core query and rejection of an observed open interaction before insertion. Concurrent creation calls, creation versus repair, or repairs of different failed interactions for the same pair can each observe no open interaction and then commit separate open interactions. Keeping each operation's writes in a transaction does not by itself prevent this race. This is a known enforcement limitation, not a workflow opt-out or automatic permission to repair duplicates.

**Independent guarantees:** Target/interaction creation remains atomic when grouped by a domain operation. Repair's replacement and guarded `repaired` update remain atomic, and two repairs of the same failed interaction must not both commit replacements. Guarded terminal closure, lifecycle admission and purpose-specific domain rules are unchanged. Snapshot import remains shape-only, without relationship auditing or reconciliation.

**Revisit:** When concurrent usage demonstrates a need for strict purpose/target exclusion. Review code-level coordination and backend isolation while keeping the policy out of database uniqueness constraints unless separately approved. Qualify any stronger guarantee with real adapter-backed overlap tests; do not infer it from a serializing test adapter.

**References:** [Creation, run and reservation policy](ENGINEERING.md#record-creation-and-explicit-run), [repair atomicity](ENGINEERING.md#explicit-repair).

### Tool-write and closure coordination

**Disposition:** Deferred; no interaction write-version counter or equivalent shared write guard is included in the current delivery.

**Current limitation:** Core checks interaction lifecycle when admitting a tool call and rejects calls against a closed interaction. That check alone does not prevent an already-admitted state-changing tool from committing after concurrent closure, even when its own writes use a transaction. Domain atomicity, purpose checks and purpose/target reservation rules remain independent requirements.

**Revisit:** When a concrete state-changing tool requires strict exclusion against concurrent closure. The proposed approach is an internal interaction write-version counter conditionally advanced while the interaction is open, in the same transaction as the tool's writes, with closure contending on that same record. This is a candidate, not an approved implementation. Verify the actual adapter-backed overlap behavior before claiming the stronger guarantee; do not add automatic retries or hold a transaction across a harness call.

**References:** [Tool authority and closure](ENGINEERING.md#tools-and-closure), [transaction boundaries](BOUNDARIES.md#transactions).

### Native-tool authority bypass

**Disposition:** Defer the native-tool bypass prevention design until the tools discussion. No additional sandboxing, credential-isolation mechanism or integration checks are authorized by this entry.

**Current limitation:** The purpose-derived allowlist restricts Core tools, not harness-native tools. An agent with native shell access could reach a human-authorized Core entry point through an authenticated CLI or ambient credentials; hiding that operation from the Core tool catalog alone does not prevent this route.

**Revisit:** During tools design, review reachable entry points, credential access, trusted routing and the Core/Consumer enforcement boundary. Select concrete protections and their verification then. Existing Core invocation authority checks and human-only acceptance rules remain unchanged.

**References:** [Core and harness tool boundaries](ENGINEERING.md#public-and-harness-boundaries), [Consumer bridge](adr/2026-11-12-0140-hermes-consumer.md).

### Tool-validation diagnostic hardening

**Disposition:** Defer additional tool-validation error sanitization. Preserve normal validator messages and field paths; do not introduce dynamic-key filtering or a new diagnostic-sanitization layer in the current interaction delivery.

**Current limitation:** Projecting validation errors to paths and messages does not guarantee removal of caller-controlled content. Arbitrary object keys can appear in error paths, and validator-converted exceptions can retain raw exception text. Tool inputs using those features may therefore expose supplied content through diagnostics even when invalid values are omitted.

**Scope boundary:** This deferral does not remove existing safe exception handling, Secret projection or adapter-error containment. It postpones additional hardening for tool-validation diagnostics, not a rewrite of current boundary behavior.

**Revisit:** When a concrete tool accepts arbitrary-key objects or a Consumer requires stronger diagnostic confidentiality. Review safe handling of dynamic paths and validator-converted exceptions without replacing ordinary built-in diagnostics wholesale; verify the Core error boundary with sensitive sentinel content.

**References:** [Tool input and error contracts](ENGINEERING.md#public-and-harness-boundaries), [validation and public responses](BOUNDARIES.md#validation-and-public-responses).

### Centralized storage-return validation

**Disposition:** Defer implementation to the upcoming review and revision of [Change #66](https://github.com/andthexi/gorchestra/issues/66), rather than adding a standalone Snapshot write-response fix to the AgentInteraction delivery. The revised design must ensure storage operations validate returned data before exposing it to callers. This entry does not itself revise the Change, authorize implementation or approve an Equipped change or dependency upgrade; Core's existing external-boundary validation remains required.

**Current limitation:** Handler-level storage validation can be omitted even when TypeScript accepts the returned value. Snapshot import currently awaits replacement deletes and creates but discards their returned data; a malformed, nonthrowing response can therefore reach success. This does not establish that persisted data is wrong, but leaves the external response unvalidated. Source inspection found centralized validation feasible in Equipped's native return path, but existing field pipes parse input into stored output and cannot generally be replayed as output validators: transforms may run again, and defaults or fallbacks may conceal malformed data.

**Revisit:** When revamping Change #66, review the output-validation boundary and delivery scope, including read and write responses and the Snapshot replacement path. A caller discarding a write's returned data must not bypass validation. Carry the malformed-write-response rollback coverage into that revision. Cover selected fields and computed dependencies, recursive preloads, counts and aggregates, and explicit raw/direct-adapter exclusions or contracts. Distinguish storage decoding from validation, avoid raw values in errors, and preserve explicit transaction semantics: rejecting a write response does not itself roll back the write, so Snapshot validation failures must abort inside its replacement transaction. Core still owns domain checks and safe Secret projection; this is not a return to parsing Core-authored Results in the shared runner. Remove local validation only where an equivalent native guarantee is established. Add no import relationship checks, reconciliation or automatic repair.

**References:** [Core validation boundary](BOUNDARIES.md#validation-and-public-responses), [Snapshot implementation](../../libs/core/src/portfolio/snapshot.ts), [Snapshot verification](ENGINEERING.md#verification), [Equipped return shaping](https://github.com/andthexi/equipped/blob/2455c3f35259001f45e839d6f3226274f664a667/src/orm/repo/builders.ts#L97-L122), [input/output parsing](https://github.com/andthexi/equipped/blob/2455c3f35259001f45e839d6f3226274f664a667/src/orm/schema-validations.ts#L9-L50), [preload reads](https://github.com/andthexi/equipped/blob/2455c3f35259001f45e839d6f3226274f664a667/src/orm/repo/internals/preloads.ts#L108-L150).

### Startup retry

**Disposition:** Deferred until a concrete situation demonstrates a need. The earlier explicit-retry agreement is superseded; no retry API or retry-specific protocol is currently designed or delivered.

**Current plan:** Domain creation only saves the interaction. Explicit run checks whether the same-ID session exists for an open interaction; it skips creation when present, otherwise calls create and waits for the adapter's completion acknowledgment. It does not replay instructions or start another turn when the session already exists. This repeatable run is not a recovery API for closed interactions. The Consumer integration owns duplicate prevention; there is no automatic retry.

**Revisit:** A real failed/uncertain startup requiring recovery. Decide semantics then rather than prebuilding replay, request-retention windows or automatic retries.

### Startup repair and abandonment

**Disposition:** Recovery beyond [explicit startup-failure repair](ENGINEERING.md#explicit-repair) remains deferred, including abandonment and recovery of interactions left open by interrupted calls or failed closure persistence.

**Current plan:** No automatic reconciliation, abandonment, timeout release or repair-driven terminal error transition. Ordinary interaction reads do not mutate lifecycle, and import preserves the original session identity without creating a replacement session.

**Revisit:** A concrete stuck interaction or cancellation requirement. Safe reservation release and outstanding harness calls must be reasoned through before authorizing a design.

Session-existence lookup belongs to explicit run's [check-before-create flow](ENGINEERING.md#record-creation-and-explicit-run). Richer session inspection for recovery remains a future decision; the existence check does not authorize automatic reconciliation, retry or reservation release.

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
