# Gorchestra Core

Core is the reusable Portfolio-level orchestration context. It owns Portfolio data and work rules without taking on Consumer tenancy, authentication or deployment policy. This context defines its domain language and relationships; the [package README](../../libs/core/README.md) documents usage.

## Language

**Portfolio**:
A first-class grouping and isolated boundary for Projects, reusable knowledge and credential references. Portfolio containment does not make every record part of one aggregate.
_Avoid_: Workspace, Project Space, tenant

**Consumer**:
An application layer that provides user experience, authentication, authorization, Portfolio registration and selection, storage configuration, and Secret encryption-key provisioning and safekeeping around Core.
_Avoid_: Core provider, Portfolio

**Portfolio Snapshot**:
A Core-produced, passphrase-encrypted representation of Portfolio data, including Secret values, that preserves record identities and relationships and identifies the source migration level. It excludes the Portfolio encryption key and requires the export passphrase for import, including when the source Portfolio stores Secrets in plaintext.
_Avoid_: Live Portfolio, storage configuration, incremental patch

**Portfolio Import**:
The operation that atomically replaces a ready destination Portfolio's data with a Portfolio Snapshot rather than merging records, storing imported Secrets under the destination's opening key or plaintext mode. Import neither initializes storage nor selects a replacement key or protection mode; failure leaves the destination's pre-import data unchanged.
_Avoid_: Merge, append, partial restore

**Project**:
A continuing undertaking that owns configured Assets and is referenced by independent Expeditions. A Project may exist before any Assets or work are added.
_Avoid_: Repository, Expedition, workspace

**Asset**:
One identified, immutable Project-owned target configuration. The source-control variant identifies a GitHub repository and the same-Portfolio Secret used for access; it is not a checkout or an artifact produced by work.
_Avoid_: Repository wrapper, checkout, Artifact

**Secret**:
A Portfolio-owned credential identity reusable by Assets across Projects. Ordinary Secret responses contain metadata only, never plaintext or the stored value, regardless of the Portfolio's protection mode.
_Avoid_: Provider-specific credential model, plaintext record

**Stored Secret Value**:
The Core-owned persisted representation of a Secret's value, either plaintext or ciphertext according to the Portfolio's Secret Protection. Core owns encryption and internal decryption; the stored value is not public Secret metadata or an external-store reference.
_Avoid_: Protected Secret Value Reference, Consumer codec output, Secret identity

**Secret Protection**:
A Portfolio-owned record identifying plaintext or encrypted Secret storage, including key-verification data for encrypted storage but never the encryption key. Its stable identity scopes encrypted values to this Portfolio together with each Secret's identity, and the record exists even when no Secrets do.
_Avoid_: Per-Secret protection choice, encryption key, Consumer codec

**Secret Value Replacement**:
Assigning a new value to an existing Secret under the Portfolio's Secret Protection while preserving its identity and all Asset references to it.
_Avoid_: Replacement Secret, Asset rebinding, Secret metadata update

**Portfolio Memory**:
The Portfolio's user-maintained reusable knowledge, organized as Memories and their immutable revisions. Knowledge remains independent of any one Project or Expedition.
_Avoid_: Project snapshot, Blueprint output, workspace wiki

**Memory**:
A note-like item that may have both content and children through an immutable parent relationship. It keeps a compact current revision summary containing identity, version and title; full content and revision attribution belong to Memory Revisions.
_Avoid_: Folder-only record, embedded revision history, mutable body

**Memory Revision**:
One immutable title and body snapshot belonging to a Memory. Revision identity supports exact citations that do not follow later edits; version orders that Memory's history and guards subsequent edits.
_Avoid_: Latest pointer, edit-in-place content, global version

**Audit Stamp**:
The original operation time with either local Consumer-supplied actor and correlation references or imported provenance and the latest import time. Import preserves the original operation time, removes source-local attribution and refreshes the import time even for already-imported stamps; attribution is not authentication, authorization or idempotency.
_Avoid_: User identity, permission, idempotency key

**Runtime Record**:
The time Core records a runtime observation, without actor attribution. It records an observed event rather than an authorizing action.
_Avoid_: Audit Stamp, authorization

**Expedition**:
An independent bounded undertaking belonging to a Project. It owns discovery context, Questions, Findings, Decisions and accepted Blueprints; its planned phase means materialized handoff, not successful delivery.
_Avoid_: Project, Delivery, chat session

**Map**:
The assembled current understanding of an Expedition, derived from its owned discovery facts and context.
_Avoid_: Independently edited aggregate, stored discovery copy

**Frontier**:
The derived set of open, unblocked and unclaimed Questions available for discovery.
_Avoid_: Stored queue, scheduler, separate aggregate

**Question**:
Precise discovery work with an accepted research, grilling or human-prerequisite method. Unknowns, notes and boundaries remain context values rather than additional work records.
_Avoid_: Chat prompt, arbitrary note, task backlog

**Finding**:
An observation recorded in discovery, distinct from a settled conclusion.
_Avoid_: Decision, verified truth

**Decision**:
A settled domain conclusion reached through discovery.
_Avoid_: Finding, runtime approval, architectural decision record

**Evidence**:
An immutable supporting locator, version or excerpt owned by the content that cites it. A stored citation does not certify truth or future source availability.
_Avoid_: Evidence registry, complete source archive, certification

**Agent Interaction**:
A Core domain model representing an agent's engagement with one domain target for a fixed purpose, paired for its lifetime with one harness session that shares its identity. Its purpose owns the target relationship, without a reverse interaction reference on the target. Core owns its identity, lifecycle and domain authority; the harness owns execution and transcripts. Closure records terminal success or failure of the domain purpose, not termination of the harness session.
_Avoid_: Chat session, runtime transcript, target aggregate

