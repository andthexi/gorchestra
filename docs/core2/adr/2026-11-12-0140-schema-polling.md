# Defer ordinary-operation schema polling

## Status

Decision disposition: deferred, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Repeated migration-history reads on every domain operation were judged unjustified for the MVP.

## Decision

<a id="limit-01"></a>

### LIMIT-01 — No per-operation schema polling

**Disposition:** deferred. **Implementation:** unimplemented.

Defer ledger/schema rechecks on ordinary Portfolio calls and related shared schema errors. Validate history at new/setup/migrate only. No TTL cache, poller, periodic probe, drift-error, reconnect or hidden migration substitute. Continue input/stored/output validation, domain ownership/version checks and local admission. Recreate clients explicitly after non-overlapping maintenance.

**Recorded rationale:** Recurring schema-read cost was rejected for the MVP; live schema drift is not proactively detected.

<a id="limit-h01"></a>

### LIMIT-H01 — Historical ordinary schema guard

**Disposition:** superseded. **Implementation:** unimplemented.

Earlier ordinary domain calls retained internal schema-state guards and schema-mismatch/not-initialized/history errors. That per-call preflight is superseded by explicit deferral.

**Original rationale:** The unrestricted manager allowed construction before schema readiness so setup/migrate remained reachable; internal domain guards refused uninitialized or mismatched-schema work instead of relying on a prior Consumer status check.

**Reason superseded:** Recurring ordinary-call ledger reads were judged unjustified for the MVP. Checks remain at new/setup/migrate; no cache, polling or per-call substitute was adopted.

## Alternatives and supersession

- **LIMIT-01:** Supersedes [LIMIT-H01](2026-11-12-0140-schema-polling.md#limit-h01). The decision is to defer/exclude this capability, not approval of an unresolved implementation.
- **LIMIT-H01:** Superseded by [LIMIT-01](2026-11-12-0140-schema-polling.md#limit-01).

## Consequences

Schema/history checks occur at factory/setup/migrate. Domain validation and local admission remain; deployments coordinate maintenance and explicitly recreate clients afterward.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **LIMIT-01:** `S35` — `rework/foundation-model-contract.md`, lines 162–168; `S46` — `rework/sdk-handler-tree.md`, lines 204; `S20` — `rework/deferred-functionality.md`, lines 65.
- **LIMIT-H01:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 162; `S19` — `rework/consumer-api-safety-audit.md`, lines 64; `S35` — `rework/foundation-model-contract.md`, lines 162.
