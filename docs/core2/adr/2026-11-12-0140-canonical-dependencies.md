# Resolve shared dependencies through global overrides

## Status

Decision disposition: accepted. Individual keyed statements below control mixed records.

Implementation: **unimplemented** at D1. Scope: delivery process.

ADR created: 2026-11-12-0140 UTC. Original decision date: unknown; filename time is promotion time, not a reconstructed decision date.

## Context

The baseline uses a machine-local Equipped path and an older Valleyed override. Latest declarations alone cannot express the agreed reproducible resolution.

## Decision

<a id="dep-01"></a>

### DEP-01 — Global exact resolution

**Disposition:** accepted. **Implementation:** unimplemented.

Keep every existing package manifest declaration/category unchanged as `latest`; the new package also declares `equipped: "latest"` and `valleyed: "latest"`. Set only global pnpm-workspace.yaml overrides to Equipped `5.3.4` and Valleyed `4.5.24`, covering all workspace and transitive copies without local-path or package-specific exceptions. Refresh the lockfile through pnpm.

**Recorded rationale:** Central policy aligns existing packages and the new library without duplicating pins in manifests.

<a id="dep-02"></a>

### DEP-02 — Published is not installed or qualified

**Disposition:** accepted. **Implementation:** unimplemented.

Both canonical dependencies are published. Verify actual fetched/installed resolution; do not wait for publication or silently downgrade. The Equipped introspection correction does not establish fixes for #148/#149. Report actual network/resolution or upgrade regressions without rewriting legacy code.

**Recorded rationale:** Publication, installation, and behavioral verification are different evidence claims.

### Published release evidence carried by the accepted plan

| Package         | Registry manifest                                      | Publication UTC          | Verified source commit                   |
| --------------- | ------------------------------------------------------ | ------------------------ | ---------------------------------------- |
| equipped 5.3.4  | [manifest](https://registry.npmjs.org/equipped/5.3.4)  | 2026-11-12T00:10:29.249Z | a99ea464cfd8d0e264e120c68f8a4f5962bfbafe |
| valleyed 4.5.24 | [manifest](https://registry.npmjs.org/valleyed/4.5.24) | 2026-11-11T23:56:57.350Z | 5dcb7c01f474c422886fd7452c3ac88641db8dcb |

This is the accepted plan's release evidence, not a fresh D1 install or registry probe. Version policy follows [pnpm overrides](https://pnpm.io/settings/dependency-resolution#overrides). Future version changes belong in global overrides, followed by a pnpm-generated lockfile refresh and recursive installed-resolution verification.

## Alternatives and supersession

- **DEP-01:** The old local-path/package-specific isolation strategy is not retained; global overrides replace all conflicting exceptions (accepted plan lines 82–104).
- **DEP-02:** No additional alternative is selected by this record.

## Consequences

Task 0 changes global overrides and pnpm-generated lockfile, then verifies root/workspace/transitive installs and upgrade regressions. D1 installs nothing.

The decision record does not claim runtime verification. Foundation implementation tasks must prove applicable behavior; paused scope requires separate authorization.

## Provenance

Sources are provenance labels, not required local links. The [coverage register](decision-coverage.md) records the complete source inventory and duplicate occurrences.

- **DEP-01:** `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 62–104,803–816.
- **DEP-02:** `P` — `accepted Core Foundation Implementation Plan (1420 lines; latest approved amendments)`, lines 64–81,814–816,1409–1416.
