import { describe, expect, it } from 'vitest'

import type { Portfolio } from '../../index'
import { createCountedSecretDependencies } from '../../testing/dependencies'
import { createMemoryFixture, requireSuccess, withReadyPortfolio } from '../../testing/fixtures'

async function expectInvalid(operation: (...args: never[]) => unknown, input: unknown, path?: string) {
	const result: unknown = await Reflect.apply(operation, undefined, [input])
	expect(JSON.stringify(result)).not.toContain('synthetic-PROTECTED')
	expect(result).toMatchObject({
		ok: false,
		error: { type: 'invalid-input', ...(path === undefined ? {} : { issues: [{ path }] }) },
	})
}

async function withInputRefusal(work: (memories: Portfolio['memories']) => Promise<void>) {
	const { dependencies, codecCalls } = createCountedSecretDependencies()
	const adapter = dependencies.storage.adapter
	const session = adapter.session.bind(adapter)
	await withReadyPortfolio(async (portfolio) => {
		let sessions = 0
		adapter.session = () => {
			sessions++
			throw new Error('Invalid input must not start a transaction')
		}
		try {
			await work(portfolio.memories)
			expect({ sessions, ...codecCalls }).toEqual({ sessions: 0, encodes: 0, decodes: 0 })
		} finally {
			adapter.session = session
		}
	}, dependencies)
}

