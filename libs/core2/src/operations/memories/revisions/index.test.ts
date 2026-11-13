import { describe, expect, it } from 'vitest'

import { createCountedSecretDependencies } from '../../../testing/dependencies'
import { createMemoryFixture, requireSuccess, withReadyPortfolio } from '../../../testing/fixtures'

describe('Memory revisions', () => {
	it('validates the full selected revision records before find or history sorting', async () => {
		const { dependencies } = createCountedSecretDependencies()
		const adapter = dependencies.storage.adapter
		const findMany = adapter.findMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const { parent } = await createMemoryFixture(portfolio)
			try {
				for (const corruption of [
					{ id: 'invalid' },
					{ memoryId: 'invalid' },
					{ version: 0 },
					{ version: '1' },
					{ version: 9007199254740992 },
					{ title: '  ' },
					{ body: null },
					{ body: 1 },
					{ created: { ...parent.revision.created, cid: undefined } },
				]) {
					adapter.findMany = async (...args) => {
						const rows = await findMany(...args)
						return args[0].name === 'memory_revisions' ? rows.map((row) => ({ ...row, ...corruption })) : rows
					}
					expect(await portfolio.memories.revisions.find({ revisionId: parent.revision.id })).toEqual({
						ok: false,
						error: { type: 'invalid-storage-output' },
					})
					expect(await portfolio.memories.revisions.list({ memoryId: parent.memory.id })).toEqual({
						ok: false,
						error: { type: 'invalid-storage-output' },
					})
				}
			} finally {
				adapter.findMany = findMany
			}
			expect(requireSuccess(await portfolio.memories.revisions.list({ memoryId: parent.memory.id }))).toEqual([parent.revision])
		}, dependencies)
	})
	it('lists every full revision by version under a required valid Memory, including empty history', async () => {
		const { dependencies, codecCalls } = createCountedSecretDependencies()
		const adapter = dependencies.storage.adapter
		const findMany = adapter.findMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const pair = requireSuccess(await portfolio.memories.create({ parentId: null, title: 'Original', body: 'first' }))
			const other = requireSuccess(await portfolio.memories.create({ parentId: null, title: 'Other', body: 'unrelated' }))
			const history = [
				pair.revision,
				...Array.from({ length: 124 }, (_, index) => ({
					...pair.revision,
					id: `01k${(124 - index).toString().padStart(23, '0')}`,
					version: index + 2,
					title: `Snapshot ${index + 2}`,
					body: `  body É ${index + 2}\n`,
					created: { ...pair.revision.created, at: new Date(index * 1000).toISOString(), by: `author ${index}` },
				})),
			]
			for (const row of [...history].reverse()) adapter.stores.get('memory_revisions')!.set(row.id, row)
			const last = history.at(-1)!
			const current = { ...pair.memory, revision: { id: last.id, version: last.version, title: last.title } }
			adapter.stores.get('memories')!.set(pair.memory.id, current)
			const { list } = portfolio.memories.revisions
			expect(requireSuccess(await list({ memoryId: pair.memory.id }))).toEqual(history)
			expect(requireSuccess(await portfolio.memories.find({ memoryId: pair.memory.id }))).toEqual(current)
			const returned = requireSuccess(await list({ memoryId: pair.memory.id }))
			returned[0]!.body = 'mutated'
			returned[0]!.created.by = 'mutated'
			returned.reverse()
			expect(requireSuccess(await list({ memoryId: pair.memory.id }))).toEqual(history)
			adapter.stores.get('memory_revisions')!.set(other.revision.id, { ...other.revision, body: undefined })
			expect(requireSuccess(await list({ memoryId: pair.memory.id }))).toEqual(history)
			adapter.stores.get('memory_revisions')!.set(last.id, { ...last, created: { ...last.created, cid: undefined } })
			expect(await list({ memoryId: pair.memory.id })).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
			adapter.stores.get('memory_revisions')!.clear()
			expect(requireSuccess(await list({ memoryId: pair.memory.id }))).toEqual([])
			expect(adapter.stores.get('memories')!.get(pair.memory.id)).toEqual(current)
			const missing = '01k00000000000000000000999'
			expect(await list({ memoryId: missing })).toEqual({ ok: false, error: { type: 'not-found', resource: 'memory', id: missing } })
			const reads: string[] = []
			adapter.findMany = (...args) => {
				reads.push(args[0].name)
				return findMany(...args)
			}
			try {
				for (const corruption of [
					{ parentId: undefined },
					{ revision: { ...current.revision, title: '' } },
					{ created: { ...current.created, cid: undefined } },
				]) {
					adapter.stores.get('memories')!.set(pair.memory.id, { ...current, ...corruption })
					expect(await list({ memoryId: pair.memory.id })).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
					expect(reads.splice(0)).toEqual(['memories'])
				}
			} finally {
				adapter.findMany = findMany
			}
			expect(codecCalls).toEqual({ encodes: 0, decodes: 0 })
		}, dependencies)
	})
	it('finds an exact full immutable snapshot without looking up its Memory or following latest', async () => {
		const { dependencies, codecCalls } = createCountedSecretDependencies()
		const adapter = dependencies.storage.adapter
		const findMany = adapter.findMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const pair = requireSuccess(await portfolio.memories.create({ parentId: null, title: 'Original', body: '  first É\n' }))
			const newer = {
				...pair.revision,
				id: '01k00000000000000000000002',
				version: 2,
				title: 'New',
				body: 'new',
				created: { ...pair.revision.created, by: 'new author' },
			}
			adapter.stores.get('memory_revisions')!.set(newer.id, newer)
			adapter.stores
				.get('memories')!
				.set(pair.memory.id, { ...pair.memory, revision: { id: newer.id, version: newer.version, title: newer.title } })
			const stored = { ...pair.revision, title: '  Original  ', ignored: true, created: { ...pair.revision.created, ignored: true } }
			adapter.stores.get('memory_revisions')!.set(pair.revision.id, stored)
			const reads: string[] = []
			adapter.findMany = (...args) => {
				reads.push(args[0].name)
				return findMany(...args)
			}
			try {
				const { find } = portfolio.memories.revisions
				const found = requireSuccess(await find({ revisionId: pair.revision.id }))
				expect(found).toEqual(pair.revision)
				expect(reads.splice(0)).toEqual(['memory_revisions'])
				found.body = 'mutated'
				found.created.by = 'mutated'
				expect(requireSuccess(await find({ revisionId: pair.revision.id }))).toEqual(pair.revision)
				expect(requireSuccess(await find({ revisionId: newer.id }))).toEqual(newer)
				expect(adapter.stores.get('memory_revisions')!.get(pair.revision.id)).toEqual(stored)
				const missing = '01k00000000000000000000001'
				expect(await find({ revisionId: missing })).toEqual({
					ok: false,
					error: { type: 'not-found', resource: 'memory-revision', id: missing },
				})
				adapter.stores.get('memories')!.delete(pair.memory.id)
				expect(requireSuccess(await find({ revisionId: pair.revision.id }))).toEqual(pair.revision)
				for (const corruption of [
					{ body: undefined },
					{ memoryId: 'invalid' },
					{ created: { ...pair.revision.created, cid: undefined } },
				]) {
					adapter.stores.get('memory_revisions')!.set(pair.revision.id, { ...pair.revision, ...corruption })
					expect(await find({ revisionId: pair.revision.id })).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
				}
				expect(reads.every((name) => name === 'memory_revisions')).toBe(true)
				expect(codecCalls).toEqual({ encodes: 0, decodes: 0 })
			} finally {
				adapter.findMany = findMany
			}
		}, dependencies)
	})
})
