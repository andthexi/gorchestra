# Gorchestra Core

Core is the reusable Portfolio-level orchestration context. It owns Portfolio data and work rules without taking on Consumer tenancy, authentication or deployment policy. This context describes the current implementation at `libs/core`. No Consumer application is currently implemented. Expedition and downstream execution remain outside the current foundation implementation.

## Language

**Portfolio**:
A first-class grouping and isolated boundary for Projects, reusable knowledge and credential references. Portfolio containment does not make every record part of one aggregate.
_Avoid_: Workspace, Project Space, tenant

**Consumer**:
An application layer that provides user experience, authentication, authorization, Portfolio registration and selection, storage configuration, and Secret protection around Core.
_Avoid_: Core provider, Portfolio

**Project**:
A continuing undertaking that owns configured Assets and is referenced by independent Expeditions. A Project may exist before any Assets or work are added.
_Avoid_: Repository, Expedition, workspace

**Asset**:
One identified, immutable Project-owned target configuration. The source-control variant identifies a GitHub repository and the same-Portfolio Secret used for access; it is not a checkout or an artifact produced by work.
_Avoid_: Repository wrapper, checkout, Artifact

**Secret**:
A Portfolio-owned credential identity reusable by Assets across Projects. Ordinary Secret metadata excludes both the raw value and its protected reference.
_Avoid_: Provider-specific credential model, plaintext record

**Protected Secret Value Reference**:
An opaque Consumer-produced value that allows the Consumer to resolve a Secret's plaintext. It may refer to an external store or contain an encrypted envelope; Core does not interpret the protection scheme.
_Avoid_: Plaintext secret, encryption key, Secret identity

**Secret Value Replacement**:
Assigning a new protected value to an existing Secret while preserving its identity and all Asset references to it.
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
Core-recorded operation time paired with exact Consumer-supplied actor and correlation references. It records attribution, not authentication, authorization or idempotency, and original creation attribution remains fixed.
_Avoid_: User identity, permission, idempotency key

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
An independent owner of integration state and immutable proposed-result versions for one domain target. Runtime execution and transcripts remain outside Core; a saved proposal is not accepted work.
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

- **Consumers → Core**: Consumers select and authorize a Portfolio and supply isolated storage and Secret-protection mechanics. Workspace and membership authority remain outside Core.
- **Projects → Assets → Secrets**: Projects own configured targets; Assets reference reusable Secrets in the same Portfolio. A changed target requires a different Asset, while Secret Value Replacement preserves references.
- **Memories → Memory Revisions**: Parentage defines the knowledge hierarchy. Each edit appends an immutable revision and atomically updates the Memory's compact current summary; exact citations retain their revision identity.
- **Expeditions → Blueprints → Deliveries → Slices**: Reviewed planning materializes accepted work without starting it. Deliveries retain independent ownership, and Slices derive their target from their Delivery.
- **Agent Interactions → domain proposals**: Saving a proposal and accepting its domain changes are separate actions. Runtime completion is not domain completion or acceptance.
- **Operations → Approvals and Receipts**: Proposed scope, authority and verified external outcome are distinct facts. Domain gates still govern whether requesting work may proceed.
- Ownership, child collections, usages and work targets derive from relationships rather than synchronized copies. Memory's compact revision summary and fixed original creation attribution are deliberate read-convenience exceptions.
- Core owns repository-provider behavior; Consumers supply storage, protection and runtime integration. Configuring an Asset does not establish live provider validity or access.
