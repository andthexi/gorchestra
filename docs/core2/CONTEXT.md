# Core domain context

## Scope and navigation

This documents the accepted vocabulary for the new Core design in `libs/core2` (`@gorchestra/core2`). **Task 0 adds package configuration only; all runtime behavior remains unimplemented.** There is no runnable new API to use yet. The numeric suffix distinguishes paths/packages, not a different domain or numbered code identifiers.

The existing Server Consumer still uses `@gorchestra/core`; [existing Core context](../core/CONTEXT.md) continues to describe that implementation. This subtree does not supersede its contracts or authorize a Consumer cutover or legacy-store conversion.

The [foundation contract reference](contracts.md) records accepted shapes and operations without presenting them as a working API. The [ADR index](adr/README.md) records only hard-to-reverse, surprising choices made through genuine tradeoffs; it is not an exhaustive source or planning register. [Local documentation contracts](AGENTS.md) govern maintenance. See [package status](../../libs/core2/README.md) and [testing guidance](testing.md) for the configuration gate; usage examples will follow actual implementation, not substitute for it.

## Foundation vocabulary

| Term                          | Meaning and relationships                                                                                                                                                                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Portfolio**                 | First-class domain grouping and isolated storage boundary for Projects, reusable knowledge and credential references. Consumers own registry, selection and access; scope does not merge all records into one aggregate.                                                               |
| **Consumer**                  | Application layer providing user experience, authentication, authorization, Portfolio selection, backend configuration and Secret protection. Workspace and membership are Consumer concerns, not new Core models.                                                                     |
| **Project**                   | Continuing undertaking owning durable Assets and referenced by independent Expeditions. Its accepted foundation shape is identity, title, nested source-control spec and creation attribution. A Project may be created empty.                                                         |
| **Asset**                     | One identified Project-owned allocation/configuration record. The current variant is a GitHub repository on github.com with owner/name and a required same-Portfolio Secret reference. It is not a wrapper around a Repository, a checkout, a produced Artifact or a shared aggregate. |
| **Secret**                    | Top-level Portfolio-owned credential identity reusable by Assets across Projects in that Portfolio. Ordinary metadata omits its protected reference and raw value. Title is supplied at creation; value replacement retains identity/bindings.                                         |
| **Protected value reference** | Exact opaque nonempty string returned by Consumer encoding and stored internally as valueRef. It is not plaintext, a child model or a Core-selected encryption scheme. Core does not interpret it or guarantee external-store rollback.                                                |
| **Memory**                    | Independent user-maintained reusable knowledge, with immutable parentage and its own immutable revisions. A Memory can have content and children. Its compact current summary contains revision identity, version and title, not body or revision attribution.                         |
| **MemoryRevision**            | Complete immutable title/body/version/creation record owned by one Memory. Exact revision citations do not follow future edits. Version controls history order and expected-version writes; revision identity controls lookup/citation.                                                |
| **Attribution / AuditStamp**  | Core-generated local operation time with exact Consumer-supplied by/cid values. It records who the Consumer attributed an operation to, not authentication, authorization or idempotency. Original creation remains fixed; supported writes use their own stamp.                       |
| **Lifecycle capability**      | PortfolioSetup, PortfolioMigration or ready PortfolioClient, selected by the future classification factory. They share resource ownership. Portfolio is the separate attribution-bound domain facade, not another physical connection or a persisted record created by binding.        |

Relationships, not copied child lists, determine ownership, usages and targets. The compact Memory revision summary and fixed original Memory creation stamp are explicit read-convenience exceptions. Secret/Project title renames, Asset rebinding and their updated fields are excluded from the current foundation; no generic update or archival substitute is implied.

## Paused planning vocabulary

These accepted concepts are retained for navigation and future work, **not implemented by the foundation**. Expedition work remains paused.

- **Expedition** is an independent bounded undertaking belonging to a Project. It owns context versions, Questions, Findings, Decisions and accepted Blueprints. Its selected planning phases are charting, discovery, drafting and planned; planned means materialized handoff, not successful delivery.
- **Map** assembles current Expedition understanding. **Frontier** derives open, unblocked, unclaimed Questions. Neither is a separate writable aggregate.
- **Question** is precise discovery work with an accepted research, grilling or human-prerequisite method. **Unknowns**, notes and boundaries are context values, not additional work records.
- **Finding** is an observation; **Decision** is a settled conclusion. **Evidence** is an immutable supporting locator/version/excerpt owned by the citing content, not a registry or certification of truth.
- **AgentInteraction** independently owns integration state and immutable proposed-result versions for its domain target. Runtime transcript/execution stays outside Core. A proposed result is not accepted work; human acceptance applies domain changes.
- **Blueprint** is Expedition-owned accepted work scope, created only at final acceptance in the selected single-creation MVP. It materializes the complete initial Delivery/Slice/dependency graph atomically without starting execution or changing Asset/Secret configuration.
- **Delivery** is an independent accepted outcome targeting one existing Project Asset. It owns **Slices**, which derive that target and contain immutable **Instructions**. Dependencies belong to the dependent work's aggregate.
- **Operation** is an independent aggregate owning a proposed external effect and scope, its **Approval**, and effect-specific evidence/**Receipts**; it references rather than owns the requesting work. Approval grants permission for the exact scope; a Receipt records verified external read-back. They are not every SDK invocation or another planning review gate.
- **Archive Period** retains record-owned reversible archival history as vocabulary; it does not grant Project, Asset or Secret archival capabilities.

Core-owned repository-provider behavior remains distinct from Consumer-supplied storage, Secret callbacks and the generic AgentRuntime integration category. Repository read/ref-selection APIs and concrete AgentRuntime interfaces/injection timing are deferred; the executable foundation dependency design requires storage and secrets only, not placeholder services.

## Boundaries that do not follow from vocabulary

Accepted design is not implementation approval for paused features. This snapshot delivers no runtime behavior, Consumer cutover or integrations. Unselected Expedition/runtime schemas and exploratory proposals remain in the original design notes, not as accepted API contracts or a published backlog. Removing a planning-only ADR does not authorize the excluded feature or change a reviewed choice.