**Blueprint**:
Expedition-owned accepted work scope that materializes one coherent initial Delivery, Slice and dependency graph. Acceptance does not start execution or alter Asset and Secret configuration.
_Avoid_: Draft work record, running Delivery, evolving task list

**Delivery**:
An independent accepted outcome targeting one existing Asset in its Project. It owns Slices and retains its accepted origin without giving later planning changes authority over execution.
_Avoid_: Expedition, Blueprint, individual Slice

**Slice**:
A bounded executable and independently reviewable part of a Delivery. It derives its target from the Delivery and carries immutable Instructions.
_Avoid_: Independent target, planning Question, Delivery

**Instructions**:
The immutable accepted directions for carrying out a Slice.
_Avoid_: Live chat, mutable planning notes, runtime transcript

**Operation**:
An independent aggregate for a proposed external effect and its exact scope, Approval and Receipts. It references the requesting work rather than owning it; it is not every SDK call.
_Avoid_: Domain query, runtime submission, work aggregate

**Approval**:
Permission for the exact scope of a proposed external effect. Changed content cannot reuse an earlier Approval.
_Avoid_: Blueprint acceptance, runtime completion, Receipt

**Receipt**:
Effect-specific evidence of an externally verified outcome. It records an observation, not retroactive permission to perform the effect.
_Avoid_: Approval, submitted request, assumed success

**Archive Period**:
Record-owned reversible archival history. The term alone does not grant archival operations to a model.
_Avoid_: Deleted flag, generic retirement API

## Relationships

- **Consumers → Core**: Consumers select and authorize a Portfolio, supply isolated storage, and provide and safeguard its encryption key or explicitly select plaintext Secret storage. For MVP they coordinate migration, export and import across all clients sharing that Portfolio, pausing new access and draining in-flight work before maintenance and keeping access paused until it settles; migration requires stopping existing clients and reopening compatible clients afterward. Core owns Secret encryption, decryption and the Portfolio's Secret Protection; Workspace and membership authority remain outside Core.
- **Projects → Assets → Secrets**: Projects own configured targets; Assets reference reusable Secrets in the same Portfolio. A changed target requires a different Asset, while Secret Value Replacement preserves references.
- **Memories → Memory Revisions**: Parentage defines the knowledge hierarchy. Each edit appends an immutable revision and atomically updates the Memory's compact current summary; exact citations retain their revision identity.
- **Expeditions → Blueprints → Deliveries → Slices**: Reviewed planning materializes accepted work without starting it. Deliveries retain independent ownership, and Slices derive their target from their Delivery.
- **Agent Interactions → domain proposals**: Core infers available tools from the interaction's purpose and binds them to that interaction; the harness dependency exposes them to the agent. Reads return current permitted domain data rather than being frozen to startup context. Tool arguments cannot select another interaction's authority, and human acceptance operations are not agent tools. Saving a proposal and accepting its domain changes are separate actions; runtime completion is not domain closure or acceptance. Closing an interaction blocks new bound Core tool calls, including reads, while already-admitted reads may finish. Coordination of in-flight tool writes with closure is [deferred](FUTURE.md#tool-write-and-closure-coordination). Closure does not close its harness session or delete its transcript; separately Consumer-authorized queries remain available.
- Core's policy permits only one unfinished **Agent Interaction** for a given target and purpose type within a Portfolio, including while session creation is pending. This is a universal rule, not a workflow choice; code checks reject observed conflicts, with a [known concurrent-creation race](FUTURE.md#interaction-reservation-concurrency). Different targets may proceed independently.
- **Portfolio Import → Agent Interactions**: Imported interactions retain their identities, lifecycle state, proposal history and original harness-session associations, restoring access through the destination's configured harness dependency subject to ordinary authorization and lifecycle checks. Restoring earlier history can restore previously revoked interaction authority; it does not rewind the harness session or external effects. Import itself does not create sessions or invoke the harness.
- **Core → harness**: Consumers supply the dependency through which Core interacts with the harness. Core creates Agent Interactions and builds instructions from their purpose with all necessary domain details included, without invoking the harness. A separate user-triggered run first checks whether the corresponding session exists using the Agent Interaction ID as its session ID; if absent, it requests creation and waits for the adapter's completion acknowledgment. The Consumer harness API enforces that identity and repeated run does not replay instructions or start another turn in an existing session. The dependency adapts the resolved request to the harness rather than loading domain records or defining domain behavior; the harness session is not the Core domain record. Follow-up messages and revised proposals retain that pairing; a new purpose requires a new Agent Interaction and session, not repurposing the existing one.
- **Consumers → harness**: Consumers supply a generic harness API for Core's session-level operations, wire Core tools into supported harnesses and enforce each session's purpose-derived Core tool allowlist. Harness-native tools and sandbox permissions remain Consumer-configured and outside that allowlist. Consumers route conversational follow-ups directly to the harness. The harness manages its internal runs, not the Consumer or Core. Conversation does not itself save or accept Core domain proposals; native-tool access does not grant Core domain authority.
- **Operations → Approvals and Receipts**: Proposed scope, authority and verified external outcome are distinct facts. Domain gates still govern whether requesting work may proceed.
- Ownership, child collections, usages and work targets derive from relationships rather than synchronized copies. Memory's compact revision summary and fixed original creation attribution are deliberate read-convenience exceptions.
- Core owns repository-provider behavior and Secret encryption/decryption; Consumers supply storage, encryption-key provisioning and runtime integration. Configuring an Asset does not establish live provider validity or access.
