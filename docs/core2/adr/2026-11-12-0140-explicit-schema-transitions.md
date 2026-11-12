# Keep setup and migration explicit and atomic for the whole run

## Status

Decision disposition: accepted, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Initialization and upgrading are different user intents; native per-entry commits are too weak for the selected operation guarantee.

## Decision

<a id="trans-01"></a>

### TRANS-01 — Separate intents and full-run commit

**Disposition:** accepted. **Implementation:** unimplemented.

Setup runs the entire catalog on admitted empty storage; migrate runs all pending entries from a known nonempty prefix. One outer Repo session spans each complete up() run and new ledger entries; no intermediate commit or separate create-latest schema. Return ready only after commit; never switch intents or auto-initialize/upgrade/repair/reset/downgrade/convert legacy stores.

**Recorded rationale:** One requested transition either commits its whole run or rolls back its new work.

<a id="trans-h01"></a>

### TRANS-H01 — Historical per-version commits

**Disposition:** superseded. **Implementation:** unimplemented.

Earlier migration policy committed each completed version, retaining intermediate progress on later failure; a partial-setup/recreate recovery scenario also existed. Both are superseded by full-run atomicity.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** The user explicitly corrected setup and then migration to one all-or-nothing transaction for the complete invocation; earlier progress from that failed run no longer commits.

<a id="trans-h02"></a>

### TRANS-H02 — Historical automatic migration on open

**Disposition:** superseded. **Implementation:** unimplemented.

Automatic forward migration during opening with a newer-only schema refusal was superseded by validation-only exact-match opening. The unrestricted async manager then replaced that opening gate with internal domain guards; state-specific classification subsequently replaced the manager. No automatic upgrade is restored.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** Validation-only exact-match opening replaced automatic forward migration under the no-implicit-actions rule; explicit schema actions remain separate.

<a id="trans-02"></a>

### TRANS-02 — History-first errors

**Disposition:** accepted. **Implementation:** unimplemented.

Factory errors are invalid-input, storage-operation-failed, schema-metadata-invalid, schema-version-unrecognized, storage-not-empty and internal-error. Setup/migrate both include storage-operation-failed, schema-metadata-invalid, schema-version-unrecognized and internal-error. After valid history: setup adds storage-not-empty/storage-already-initialized; migrate adds storage-not-empty/storage-not-initialized/schema-already-current. Empty history with application containers is storage-not-empty; clean empty storage admits setup but not migrate, known proper prefix admits migrate but not setup, and complete catalog refuses either transition. History errors precede state refusals. Every listed lifecycle error except invalid-input contains exactly the discriminator `type` and no other field: storage-operation-failed, schema-metadata-invalid, schema-version-unrecognized, storage-not-empty, internal-error, storage-already-initialized, storage-not-initialized and schema-already-current are type-only. Expose no stored/expected schema versions, migration history, timestamps, diagnostics, messages, stacks, causes, inputs or credentials. The invalid-input exception is `{ type: 'invalid-input', issues: { path?: string, message: string }[] }`, containing only safe ordered Valleyed path/message issues, omitting absent paths and never echoing values or protected keys. as() uses this invalid-input contract or type-only storage-operation-failed; shutdown() has only type-only storage-operation-failed. Payload safety does not certify rollback or cleanup.

**Recorded rationale:** A stale capability must not conceal corruption/unknown history as a generic already-initialized outcome.

<a id="trans-h03"></a>

### TRANS-H03 — Historical unknown setup refusal

**Disposition:** superseded. **Implementation:** unimplemented.

The earlier rule returned storage-already-initialized even for newer/unrecognized history. It is superseded by validating raw history before applying lifecycle refusals.

**Original rationale:** Setup was an initial-setup operation, so initialized storage was refused without opening, upgrading or repairing it, even when current. The source treated recognized older/newer initialized stores alike at that stage.

**Reason superseded:** Raw-history validation must distinguish malformed/gapped/unknown history before valid-state refusals, including on retained setup capabilities.

## Alternatives and supersession

- **TRANS-01:** Supersedes [TRANS-H01](2026-11-12-0140-explicit-schema-transitions.md#trans-h01).
- **TRANS-H01:** Superseded by [TRANS-01](2026-11-12-0140-explicit-schema-transitions.md#trans-01).
- **TRANS-H02:** Superseded by [LIFE-H04](2026-11-12-0140-portfolio-lifecycle.md#life-h04).
- **TRANS-02:** Supersedes [TRANS-H03](2026-11-12-0140-explicit-schema-transitions.md#trans-h03).
- **TRANS-H03:** Superseded by [TRANS-02](2026-11-12-0140-explicit-schema-transitions.md#trans-02).

## Consequences

Deployments arrange non-overlapping maintenance. A failure preserves pre-call state only when rollback succeeds.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **TRANS-01:** `S35` — `rework/foundation-model-contract.md`, lines 156,225–241; `S25` — `rework/equipped-migration-capabilities.md`, lines 38–54.
- **TRANS-H01:** `S35` — `rework/foundation-model-contract.md`, lines 156,225–227.
- **TRANS-H02:** `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 1190–1200; `S47` — `rework/sdk-sql-migration-research.md`, lines 3,43; `S35` — `rework/foundation-model-contract.md`, lines 233.
- **TRANS-02:** `S35` — `rework/foundation-model-contract.md`, lines 53–55,67,71,113,117,127–144,170,205–211,245,251,257; `S45` — `rework/sdk-entry-class-proposal.md`, lines 27–38; `S38` — `rework/hermes-gorchestra-revision-draft.md`, lines 363–382; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 480–520.
- **TRANS-H03:** `S35` — `rework/foundation-model-contract.md`, lines 135,243–247.
