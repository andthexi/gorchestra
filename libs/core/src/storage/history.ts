import { v } from 'valleyed'

import { appliedAtPipe, idPipe } from '../domain/commons'
import type { Result, SchemaMetadataInvalidError, SchemaVersionUnrecognizedError } from '../errors'

// Catalog IDs are trusted, append-only authoring data in migration order.
const historyPipe = v.array(v.object({ id: idPipe, appliedAt: appliedAtPipe }))

export function classifyMigrationHistory(
	history: unknown,
	catalogIds: readonly string[],
): Result<'empty' | 'migration' | 'ready', SchemaMetadataInvalidError | SchemaVersionUnrecognizedError> {
	// Validate every entry before duplicate, unknown-ID or prefix set logic.
	const parsed = v.validate(historyPipe, history)
	if (!parsed.valid) return { ok: false, error: { type: 'schema-metadata-invalid' } }
	const appliedIds = new Set(parsed.value.map(({ id }) => id))
	if (appliedIds.size !== parsed.value.length) return { ok: false, error: { type: 'schema-metadata-invalid' } }
	const knownIds = new Set(catalogIds)
	if (parsed.value.some(({ id }) => !knownIds.has(id)))
		return { ok: false, error: { type: 'schema-version-unrecognized' } }
	if (catalogIds.slice(0, appliedIds.size).some((id) => !appliedIds.has(id))) {
		return { ok: false, error: { type: 'schema-metadata-invalid' } }
	}
	if (parsed.value.length === 0) return { ok: true, value: 'empty' }
	return { ok: true, value: parsed.value.length === catalogIds.length ? 'ready' : 'migration' }
}

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest
	const ids = ['01k00000000000000000000001', '01k00000000000000000000002', '01k00000000000000000000003'] as const

	it('rejects malformed raw histories without exposing their contents', () => {
		const id = ids[0]
		const sentinel = 'synthetic-PROTECTED-history'
		const boxed: unknown = Object(id)
		const boxedTimestamp: unknown = Object(0)
		const spoof: unknown = JSON.parse(
			'{"constructor":{"name":"String"},"length":26,"value":"synthetic-PROTECTED-history"}',
		)
		const malformed = [
			null,
			undefined,
			{},
			'history',
			1,
			{ id, appliedAt: 0 },
			[null],
			[[]],
			['entry'],
			[{}],
			[{ id }],
			[{ appliedAt: 0 }],
			...[
				undefined,
				null,
				'',
				'01K00000000000000000000001',
				'8zzzzzzzzzzzzzzzzzzzzzzzzz',
				'01i00000000000000000000001',
				'01k0000000000000000000000',
				' 01k00000000000000000000001',
				'01k00000000000000000000001\n',
				boxed,
				spoof,
			].map((id) => [{ id, appliedAt: 0 }]),
			...[undefined, null, '0', -1, 1.5, 9007199254740992, NaN, Infinity, -Infinity, 0n, boxedTimestamp].map(
				(appliedAt) => [{ id, appliedAt }],
			),
			[
				{
					id: sentinel,
					appliedAt: { value: sentinel },
					valueRef: sentinel,
					cause: sentinel,
					[sentinel]: sentinel,
				},
			],
		]
		for (const candidate of malformed) {
			const result = classifyMigrationHistory(candidate, ids)
			expect.soft(result).toEqual({ ok: false, error: { type: 'schema-metadata-invalid' } })
			expect.soft(JSON.stringify(result)).not.toContain(sentinel)
		}
	})

	it('classifies a nonempty proper prefix regardless of entry or timestamp order', () => {
		const history = [
			{ id: ids[1], appliedAt: 0, valueRef: 'synthetic-extra' },
			{ id: ids[0], appliedAt: 9007199254740991, cause: 'synthetic-extra' },
		]
		const original = structuredClone(history)
		expect(classifyMigrationHistory([{ id: ids[0], appliedAt: 0 }], ids)).toEqual({ ok: true, value: 'migration' })
		expect(classifyMigrationHistory(history, ids)).toEqual({ ok: true, value: 'migration' })
		expect(history).toEqual(original)
	})

	it('classifies complete membership as ready independent of entry and timestamp order', () => {
		for (const entries of [
			[
				{ id: ids[2], appliedAt: 2 },
				{ id: ids[0], appliedAt: 3 },
				{ id: ids[1], appliedAt: 1 },
			],
			ids.map((id) => ({ id, appliedAt: 0 })),
		]) {
			expect(classifyMigrationHistory(entries, ids)).toEqual({ ok: true, value: 'ready' })
		}
		expect(classifyMigrationHistory([{ id: ids[0], appliedAt: 0 }], [ids[0]])).toEqual({ ok: true, value: 'ready' })
	})

	it('rejects duplicate IDs without deduplicating history', () => {
		const entries = [
			{ id: ids[0], appliedAt: 0 },
			{ id: ids[0], appliedAt: 1 },
		]
		const original = structuredClone(entries)
		expect(classifyMigrationHistory(entries, ids)).toEqual({
			ok: false,
			error: { type: 'schema-metadata-invalid' },
		})
		expect(entries).toEqual(original)
	})

	it('rejects unknown valid IDs with only the schema-version-unrecognized type', () => {
		const unknown = { id: '01k00000000000000000000009', appliedAt: 0, valueRef: 'synthetic-PROTECTED' }
		for (const entries of [[unknown], [{ id: ids[0], appliedAt: 1 }, unknown]]) {
			expect(classifyMigrationHistory(entries, ids)).toEqual({
				ok: false,
				error: { type: 'schema-version-unrecognized' },
			})
		}
	})

	it('validates later malformed entries before classifying earlier unknown IDs', () => {
		const unknown = { id: '01k00000000000000000000009', appliedAt: 0 }
		for (const invalid of [{ id: ids[0], appliedAt: -1 }, { id: 'invalid', appliedAt: 0 }, null]) {
			expect(classifyMigrationHistory([unknown, invalid], ids)).toEqual({
				ok: false,
				error: { type: 'schema-metadata-invalid' },
			})
		}
	})

	it('rejects duplicates before unknown IDs', () => {
		const unknown = { id: '01k00000000000000000000009', appliedAt: 0 }
		for (const entries of [
			[unknown, unknown],
			[unknown, { id: ids[0], appliedAt: 0 }, { id: ids[0], appliedAt: 1 }],
		]) {
			expect(classifyMigrationHistory(entries, ids)).toEqual({
				ok: false,
				error: { type: 'schema-metadata-invalid' },
			})
		}
	})

	it('rejects gaps instead of inferring progression from the latest ID or time', () => {
		for (const entries of [
			[{ id: ids[1], appliedAt: 0 }],
			[{ id: ids[2], appliedAt: 9007199254740991 }],
			[
				{ id: ids[2], appliedAt: 0 },
				{ id: ids[0], appliedAt: 1 },
			],
		]) {
			const original = structuredClone(entries)
			expect(classifyMigrationHistory(entries, ids)).toEqual({
				ok: false,
				error: { type: 'schema-metadata-invalid' },
			})
			expect(entries).toEqual(original)
		}
	})

	it('rejects unknown valid IDs before gaps', () => {
		expect(
			classifyMigrationHistory(
				[
					{ id: ids[2], appliedAt: 0 },
					{ id: '01k00000000000000000000009', appliedAt: 1 },
				],
				ids,
			),
		).toEqual({ ok: false, error: { type: 'schema-version-unrecognized' } })
	})

	it('classifies an empty raw ledger as empty', () => {
		expect(classifyMigrationHistory([], ids)).toEqual({ ok: true, value: 'empty' })
	})
}
