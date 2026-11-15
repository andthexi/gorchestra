# Core Documentation DOX

## Purpose

The `docs/core/` tree documents domain language and architectural decisions for the current Core implementation at `libs/core` (`@gorchestra/core`).

## Ownership

- `CONTEXT.md` owns domain terms and relationships in glossary form.
- `adr/` owns individual architectural decisions. Do not add an ADR README, decision inventory or standalone contract specification.
- The [package README](../../libs/core/README.md) and [source instructions](../../libs/core/AGENTS.md) own implemented usage, schemas, API details and verification guidance.

## Local Contracts

- Read [context](CONTEXT.md) and affected [ADRs](adr/) before changing language or decisions.
- Use unnumbered Core/domain names in prose and code. The package is `@gorchestra/core`; its documentation lives in this directory.
- Describe current boundaries and accepted designs without retired implementation comparisons or coexistence/cutover instructions. Consumer remains an architectural role; no Consumer application is implemented.
- Offer an ADR only if **all three** hold: it is hard to reverse, surprising without context, and the result of a real tradeoff with genuine alternatives. If any is missing, skip it. Acceptance, importance, task delivery, deferral or a future review checkpoint alone is insufficient.
- Prefer a short title and 1–3 sentences for context, decision and why. Add status, options or consequences only when useful. Keep the `YYYY-MM-DD-HHMM-slug.md` filename convention.
- Keep decisions self-contained with their context, chosen approach, tradeoff and limits. Include substantive evidence or cite maintained source material; never use temporary planning notes as citations. Preserve actual replacement links without reproducing intermediate planning exchanges or inventing alternatives.
- Keep acceptance separate from implementation status. Accepted designs do not authorize paused Expedition/downstream work or a new Consumer application.

## Work Guidance

- Keep `CONTEXT.md` a glossary, not a schema/API specification, task checklist or verification report.
- Distinguish Core-owned Stored Secret Values and Portfolio Secret Protection from Consumer encryption-key provisioning. Core-owned protection and Snapshot export/import are implemented; the package README owns usage and verification scope. Do not describe Consumer codec callbacks or external-store references as the current Secret API.
- Portfolio Import requires a ready Portfolio and means atomic replacement with preserved imported identities and relationships, not initialization or record merging. Snapshots always include Secret values under passphrase encryption, never the Portfolio encryption key. Import uses the destination's opening key or explicit plaintext mode, never a per-import replacement key.
- Snapshots carry the source's final validated catalog migration ID, not a restorable migration ledger. Export captures that ID with the data; import revalidates destination history inside the replacement transaction and requires an exact recognized ID match before writes. Never infer migration order from timestamps, overwrite the destination ledger or convert mismatched Snapshots.
- Import validates payload and record schemas, not cross-record relationships or graph consistency; do not add duplicate-ID constraints, deduplication, a relationship audit or data repair. Preserve exported domain data except conversion of Audit Stamps to imported attribution and the agreed Secret-value reprotection under the destination's opening key/mode. Snapshot authentication, migration compatibility and atomic storage-failure handling still apply. Schema-valid data is not a certification of relational integrity.
- Imported Audit Stamps use `{ src: 'imported', at, iat }`: preserve the original `at`, remove `by`/`cid`, and refresh `iat` to this import's time on every import, including already-imported stamps. Subsequent local operations create ordinary local stamps.
- MVP Snapshot export/import processes complete serialized strings in memory without a Core-enforced size cap or streaming. Document memory exhaustion and long exclusive-lock holds as limitations; bounded-memory processing and size controls are post-MVP work.
- Core requires the supplied adapter to declare Equipped's storage-wide, non-waiting shared/exclusive locking capability. Opening and ordinary operations use shared access; setup, migration, export and import use exclusive access through commit/rollback. Core checks required capabilities at construction, not backend names; missing capabilities fail rather than falling back to local locks or weaker coordination. Backend-specific multi-client/process and crash-recovery qualification belongs in Equipped, while Core retains its InMemory test scope. Lock ownership must recover safely after session/process loss and prevent commit after ownership is lost; a timer alone must never release access while the previous transaction can still commit. Every storage-backed operation validates native migration history against its catalog under the lock before its handler; incompatible history closes that client's operation admission while preserving shutdown, requiring explicit reopening with compatible Core code. Do not introduce a duplicate schema-version marker or claim that participating-client locks cover direct database access.
- Document working package usage alongside source changes. Do not move unimplemented method tables or implementation plans into the glossary or a renamed catalog.
- Prefer source/context links over duplicating detailed contracts across documents.
- Keep the Equipped choice and dependency-owned storage responsibilities in the [storage foundation ADR](adr/2026-11-14-1432-equipped-storage.md); package usage documents Core-owned behavior and Consumer obligations rather than repeating dependency guarantees.

## Verification

- Check relative links and owned Markdown formatting. Verify relevant source behavior when documenting implemented usage.
- Document the direct root `pnpm` workflow accurately: checks run on the runner, not in a container or offline sandbox.
- Do not force-add or rewrite ignored notes or unrelated files.

## Child DOX Index

- `adr/` — Core architectural decisions. No child AGENTS.md currently required.
