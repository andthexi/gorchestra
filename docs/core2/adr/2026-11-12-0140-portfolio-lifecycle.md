# Expose state-specific Portfolio lifecycle capabilities

## Status

Decision disposition: accepted, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

A single unrestricted object lets typed callers use domain work before setup or call migration on ready storage.

## Decision

<a id="life-01"></a>

### LIFE-01 — Factory and capabilities

**Disposition:** accepted. **Implementation:** unimplemented.

PortfolioClient.new(dependencies) asynchronously validates/starts storage, constructs Repo/Migrator, and returns Result<PortfolioSetup | PortfolioMigration | PortfolioClient,E>. Readonly state is respectively uninitialized/migration/ready. Setup exposes setup/shutdown; Migration exposes migrate/shutdown; ready Client exposes as/shutdown. Portfolio exposes only attributed domain handlers. No start, connect, isMigrated, readiness boolean, or public direct capability construction.

**Recorded rationale:** Classify before granting capabilities instead of relying solely on error Results for locally invalid combinations.

<a id="life-h01"></a>

### LIFE-H01 — Historical synchronous new

**Disposition:** superseded. **Implementation:** unimplemented.

GorchestraCore.new was required to be synchronous local construction with no hidden asynchronous startup; broader two-object return wrapping and input routing remained proposals. The intermediate asynchronous manager superseded this synchrony constraint before state-specific capabilities replaced that manager.

**Original rationale:** The selected boundary treated new as local construction, validation and binding, separately from physical connection readiness and schema readiness. It explicitly ruled out a connection-ready asynchronous factory and hidden pending startup at that stage.

**Reason superseded:** The later selected async manager established the shared storage resource before returning, replacing synchrony while retaining explicit schema actions.

<a id="life-h02"></a>

### LIFE-H02 — Historical unrestricted async manager

**Disposition:** superseded. **Implementation:** unimplemented.

The intermediate adopted GorchestraCore async new returned one connection-ready unrestricted manager exposing setup/migrate/isMigrated/domain work and shutdown. It removed separate public start/connect and GorchestraCoreConnection/CoreConnection. Construction allowed clean uninitialized or supported older storage so explicit setup/migrate remained reachable; domain operations instead enforced an internal schema-readiness guard. It was not a schema-ready or state-specific public capability.

**Original rationale:** Connection readiness before returning the manager avoided partially started access, while allowing uninitialized/older storage kept explicit setup and migrate reachable. One owner retained the shared adapter and cleanup capability.

**Reason superseded:** State-specific capabilities prevent locally invalid typed call combinations that the unrestricted manager could only reject at runtime, without duplicating resources.

<a id="life-h03"></a>

### LIFE-H03 — Historical connect and connection object

**Disposition:** superseded. **Implementation:** unimplemented.

Earlier opening/connect executed against already-started storage and returned a promised Result<GorchestraCoreConnection,E>, where E was an illustrative error-union placeholder. The connection was the usable Portfolio-scoped domain interface, not an independent physical shutdown owner. The intermediate unrestricted asynchronous GorchestraCore manager removed public connect and GorchestraCoreConnection/CoreConnection, before the state-specific classifier. There is no retained alias.

**Original rationale:** The selected promised Result made successful domain access and expected failures explicit. Requiring started storage separated connection startup from the validation-only opening operation; it did not decide a new startup wrapper.

**Reason superseded:** The async manager combined connection-ready construction, schema operations and domain access under one shared owner, explicitly removing the second connection step/object.

<a id="life-02"></a>

### LIFE-02 — Immutable transition views

**Disposition:** accepted. **Implementation:** unimplemented.

Successful setup/migrate returns a fresh ready PortfolioClient over the same owner after commit. Old objects keep their readonly state and recheck authoritative history on later transition calls; no mutable discriminant, retired-view flag/error, automatic forwarding or new resource lifetime.

**Recorded rationale:** Consumers may have narrowed old aliases; static views are not current storage truth.

<a id="life-03"></a>

### LIFE-03 — Typed misuse versus runtime reality

**Disposition:** accepted. **Implementation:** unimplemented.

Make expressible invalid local call combinations unavailable through public types/construction. Retain runtime input/admission/domain guards for JavaScript, casts, stale aliases and races. Do not promise linear ownership or compile-time prevention of use after shutdown. Ordinary schema polling is separately deferred.

**Recorded rationale:** TypeScript cannot consume aliases or freeze external state across awaits.

<a id="life-h04"></a>

### LIFE-H04 — Historical exact-match opening

**Disposition:** superseded. **Implementation:** unimplemented.

The intermediate selected open/connect admitted only exact current schema; older/newer storage returned type-only schema-mismatch, and confirmed uninitialized storage returned type-only storage-not-initialized. No read-only fallback or setup/migration was allowed during opening; separate explicitly invoked setup/migration remained selected and reachable without successful opening. The unrestricted async manager then moved schema admission from opening into internal domain-operation guards while allowing uninitialized/older construction. State-specific classification later replaced that manager, and ordinary-operation schema polling was subsequently deferred.

