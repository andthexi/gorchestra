# Core ADR index

These records are selected using the Trowel Grill test: **all three** must hold—the decision is hard to reverse, surprising without context, and the result of a real tradeoff with genuine alternatives. If any is missing, use ordinary documentation or omit it rather than create an ADR. This is not a source audit, task plan or backlog.

All listed decisions are accepted design, **unimplemented in this documentation-only snapshot**. The parallel package is not scaffolded; Expedition, runtime and downstream work remain paused. Existing [Core documentation](../../core/CONTEXT.md) still owns the Server Consumer's library. See [domain context](../CONTEXT.md), [foundation contracts](../contracts.md) and [documentation rules](../AGENTS.md).

Records retain the timestamp filename convention; timestamps record documentation promotion, not reconstructed original decision dates. Related historical alternatives appear only where they explain the selected tradeoff, not as a transcript of intermediate planning.

## Foundation boundaries

- [A parallel clean break](2026-11-12-0140-parallel-library.md)
- [Keep Portfolio isolation separate from Consumer tenancy](2026-11-12-0140-portfolio-authority.md)
- [Grant state-specific lifecycle capabilities](2026-11-12-0140-portfolio-lifecycle.md)
- [Use the native migration ledger](2026-11-12-0140-migration-catalog.md)
- [Make schema transitions explicit and whole-run atomic](2026-11-12-0140-explicit-schema-transitions.md)
- [Use native Repo with explicit validation](2026-11-12-0140-native-stored-reads.md)
- [Commit only a validated complete operation](2026-11-12-0140-operation-transaction.md)
- [Give each immutable target one Asset identity](2026-11-12-0140-asset-record.md)
- [Keep Secret protection Consumer-owned](2026-11-12-0140-secret-protection.md)
- [Rotate shared credentials without rebinding Assets](2026-11-12-0140-secret-value-replacement.md)
- [Keep compact Memory heads and immutable revisions](2026-11-12-0140-memory-record.md)
- [Require explicit authority to progress Core](2026-11-12-0140-explicit-progression.md)

## Accepted planning and integration decisions — implementation paused

- [Derive discovery views from Expedition-owned facts](2026-11-12-0140-discovery-ownership.md)
- [Accept charting as a reviewed batch](2026-11-12-0140-charting-acceptance.md)
- [Separate stored proposals from human acceptance](2026-11-12-0140-proposal-lifecycle.md)
- [Accept one complete work graph after discovery](2026-11-12-0140-blueprint-materialization.md)
- [Use structured, local proposal dependencies](2026-11-12-0140-nested-proposals.md)
- [Keep repository behavior in Core](2026-11-12-0140-repository-runtime-boundary.md)
- [Use a one-shot Core host, not a chat daemon](2026-11-12-0140-hermes-consumer.md)
- [Acknowledge runtime starts inside the local transaction](2026-11-12-0140-interaction-starts.md)
- [Integrate and verify a whole Delivery](2026-11-12-0140-delivery-merge.md)
- [Complete Slices through independent review](2026-11-12-0140-slice-review.md)
- [Separate external-effect intent, approval and receipt](2026-11-12-0140-external-effect-authority.md)
