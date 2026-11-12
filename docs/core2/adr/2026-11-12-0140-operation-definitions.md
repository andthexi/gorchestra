# Infer bound operations from complete normalized definitions

## Status

Decision disposition: accepted, superseded. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: foundation.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

Independent broad pipe/handler fields can typecheck while contradicting each other. A declaration-only tree does not create callable runtime properties.

## Decision

<a id="def-01"></a>

### DEF-01 — Tree and node shape

**Disposition:** accepted. **Implementation:** unimplemented.

Author one metadata-bearing keyed tree, composed from focused namespace modules. Both groups/leaves have title/description; groups have children and no handler, leaves handler and no children. Reject both/neither. Leaves have input/output/error Valleyed pipes; the public tree exposes direct functions without children/handler path segments. No plugins, generic command bus, or behavior-rich domain entities.

**Recorded rationale:** A single definition owns paths, types and behavior binding.

<a id="def-02"></a>

### DEF-02 — Normalized error pipe

**Disposition:** accepted. **Implementation:** unimplemented.

defineOperation may omit only authoring error. It always returns title/description/input/output/error/handler with a real required error pipe. Omission uses shared errors directly; otherwise compose shared and specific errors once in defineOperation, never again in wrapper. Do not use v.or([]), permissive fallback or undeclared error branches.

**Recorded rationale:** Normalization simplifies downstream code while preserving exact effective errors.

<a id="def-03"></a>

### DEF-03 — Pipe-linked type directions

**Disposition:** accepted. **Implementation:** unimplemented.

Public arguments derive from PipeInput<I>, handler input from PipeOutput<I>, handler success/error from accepted output/error pipe inputs, public Result from parsed pipe outputs. Preserve transforming pipes and prevent handler inference widening sibling constraints, using NoInfer where needed. One named public object, or zero public arguments when internal input is undefined. Internal signature is handler(input, context).

**Recorded rationale:** Accepted versus parsed types must remain distinct; a broad satisfies constraint is insufficient.

<a id="def-h01"></a>

### DEF-H01 — Historical namespace deferral

**Disposition:** superseded. **Implementation:** unimplemented.

SDK namespace structure was explicitly deferred before the user resumed it and selected the metadata-bearing inferred handler tree. This old blanket deferral no longer blocks current foundation paths.

**Original rationale:** The cited record preserves the earlier choice and its reversal but does not record an original adoption rationale; no successor rationale is attributed to it.

**Reason superseded:** The user explicitly resumed namespace work and chose the definition-driven inferred handler tree. Other runtime/repository deferrals remain.

## Alternatives and supersession

- **DEF-01:** Supersedes [DEF-H01](2026-11-12-0140-operation-definitions.md#def-h01).
- **DEF-02:** No additional alternative is selected by this record.
- **DEF-03:** No additional alternative is selected by this record.
- **DEF-H01:** Superseded by [DEF-01](2026-11-12-0140-operation-definitions.md#def-01).

## Consequences

Keep metadata internal; namespace definitions compose real implemented leaves without a second handwritten interface.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **DEF-01:** `S46` — `rework/sdk-handler-tree.md`, lines 15–26,148–186.
- **DEF-02:** `S46` — `rework/sdk-handler-tree.md`, lines 190–206; `S35` — `rework/foundation-model-contract.md`, lines 85–93.
- **DEF-03:** `S46` — `rework/sdk-handler-tree.md`, lines 196–216,224–226; `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 532–536.
- **DEF-H01:** `S20` — `rework/deferred-functionality.md`, lines 76–78,120; `S46` — `rework/sdk-handler-tree.md`, lines 5–11.
