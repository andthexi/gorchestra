# Bind immutable attribution without granting lifecycle ownership

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Ordinary application code needs domain operations, not the ability to rebind callers or shut down shared resources.

## Decision

<a id="bind-01"></a>

### BIND-01 — Synchronous as

**Disposition:** accepted. **Implementation:** unimplemented.

PortfolioClient.as({ by, cid }) synchronously validates and copies attribution and checks existing owner admission, returning Result<Portfolio, InvalidInputError | StorageOperationFailedError>. No I/O, authentication, provider call, connection acquisition, or mutation of shared current caller. Bootstrap retains Client, hands Portfolio to application work, awaits it, then shuts down.

**Recorded rationale:** Caller scoping is immutable local binding over the same Portfolio, not another connection or authentication system.

<a id="bind-02"></a>

### BIND-02 — Detached readonly tree

**Disposition:** accepted. **Implementation:** unimplemented.

Bound functions close over the owner and immutable caller values, not this; destructuring/callback use needs no bind. Infer readonly namespace/function properties only in TypeScript. No runtime freeze, descriptors, proxies, or mutation guards, and no implied freezing of returned records.

**Recorded rationale:** Convenient callable operations are retained without a runtime tamper-proofing mechanism.

## Alternatives and supersession

- **BIND-01:** No additional alternative is selected by this record.
- **BIND-02:** No additional alternative is selected by this record.

## Consequences

Detached calls remain valid closures; TypeScript readonly is guidance, not runtime tamper resistance.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **BIND-01:** `S35` — `rework/foundation-model-contract.md`, lines 67–75; `S46` — `rework/sdk-handler-tree.md`, lines 28–30.
- **BIND-02:** `S46` — `rework/sdk-handler-tree.md`, lines 17–26; `S35` — `rework/foundation-model-contract.md`, lines 81.