describe('memories', () => {
	it('returns a parsed native pair and ignores caller-supplied identity, creation and summary', async () => {
		const { dependencies } = createCountedSecretDependencies()
		const adapter = dependencies.storage.adapter
		const createMany = adapter.createMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const input = {
				parentId: null,
				title: '  Notes  ',
				body: '',
				id: 'caller-id',
				created: {},
				revision: { id: 'caller-revision', version: 42 },
				ignored: true,
			}
			adapter.createMany = async (...args) => (await createMany(...args)).map((row) => ({ ...row, ignored: 'synthetic-PROTECTED' }))
			try {
				const pair = requireSuccess(await portfolio.memories.create(input))
				expect(Object.keys(pair.memory).sort()).toEqual(['created', 'id', 'parentId', 'revision'])
				expect(Object.keys(pair.revision).sort()).toEqual(['body', 'created', 'id', 'memoryId', 'title', 'version'])
				expect(pair.memory.id).not.toBe(input.id)
				expect(pair.memory.revision).toEqual({ id: pair.revision.id, version: 1, title: 'Notes' })
				expect(pair.revision.body).toBe('')
				expect(pair.memory.created).toEqual(pair.revision.created)
				expect(input).toEqual({
					parentId: null,
					title: '  Notes  ',
					body: '',
					id: 'caller-id',
					created: {},
					revision: { id: 'caller-revision', version: 42 },
					ignored: true,
				})
				expect(requireSuccess(await portfolio.memories.find({ memoryId: pair.memory.id }))).toEqual(pair.memory)
				expect(requireSuccess(await portfolio.memories.revisions.find({ revisionId: pair.revision.id }))).toEqual(pair.revision)
			} finally {
				adapter.createMany = createMany
			}
		}, dependencies)
	})
	it('rejects malformed identifiers before any transaction or codec', async () => {
		await withInputRefusal(async ({ create, find, list, revisions }) => {
			const id = '01k00000000000000000000001'
			const boxed: unknown = Object('text')
			for (const invalid of [
				undefined,
				'',
				id.toUpperCase(),
				` ${id}`,
				`${id}\n`,
				'8zzzzzzzzzzzzzzzzzzzzzzzzz',
				1,
				boxed,
				{ constructor: { name: 'String' } },
			]) {
				for (const [operation, input, path] of [
					[create, { parentId: invalid, title: 'Title', body: '' }, 'parentId'],
					[list, { parentId: invalid }, 'parentId'],
					[find, { memoryId: invalid }, 'memoryId'],
					[revisions.find, { revisionId: invalid }, 'revisionId'],
					[revisions.list, { memoryId: invalid }, 'memoryId'],
				] as const)
					await expectInvalid(operation, input, path)
			}
			for (const [operation, field] of [
				[find, 'memoryId'],
				[revisions.find, 'revisionId'],
				[revisions.list, 'memoryId'],
			] as const)
				await expectInvalid(operation, { [field]: null })
		})
	})
	it('rejects nonprimitive text, omitted fields and throwing getters before any transaction or codec', async () => {
		await withInputRefusal(async ({ create, find, list, revisions }) => {
			const boxed: unknown = Object('text')
			for (const field of ['title', 'body']) {
				for (const invalid of [undefined, null, 1, boxed, { constructor: { name: 'String' } }])
					await expectInvalid(create, { parentId: null, title: 'Title', body: '', [field]: invalid }, field)
			}
			for (const title of ['', ' 	\r\n'])
				expect(await create({ parentId: null, title, body: '' })).toEqual({
					ok: false,
					error: { type: 'invalid-input', issues: [{ path: 'title', message: 'Expected a nonblank title.' }] },
				})
			for (const operation of [create, find, list, revisions.find, revisions.list]) {
				for (const input of [undefined, null, {}, [], 1]) await expectInvalid(operation, input)
			}
			for (const input of [
				{ title: 'Title', body: '' },
				{ parentId: null, body: '' },
				{ parentId: null, title: 'Title' },
			])
				await expectInvalid(create, input)
			expect(
				await create({
					parentId: null,
					get title(): string {
						throw new Error('synthetic-PROTECTED')
					},
					body: '',
				}),
			).toEqual({
				ok: false,
				error: { type: 'invalid-input', issues: [{ message: 'Invalid input.' }] },
			})
		})
	})
	it('refuses foreign Portfolio references without disclosing their records', async () => {
		const foreign = await withReadyPortfolio(async (portfolio) =>
			requireSuccess(await portfolio.memories.create({ parentId: null, title: 'Foreign', body: 'foreign body' })),
		)
		await withReadyPortfolio(async (portfolio) => {
			for (const result of [
				await portfolio.memories.create({ parentId: foreign.memory.id, title: 'Child', body: '' }),
				await portfolio.memories.find({ memoryId: foreign.memory.id }),
				await portfolio.memories.list({ parentId: foreign.memory.id }),
				await portfolio.memories.revisions.list({ memoryId: foreign.memory.id }),
			])
				expect(result).toEqual({ ok: false, error: { type: 'not-found', resource: 'memory', id: foreign.memory.id } })
			expect(await portfolio.memories.revisions.find({ revisionId: foreign.revision.id })).toEqual({
				ok: false,
				error: { type: 'not-found', resource: 'memory-revision', id: foreign.revision.id },
			})
			expect(requireSuccess(await portfolio.memories.list({ parentId: null }))).toEqual([])
		})
	})
	it('validates every stored Memory field before parent decisions or compact reads', async () => {
		const { dependencies, codecCalls } = createCountedSecretDependencies()
		const adapter = dependencies.storage.adapter
		const findMany = adapter.findMany.bind(adapter)
		const createMany = adapter.createMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const { parent } = await createMemoryFixture(portfolio)
			let writes = 0
			adapter.createMany = (...args) => {
				writes++
				return createMany(...args)
			}
			try {
				for (const corruption of [
					{ id: 'invalid' },
					{ parentId: 'invalid' },
					...[{ id: 'invalid' }, { version: '1' }, { version: 9007199254740992 }, { title: 1 }].map((revision) => ({
						revision: { ...parent.memory.revision, ...revision },
					})),
					{ created: { ...parent.memory.created, cid: undefined } },
				]) {
					// Malformed IDs must reach the selected-row boundary, not be excluded by native filtering.
					adapter.findMany = async (...args) => {
						const rows = await findMany(...args)
						return args[0].name === 'memories' ? rows.map((row) => ({ ...row, ...corruption })) : rows
					}
					for (const result of [
						await portfolio.memories.create({ parentId: parent.memory.id, title: 'Child', body: '' }),
						await portfolio.memories.find({ memoryId: parent.memory.id }),
						await portfolio.memories.list({ parentId: parent.memory.id }),
						await portfolio.memories.list({ parentId: null }),
						await portfolio.memories.revisions.list({ memoryId: parent.memory.id }),
					])
						expect(result).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
				}
				expect(writes).toBe(0)
			} finally {
				adapter.findMany = findMany
				adapter.createMany = createMany
			}
			expect(requireSuccess(await portfolio.memories.find({ memoryId: parent.memory.id }))).toEqual(parent.memory)
			expect(codecCalls).toEqual({ encodes: 0, decodes: 0 })
		}, dependencies)
	})
	it('classifies rejected native reads safely and permits explicit retry without writes', async () => {
		const { dependencies, codecCalls } = createCountedSecretDependencies()
		const adapter = dependencies.storage.adapter
		const findMany = adapter.findMany.bind(adapter)
		const createMany = adapter.createMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const { parent, child } = await createMemoryFixture(portfolio)
			let writes = 0
			adapter.createMany = (...args) => {
				writes++
				return createMany(...args)
			}
			adapter.findMany = () => {
				throw new Error('synthetic-PROTECTED')
			}
			try {
				for (const result of [
					await portfolio.memories.create({ parentId: parent.memory.id, title: 'Child', body: '' }),
					await portfolio.memories.find({ memoryId: parent.memory.id }),
					await portfolio.memories.list({ parentId: parent.memory.id }),
					await portfolio.memories.list({ parentId: null }),
					await portfolio.memories.revisions.find({ revisionId: parent.revision.id }),
					await portfolio.memories.revisions.list({ memoryId: parent.memory.id }),
				])
					expect(result).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
				adapter.findMany = (...args) => {
					if (args[0].name === 'memory_revisions') return Promise.reject(new Error('synthetic-PROTECTED'))
					return findMany(...args)
				}
				expect(await portfolio.memories.revisions.list({ memoryId: parent.memory.id })).toEqual({
					ok: false,
					error: { type: 'storage-operation-failed' },
				})
				expect(writes).toBe(0)
			} finally {
				adapter.findMany = findMany
				adapter.createMany = createMany
			}
			expect(requireSuccess(await portfolio.memories.list({ parentId: parent.memory.id }))).toEqual([child.memory])
			expect(requireSuccess(await portfolio.memories.revisions.find({ revisionId: parent.revision.id }))).toEqual(parent.revision)
			expect(codecCalls).toEqual({ encodes: 0, decodes: 0 })
		}, dependencies)
	})
	it.each(['before-revision', 'after-revision', 'memory-output', 'revision-output', 'commit'] as const)(
		'rolls back the entire initial pair at %s without an orphan or changed baseline',
		async (stage) => {
			const { dependencies, codecCalls } = createCountedSecretDependencies()
			const adapter = dependencies.storage.adapter
			const createMany = adapter.createMany.bind(adapter)
			const session = adapter.session.bind(adapter)
			await withReadyPortfolio(async (portfolio) => {
				const { parent, child } = await createMemoryFixture(portfolio)
				for (const parentId of [null, parent.memory.id]) {
					const attempts: Array<{ table: string; rows: Record<string, unknown>[] }> = []
					let inserted = 0
					let sessions = 0
					adapter.createMany = async (...args) => {
						const table = args[0].name
						attempts.push({ table, rows: structuredClone(args[2]) })
						if (table === 'memory_revisions' && stage === 'before-revision') throw new Error('synthetic-PROTECTED')
						const rows = await createMany(...args)
						inserted += rows.length
						if (table === 'memory_revisions' && stage === 'after-revision') throw new Error('synthetic-PROTECTED')
						if (table === 'memories' && stage === 'memory-output')
							return rows.map((row) => ({ ...row, id: 'invalid', revision: null }))
						if (table === 'memory_revisions' && stage === 'revision-output')
							return rows.map((row) => ({ ...row, created: null }))
						return rows
					}
					adapter.session = (work) => {
						sessions++
						return session(async () => {
							const result = await work()
							if (stage === 'commit') throw new Error('synthetic-PROTECTED')
							return result
						})
					}
					try {
						expect(await portfolio.memories.create({ parentId, title: 'Failed', body: 'never committed' })).toEqual({
							ok: false,
							error: {
								type:
									stage === 'memory-output' || stage === 'revision-output'
										? 'invalid-output'
										: 'storage-operation-failed',
							},
						})
					} finally {
						adapter.createMany = createMany
						adapter.session = session
					}
					expect(sessions).toBe(1)
					expect(inserted).toBe(stage === 'before-revision' ? 1 : 2)
					expect(attempts.map(({ table }) => table)).toEqual(['memories', 'memory_revisions'])
					const memoryId = attempts[0]!.rows[0]!.id
					const revisionId = attempts[1]!.rows[0]!.id
					if (typeof memoryId !== 'string' || typeof revisionId !== 'string') throw new Error('Expected both attempted IDs')
					expect(memoryId).not.toBe(revisionId)
					expect(attempts[1]!.rows[0]!.memoryId).toBe(memoryId)
					expect(attempts[0]!.rows[0]!.revision).toEqual({ id: revisionId, version: 1, title: 'Failed' })
					expect(await portfolio.memories.find({ memoryId })).toEqual({
						ok: false,
						error: { type: 'not-found', resource: 'memory', id: memoryId },
					})
					expect(await portfolio.memories.revisions.find({ revisionId })).toEqual({
						ok: false,
						error: { type: 'not-found', resource: 'memory-revision', id: revisionId },
					})
					expect(requireSuccess(await portfolio.memories.list({ parentId: null }))).toEqual([parent.memory])
					expect(requireSuccess(await portfolio.memories.list({ parentId: parent.memory.id }))).toEqual([child.memory])
					for (const pair of [parent, child]) {
						expect(requireSuccess(await portfolio.memories.find({ memoryId: pair.memory.id }))).toEqual(pair.memory)
						expect(requireSuccess(await portfolio.memories.revisions.find({ revisionId: pair.revision.id }))).toEqual(
							pair.revision,
						)
						expect(requireSuccess(await portfolio.memories.revisions.list({ memoryId: pair.memory.id }))).toEqual([
							pair.revision,
						])
					}
					// Rollback replaces nested maps: reacquire rather than inspecting a stale map.
					expect(adapter.stores.get('memories')!.size).toBe(2)
					expect(adapter.stores.get('memory_revisions')!.size).toBe(2)
				}
				expect(codecCalls).toEqual({ encodes: 0, decodes: 0 })
			}, dependencies)
		},
	)
	it('lists complete ID-sorted roots or direct children, requiring a valid parent even when empty', async () => {
		const { dependencies, codecCalls } = createCountedSecretDependencies()
		const adapter = dependencies.storage.adapter
		await withReadyPortfolio(async (portfolio) => {
			const { create, list } = portfolio.memories
			expect(requireSuccess(await list({ parentId: null }))).toEqual([])
			const parent = requireSuccess(await create({ parentId: null, title: 'Parent', body: 'parent body' }))
			expect(requireSuccess(await list({ parentId: parent.memory.id }))).toEqual([])
			const other = requireSuccess(await create({ parentId: null, title: 'Other', body: '' }))
			const roots = [parent.memory, other.memory]
			for (let index = 0; index < 123; index++)
				roots.push(requireSuccess(await create({ parentId: null, title: 'Root', body: '' })).memory)
			const children = []
			for (let index = 0; index < 125; index++)
				children.push(requireSuccess(await create({ parentId: parent.memory.id, title: 'Sibling', body: '' })).memory)
			const first = children[0]!
			const grandchild = requireSuccess(await create({ parentId: first.id, title: 'Grandchild', body: '' }))
			const rows = [...adapter.stores.get('memories')!.entries()].reverse()
			adapter.stores.get('memories')!.clear()
			for (const [id, row] of rows) adapter.stores.get('memories')!.set(id, row)
			const missing = '01k00000000000000000000001'
			// An absent parentId is corrupt, not an alternative spelling of a root.
			adapter.stores.get('memories')!.set(missing, { ...parent.memory, id: missing, parentId: undefined })
			roots.sort((a, b) => (a.id < b.id ? -1 : 1))
			expect(requireSuccess(await list({ parentId: null }))).toEqual(roots)
			const returnedRoots = requireSuccess(await list({ parentId: null }))
			returnedRoots[0]!.revision.title = 'mutated'
			returnedRoots[0]!.created.by = 'mutated'
			returnedRoots.reverse()
			expect(requireSuccess(await list({ parentId: null }))).toEqual(roots)
			expect(requireSuccess(await list({ parentId: parent.memory.id }))).toEqual(children.sort((a, b) => (a.id < b.id ? -1 : 1)))
			expect(requireSuccess(await list({ parentId: first.id }))).toEqual([grandchild.memory])
			expect(requireSuccess(await list({ parentId: other.memory.id }))).toEqual([])
			adapter.stores.get('memories')!.delete(missing)
			expect(await list({ parentId: missing })).toEqual({ ok: false, error: { type: 'not-found', resource: 'memory', id: missing } })
			adapter.stores.get('memories')!.set(first.id, { ...first, revision: { ...first.revision, version: 0 } })
			expect(await list({ parentId: parent.memory.id })).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
			adapter.stores.get('memories')!.set(other.memory.id, { ...other.memory, created: { ...other.memory.created, cid: undefined } })
			expect(await list({ parentId: other.memory.id })).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
			expect(await list({ parentId: null })).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
			expect(codecCalls).toEqual({ encodes: 0, decodes: 0 })
		}, dependencies)
	})
	it('finds compact parsed Memories without expanding or repairing storage', async () => {
		const { dependencies, codecCalls } = createCountedSecretDependencies()
		const adapter = dependencies.storage.adapter
		await withReadyPortfolio(async (portfolio) => {
			const pair = requireSuccess(await portfolio.memories.create({ parentId: null, title: 'Notes', body: 'full body' }))
			const { find } = portfolio.memories
			const stored = { ...pair.memory, body: 'ignored', revision: { ...pair.memory.revision, title: '  Notes  ', body: 'ignored' } }
			adapter.stores.get('memories')!.set(pair.memory.id, stored)
			expect(requireSuccess(await find({ memoryId: pair.memory.id }))).toEqual(pair.memory)
			expect(adapter.stores.get('memories')!.get(pair.memory.id)).toEqual(stored)
			const found = requireSuccess(await find({ memoryId: pair.memory.id }))
			found.revision.title = 'mutated'
			found.created.by = 'mutated'
			expect(requireSuccess(await find({ memoryId: pair.memory.id }))).toEqual(pair.memory)
			const missing = '01k00000000000000000000001'
			expect(await find({ memoryId: missing })).toEqual({ ok: false, error: { type: 'not-found', resource: 'memory', id: missing } })
			adapter.stores.get('memories')!.set(pair.memory.id, { ...pair.memory, created: { ...pair.memory.created, cid: undefined } })
			expect(await find({ memoryId: pair.memory.id })).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
			expect(codecCalls).toEqual({ encodes: 0, decodes: 0 })
		}, dependencies)
	})
	it('requires a full valid parent before writing a child', async () => {
		const { dependencies, codecCalls } = createCountedSecretDependencies()
		const adapter = dependencies.storage.adapter
		const createMany = adapter.createMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const parent = requireSuccess(await portfolio.memories.create({ parentId: null, title: 'Parent', body: 'parent body' }))
			const missing = '01k00000000000000000000001'
			let writes = 0
			adapter.createMany = (...args) => {
				writes++
				return createMany(...args)
			}
			try {
				expect(await portfolio.memories.create({ parentId: missing, title: 'Child', body: '' })).toEqual({
					ok: false,
					error: { type: 'not-found', resource: 'memory', id: missing },
				})
				for (const corruption of [
					{ parentId: undefined },
					{ revision: { ...parent.memory.revision, version: 0 } },
					{ revision: { ...parent.memory.revision, title: '  ' } },
					{ created: { ...parent.memory.created, cid: undefined } },
				]) {
					adapter.stores.get('memories')!.set(parent.memory.id, { ...parent.memory, ...corruption })
					expect(await portfolio.memories.create({ parentId: parent.memory.id, title: 'Child', body: '' })).toEqual({
						ok: false,
						error: { type: 'invalid-storage-output' },
					})
				}
				expect(writes).toBe(0)
				adapter.stores.get('memories')!.set(parent.memory.id, parent.memory)
				for (const body of ['', ' \t\r\n', '  Unicode É 📝\n']) {
					const child = requireSuccess(
						await portfolio.memories.create({ parentId: parent.memory.id, title: '  Same title  ', body }),
					)
					expect(child.memory.parentId).toBe(parent.memory.id)
					expect(child.memory.revision).toEqual({ id: child.revision.id, version: 1, title: 'Same title' })
					expect(child.revision.body).toBe(body)
					expect(child.memory.created).toEqual(child.revision.created)
				}
				expect(adapter.stores.get('memories')!.get(parent.memory.id)).toEqual(parent.memory)
				expect(adapter.stores.get('memory_revisions')!.get(parent.revision.id)).toEqual(parent.revision)
				expect(codecCalls).toEqual({ encodes: 0, decodes: 0 })
			} finally {
				adapter.createMany = createMany
			}
		}, dependencies)
	})
	it('creates a compact Memory and exact first revision in one native transaction', async () => {
		const { dependencies, codecCalls } = createCountedSecretDependencies()
		const adapter = dependencies.storage.adapter
		const session = adapter.session.bind(adapter)
		const createMany = adapter.createMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			let sessions = 0
			const writes: Array<Record<string, unknown>[]> = []
			adapter.session = (...args) => {
				sessions++
				return session(...args)
			}
			adapter.createMany = (...args) => {
				writes.push(structuredClone(args[2]))
				return createMany(...args)
			}
			try {
				const before = Date.now()
				const { create } = portfolio.memories
				const pair = requireSuccess(await create({ parentId: null, title: '  Notes É\n  inner  ', body: '  exact body\n' }))
				expect(Object.keys(pair).sort()).toEqual(['memory', 'revision'])
				expect(Object.keys(pair.memory).sort()).toEqual(['created', 'id', 'parentId', 'revision'])
				expect(Object.keys(pair.revision).sort()).toEqual(['body', 'created', 'id', 'memoryId', 'title', 'version'])
				expect(pair.memory.parentId).toBeNull()
				expect(pair.memory.revision).toEqual({ id: pair.revision.id, version: 1, title: 'Notes É\n  inner' })
				expect(pair.revision).toMatchObject({
					memoryId: pair.memory.id,
					version: 1,
					title: 'Notes É\n  inner',
					body: '  exact body\n',
				})
				expect(pair.memory.id).not.toBe(pair.revision.id)
				for (const id of [pair.memory.id, pair.revision.id]) expect(id).toMatch(/^[0-7][0-9a-hjkmnp-tv-z]{25}$/)
				expect(pair.memory.created).toEqual(pair.revision.created)
				expect(pair.memory.created).toMatchObject({ src: 'local', by: 'test-author', cid: 'test-call' })
				expect(Date.parse(pair.memory.created.at)).toBeGreaterThanOrEqual(before)
				expect(Date.parse(pair.memory.created.at)).toBeLessThanOrEqual(Date.now())
				expect(new Date(pair.memory.created.at).toISOString()).toBe(pair.memory.created.at)
				expect(writes).toEqual([[pair.memory], [pair.revision]])
				expect([...adapter.stores.get('memories')!.values()]).toEqual([pair.memory])
				expect([...adapter.stores.get('memory_revisions')!.values()]).toEqual([pair.revision])
				expect({ sessions, ...codecCalls }).toEqual({ sessions: 1, encodes: 0, decodes: 0 })
				const original = structuredClone(pair)
				expect(requireSuccess(await portfolio.memories.find({ memoryId: pair.memory.id }))).toEqual(pair.memory)
				expect(requireSuccess(await portfolio.memories.revisions.find({ revisionId: pair.revision.id }))).toEqual(pair.revision)
				expect(requireSuccess(await portfolio.memories.revisions.list({ memoryId: pair.memory.id }))).toEqual([pair.revision])
				pair.memory.revision.title = 'mutated'
				pair.memory.created.by = 'mutated'
				pair.revision.body = 'mutated'
				pair.revision.created.by = 'mutated'
				expect(requireSuccess(await portfolio.memories.find({ memoryId: pair.memory.id }))).toEqual(original.memory)
				expect(requireSuccess(await portfolio.memories.revisions.find({ revisionId: pair.revision.id }))).toEqual(original.revision)
			} finally {
				adapter.session = session
				adapter.createMany = createMany
			}
		}, dependencies)
	})
})