**Original rationale:** The selected opening gate performed only compatibility validation and returned errors instead of silently upgrading, repairing or providing best-effort domain access. Explicit setup and migration remained separate intents.

**Reason superseded:** The manager needed construction to succeed before schema readiness so setup/migrate remained reachable; schema guards moved to domain calls. Classification and the later polling deferral are subsequent generations, not the immediate replacement.

<a id="life-h05"></a>

### LIFE-H05 — Historical read-only isMigrated capability

**Disposition:** superseded. **Implementation:** unimplemented.

A separate read-only isMigrated capability was selected, with exact status Results/outcomes still open. It survived removal of connect/CoreConnection in the unrestricted asynchronous GorchestraCore manager. The subsequent state-specific classification design removed isMigrated completely: migration need comes from the migration capability, while uninitialized is not ready. No readiness boolean, status alias or check-then-call protocol replaces it.

**Original rationale:** The selected capability supplied a read-only up-to-date migration check on Core-managed connected storage. Its existence was selected, but exact status outcomes were left open.

**Reason superseded:** An awaited status snapshot cannot grant a typed capability or lock future state. The classification/transition result supplies the actual capability; uninitialized is not ready.

### Lifecycle replacement order

- [Synchronous local new](#life-h01), [connect/connection](#life-h03) and [exact-match opening](#life-h04) were replaced by the [unrestricted asynchronous manager](#life-h02). That manager acquired resources before returning and moved schema readiness checks to domain operations, not implicit setup/migration.
- [isMigrated](#life-h05) remained on that manager until [state-specific classification](#life-01) removed it and replaced the unrestricted public surface.
- The [ordinary internal schema guard](2026-11-12-0140-schema-polling.md#limit-h01) survived as runtime protection until [ordinary-operation schema polling was deferred](2026-11-12-0140-schema-polling.md#limit-01). Current schema/history checks stay at new/setup/migrate, not each domain call.

## Alternatives and supersession

- **LIFE-01:** Supersedes [LIFE-H02](2026-11-12-0140-portfolio-lifecycle.md#life-h02), [LIFE-H05](2026-11-12-0140-portfolio-lifecycle.md#life-h05).
- **LIFE-H01:** Superseded by [LIFE-H02](2026-11-12-0140-portfolio-lifecycle.md#life-h02).
- **LIFE-H02:** Supersedes [LIFE-H01](2026-11-12-0140-portfolio-lifecycle.md#life-h01), [LIFE-H03](2026-11-12-0140-portfolio-lifecycle.md#life-h03), [LIFE-H04](2026-11-12-0140-portfolio-lifecycle.md#life-h04). Superseded by [LIFE-01](2026-11-12-0140-portfolio-lifecycle.md#life-01).
- **LIFE-H03:** Superseded by [LIFE-H02](2026-11-12-0140-portfolio-lifecycle.md#life-h02).
- **LIFE-02:** No additional alternative is selected by this record.
- **LIFE-03:** No additional alternative is selected by this record.
- **LIFE-H04:** Supersedes [TRANS-H02](2026-11-12-0140-explicit-schema-transitions.md#trans-h02). Superseded by [LIFE-H02](2026-11-12-0140-portfolio-lifecycle.md#life-h02).
- **LIFE-H05:** Superseded by [LIFE-01](2026-11-12-0140-portfolio-lifecycle.md#life-01).

## Consequences

Constructors remain non-public, returned records remain plain data, and stale aliases still require runtime checks. No public manager or second connection layer.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **LIFE-01:** `S35` — `rework/foundation-model-contract.md`, lines 45–50,59–75,115–125; `S19` — `rework/consumer-api-safety-audit.md`, lines 17–21,38–52; `S45` — `rework/sdk-entry-class-proposal.md`, lines 5–21.
- **LIFE-H01:** `S45` — `rework/sdk-entry-class-proposal.md`, lines 111–121; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 158–164.
- **LIFE-H02:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 158–164; `S19` — `rework/consumer-api-safety-audit.md`, lines 23–27.
- **LIFE-H03:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 315–331,158–164; `S45` — `rework/sdk-entry-class-proposal.md`, lines 153–155.
- **LIFE-02:** `S35` — `rework/foundation-model-contract.md`, lines 119–125.
- **LIFE-03:** `S19` — `rework/consumer-api-safety-audit.md`, lines 25–32,68–83; `S35` — `rework/foundation-model-contract.md`, lines 125.
- **LIFE-H04:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 1188–1200,1224–1230,329–331,158–164; `S35` — `rework/foundation-model-contract.md`, lines 233.
- **LIFE-H05:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 331,1236,158–164; `S19` — `rework/consumer-api-safety-audit.md`, lines 17–19,62–66.
