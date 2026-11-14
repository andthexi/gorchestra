import { describe, expect, it, vi } from 'vitest'

import { PortfolioClient, type Memory, type MemoryRevision, type Portfolio } from '../../../index'
import { createCountedSecretDependencies } from '../../../testing/dependencies'
import { createMemoryFixture, requireSuccess, withReadyPortfolio } from '../../../testing/fixtures'

async function expectHistory(portfolio: Portfolio, memory: Memory, revisions: MemoryRevision[]) {
	expect(requireSuccess(await portfolio.memories.find({ memoryId: memory.id }))).toEqual(memory)
	expect(requireSuccess(await portfolio.memories.revisions.list({ memoryId: memory.id }))).toEqual(revisions)
	for (const revision of revisions)
		expect(requireSuccess(await portfolio.memories.revisions.find({ revisionId: revision.id }))).toEqual(revision)
}

async function withRevisionFixture(
	work: (fixture: {
		portfolio: Portfolio
		adapter: ReturnType<typeof createCountedSecretDependencies>['dependencies']['storage']['adapter']
		memory: Memory
		history: MemoryRevision[]
		input: Parameters<Portfolio['memories']['revisions']['create']>[0]
	}) => Promise<void>,
) {
	const { dependencies, codecCalls } = createCountedSecretDependencies()
	await withReadyPortfolio(async (portfolio) => {
		const { parent, child } = await createMemoryFixture(portfolio)
		const second = requireSuccess(
			await portfolio.memories.revisions.create({
				memoryId: child.memory.id,
				expectedVersion: 1,
				title: 'Second',
				body: 'second snapshot',
			}),
		)
		await work({
			portfolio,
			adapter: dependencies.storage.adapter,
			memory: second.memory,
			history: [child.revision, second.revision],
			input: { memoryId: child.memory.id, expectedVersion: 2, title: 'Third', body: '  third É\n' },
		})
		await expectHistory(portfolio, parent.memory, [parent.revision])
		expect(codecCalls).toEqual({ encodes: 0, decodes: 0 })
	}, dependencies)
}

describe('Memory revisions', () => {
	it.each(['same-version', 'first-rollback', 'later-rollback'] as const)(
		'preserves contiguous immutable history across independently submitted appends: %s',
		async (scenario) => {
			await withRevisionFixture(async ({ portfolio, adapter, memory, history, input }) => {
				const createMany = adapter.createMany.bind(adapter)
				const session = adapter.session.bind(adapter)
				const entered = Promise.withResolvers<void>()
				const submitted = Promise.withResolvers<void>()
				const release = Promise.withResolvers<void>()
				const laterEntered = Promise.withResolvers<void>()
				const releaseLater = Promise.withResolvers<void>()
				const inserted: string[] = []
				let attempts = 0
				let secondSettled = false
				adapter.session = (work) => {
					if (++attempts === 2) submitted.resolve()
					return session(work)
				}
				adapter.createMany = async (...args) => {
					const rows = await createMany(...args)
					if (args[0].name !== 'memory_revisions') return rows
					const id = rows[0]?.id
					if (typeof id !== 'string') throw new Error('Expected inserted Revision identity')
					inserted.push(id)
					const first = inserted.length === 1
					if (first) {
						entered.resolve()
						await release.promise
					} else if (scenario === 'later-rollback') {
						laterEntered.resolve()
						await releaseLater.promise
					}
					const rollback = first ? scenario === 'first-rollback' : scenario === 'later-rollback'
					return rollback ? rows.map((row) => ({ ...row, body: undefined })) : rows
				}
				const first = portfolio.memories.revisions.create(input)
				const pending: Promise<unknown>[] = [first]
				try {
					await entered.promise
					const second = portfolio.memories.revisions
						.create({
							...input,
							expectedVersion:
								scenario === 'later-rollback' ? input.expectedVersion + 1 : input.expectedVersion,
							title: 'Independent append',
							body: 'separate snapshot',
						})
						.then((result) => {
							secondSettled = true
							return result
						})
					pending.push(second)
					await submitted.promise
					await new Promise<void>((resolve) => setImmediate(resolve))
					expect(secondSettled).toBe(false)
					expect(inserted).toHaveLength(1)
					release.resolve()
					const firstResult = await first
					if (scenario === 'later-rollback') {
						// The first success is acknowledged before the queued write is allowed to fail.
						requireSuccess(firstResult)
						await laterEntered.promise
						expect(secondSettled).toBe(false)
						releaseLater.resolve()
					}
					const secondResult = await second
					let committed: { memory: Memory; revision: MemoryRevision }
					switch (scenario) {
						case 'same-version':
							committed = requireSuccess(firstResult)
							expect(secondResult).toEqual({
								ok: false,
								error: {
									type: 'revision-conflict',
									memoryId: memory.id,
									expectedVersion: input.expectedVersion,
								},
							})
							expect(inserted).toEqual([committed.revision.id])
							break
						case 'first-rollback':
							expect(firstResult).toEqual({ ok: false, error: { type: 'invalid-output' } })
							committed = requireSuccess(secondResult)
							expect(inserted).toHaveLength(2)
							break
						case 'later-rollback':
							committed = requireSuccess(firstResult)
							expect(secondResult).toEqual({ ok: false, error: { type: 'invalid-output' } })
							expect(inserted).toHaveLength(2)
							break
						default:
							throw new Error('Unexpected overlap scenario')
					}
					await expectHistory(portfolio, committed.memory, [...history, committed.revision])
					expect(committed.memory).toEqual({ ...memory, revision: committed.memory.revision })
					expect(committed.revision.version).toBe(input.expectedVersion + 1)
					expect(
						requireSuccess(await portfolio.memories.revisions.list({ memoryId: memory.id })).map(
							({ version }) => version,
						),
					).toEqual([1, 2, 3])
					for (const id of inserted.filter((id) => id !== committed.revision.id))
						expect(await portfolio.memories.revisions.find({ revisionId: id })).toEqual({
							ok: false,
							error: { type: 'not-found', resource: 'memory-revision', id },
						})
				} finally {
					release.resolve()
					releaseLater.resolve()
					await Promise.allSettled(pending)
					adapter.createMany = createMany
					adapter.session = session
				}
			})
		},
	)
	it.each([false, true])('waits for native settlement before returning, rollback=%s', async (rollback) => {
		await withRevisionFixture(async ({ portfolio, adapter, memory, history, input }) => {
			const session = adapter.session.bind(adapter)
			const createMany = adapter.createMany.bind(adapter)
			const entered = Promise.withResolvers<void>()
			const release = Promise.withResolvers<void>()
			let attempted: unknown
			adapter.createMany = async (...args) => {
				const rows = await createMany(...args)
				attempted = rows[0]?.id
				return rollback ? rows.map((row) => ({ ...row, body: undefined })) : rows
			}
			adapter.session = async (work) => {
				try {
					return await session(async () => {
						const result = await work()
						entered.resolve()
						await release.promise
						return result
					})
				} catch (error) {
					entered.resolve()
					await release.promise
					throw error
				}
			}
			let settled = false
			const pending = portfolio.memories.revisions.create(input).then((result) => {
				settled = true
				return result
			})
			try {
				await entered.promise
				expect(settled).toBe(false)
				release.resolve()
				const result = await pending
				adapter.session = session
				adapter.createMany = createMany
				if (rollback) {
					expect(result).toEqual({ ok: false, error: { type: 'invalid-output' } })
					if (typeof attempted !== 'string') throw new Error('Expected attempted snapshot')
					expect(await portfolio.memories.revisions.find({ revisionId: attempted })).toEqual({
						ok: false,
						error: { type: 'not-found', resource: 'memory-revision', id: attempted },
					})
					await expectHistory(portfolio, memory, history)
				} else {
					const pair = requireSuccess(result)
					await expectHistory(portfolio, pair.memory, [...history, pair.revision])
				}
			} finally {
				release.resolve()
				await pending
				adapter.session = session
				adapter.createMany = createMany
			}
		})
	})
	it('appends identical exact content with detached editor attribution while preserving every prior snapshot', async () => {
		const { dependencies, codecCalls } = createCountedSecretDependencies()
		const opened = requireSuccess(await PortfolioClient.new(dependencies))
		try {
			if (opened.state !== 'uninitialized') throw new Error('Expected fresh storage')
			const client = requireSuccess(await opened.setup())
			const author = requireSuccess(client.as({ by: 'original', cid: null }))
			const attribution = { by: '  editor É\n', cid: ' correlation ' }
			const { create } = requireSuccess(client.as(attribution)).memories.revisions
			attribution.by = 'mutated'
			vi.useFakeTimers({ toFake: ['Date'] })
			vi.setSystemTime(new Date('2026-11-10T00:00:00.000Z'))
			const { parent, child } = await createMemoryFixture(author)
			const unrelated = requireSuccess(await author.memories.create({ parentId: null, title: 'Other', body: '' }))
			const sibling = requireSuccess(
				await author.memories.create({ parentId: parent.memory.id, title: 'Sibling', body: '' }),
			)
			const history = [child.revision]
			const title = 'Same É\n  inner'
			let memory = child.memory
			for (const body of ['', ' \t\r\n', '  exact É\nbody  ']) {
				for (const at of ['2026-11-11T00:00:00.000Z', '2026-11-12T00:00:00.000Z']) {
					vi.setSystemTime(new Date(at))
					const input = {
						memoryId: memory.id,
						expectedVersion: memory.revision.version,
						title: `  ${title}  `,
						body,
						id: 'caller-id',
						parentId: null,
						created: {},
						revision: { version: 999 },
					}
					const pair = requireSuccess(await create(input))
					expect(pair.memory).toEqual({
						...child.memory,
						revision: { id: pair.revision.id, version: history.length + 1, title },
					})
					expect(pair.revision).toEqual({
						id: pair.revision.id,
						memoryId: child.memory.id,
						version: history.length + 1,
						title,
						body,
						created: { src: 'local', at, by: '  editor É\n', cid: ' correlation ' },
					})
					expect(history.map(({ id }) => id)).not.toContain(pair.revision.id)
					history.push(pair.revision)
					memory = pair.memory
					await expectHistory(author, memory, history)
				}
			}
			for (const pair of [parent, unrelated, sibling]) await expectHistory(author, pair.memory, [pair.revision])
			expect(codecCalls).toEqual({ encodes: 0, decodes: 0 })
		} finally {
			vi.useRealTimers()
			requireSuccess(await opened.shutdown())
		}
	})
	it('requires the full stored Memory before version decisions or either write', async () => {
		await withRevisionFixture(async ({ portfolio, adapter, memory, history, input }) => {
			const findMany = adapter.findMany.bind(adapter)
			const update = vi.spyOn(adapter, 'updateMany')
			const insert = vi.spyOn(adapter, 'createMany')
			try {
				const missing = '01k00000000000000000000999'
				expect(await portfolio.memories.revisions.create({ ...input, memoryId: missing })).toEqual({
					ok: false,
					error: { type: 'not-found', resource: 'memory', id: missing },
				})
				for (const corruption of [
					{ id: 'invalid' },
					{ parentId: undefined },
					{ parentId: 'invalid' },
					...[{ id: 'invalid' }, { title: '' }, { version: 0 }, { version: '2' }].map((revision) => ({
						revision: { ...memory.revision, ...revision },
					})),
					{ created: { ...memory.created, cid: undefined } },
				]) {
					adapter.findMany = async (...args) =>
						(await findMany(...args)).map((row) => ({ ...row, ...corruption }))
					for (const expectedVersion of [1, 2])
						expect(await portfolio.memories.revisions.create({ ...input, expectedVersion })).toEqual({
							ok: false,
							error: { type: 'invalid-storage-output' },
						})
				}
				expect(update).not.toHaveBeenCalled()
				expect(insert).not.toHaveBeenCalled()
			} finally {
				adapter.findMany = findMany
				update.mockRestore()
				insert.mockRestore()
			}
			await expectHistory(portfolio, memory, history)
		})
	})
	it.each(['read', 'before-update', 'after-update'] as const)(
		'rolls back a native %s failure without inserting a snapshot',
		async (stage) => {
			await withRevisionFixture(async ({ portfolio, adapter, memory, history, input }) => {
				const findMany = adapter.findMany.bind(adapter)
				const updateMany = adapter.updateMany.bind(adapter)
				const insert = vi.spyOn(adapter, 'createMany')
				adapter.findMany = (...args) => {
					if (stage === 'read') throw new Error('synthetic-PROTECTED')
					return findMany(...args)
				}
				let written = 0
				adapter.updateMany = async (...args) => {
					if (stage === 'before-update') throw new Error('synthetic-PROTECTED')
					const rows = await updateMany(...args)
					written += rows.length
					throw new Error('synthetic-PROTECTED')
				}
				try {
					expect(await portfolio.memories.revisions.create(input)).toEqual({
						ok: false,
						error: { type: 'storage-operation-failed' },
					})
					expect(insert).not.toHaveBeenCalled()
					expect(written).toBe(stage === 'after-update' ? 1 : 0)
				} finally {
					adapter.findMany = findMany
					adapter.updateMany = updateMany
					insert.mockRestore()
				}
				await expectHistory(portfolio, memory, history)
				const retry = requireSuccess(await portfolio.memories.revisions.create(input))
				await expectHistory(portfolio, retry.memory, [...history, retry.revision])
			})
		},
	)
	it('writes only the native guarded summary and matching revision in one transaction', async () => {
		await withRevisionFixture(async ({ portfolio, adapter, memory, history, input }) => {
			const update = vi.spyOn(adapter, 'updateMany')
			const insert = vi.spyOn(adapter, 'createMany')
			const session = vi.spyOn(adapter, 'session')
			const load = vi.spyOn(adapter, 'loadMigrations')
			const inspect = vi.spyOn(adapter, 'introspect')
			try {
				const pair = requireSuccess(await portfolio.memories.revisions.create(input))
				expect(update).toHaveBeenCalledTimes(1)
				expect(insert).toHaveBeenCalledTimes(1)
				expect(session).toHaveBeenCalledTimes(1)
				expect(load).not.toHaveBeenCalled()
				expect(inspect).not.toHaveBeenCalled()
				const updateArgs = update.mock.calls[0]
				const insertArgs = insert.mock.calls[0]
				if (!updateArgs || !insertArgs) throw new Error('Expected both native writes')
				expect(updateArgs[0].name).toBe('memories')
				expect(updateArgs[2]).toEqual({
					op: 'and',
					children: [
						{ op: 'eq', field: 'id', path: ['id'], valueType: null, value: memory.id },
						{
							op: 'eq',
							field: 'revision.version',
							path: ['revision', 'version'],
							valueType: 'number',
							value: 2,
						},
					],
				})
				expect(updateArgs[3]).toEqual({ revision: { id: pair.revision.id, version: 3, title: input.title } })
				expect(insertArgs[0].name).toBe('memory_revisions')
				expect(insertArgs[2]).toEqual([pair.revision])
				expect(pair.memory).toEqual({
					...memory,
					revision: { id: pair.revision.id, version: 3, title: input.title },
				})
				await expectHistory(portfolio, pair.memory, [...history, pair.revision])
			} finally {
				for (const spy of [update, insert, session, load, inspect]) spy.mockRestore()
			}
		})
	})
	it('reaches the maximum safe version once without a committed successor gap', async () => {
		await withRevisionFixture(async ({ portfolio, adapter, memory, history, input }) => {
			const last = history.at(-1)
			if (!last) throw new Error('Expected prior history')
			const high = { ...last, version: Number.MAX_SAFE_INTEGER - 1 }
			const head = { ...memory, revision: { ...memory.revision, version: high.version } }
			adapter.stores.get('memories')!.set(memory.id, head)
			adapter.stores.get('memory_revisions')!.set(high.id, high)
			expect(
				await portfolio.memories.revisions.create({ ...input, expectedVersion: Number.MAX_SAFE_INTEGER }),
			).toEqual({
				ok: false,
				error: { type: 'revision-conflict', memoryId: memory.id, expectedVersion: Number.MAX_SAFE_INTEGER },
			})
			const pair = requireSuccess(
				await portfolio.memories.revisions.create({ ...input, expectedVersion: high.version }),
			)
			expect(pair.revision.version).toBe(Number.MAX_SAFE_INTEGER)
			expect(pair.memory.revision).toEqual({
				id: pair.revision.id,
				version: Number.MAX_SAFE_INTEGER,
				title: input.title,
			})
			expect(
				await portfolio.memories.revisions.create({ ...input, expectedVersion: Number.MAX_SAFE_INTEGER }),
			).toEqual({
				ok: false,
				error: { type: 'revision-version-exhausted' },
			})
			await expectHistory(portfolio, pair.memory, [...history.slice(0, -1), high, pair.revision])
		})
	})
	it.each(['before-insert', 'after-insert', 'body-output', 'stamp-output', 'commit'] as const)(
		'rolls back both writes and permits an explicit gap-free retry after %s',
		async (stage) => {
			await withRevisionFixture(async ({ portfolio, adapter, memory, history, input }) => {
				const createMany = adapter.createMany.bind(adapter)
				const session = adapter.session.bind(adapter)
				const update = vi.spyOn(adapter, 'updateMany')
				let attempted: Record<string, unknown>[] = []
				let inserted = 0
				let sessions = 0
				adapter.createMany = async (...args) => {
					attempted = structuredClone(args[2])
					if (stage === 'before-insert') throw new Error('synthetic-PROTECTED')
					const rows = await createMany(...args)
					inserted += rows.length
					if (stage === 'after-insert') throw new Error('synthetic-PROTECTED')
					if (stage === 'body-output') return rows.map((row) => ({ ...row, body: null }))
					if (stage === 'stamp-output')
						return rows.map((row) => ({ ...row, created: { ...memory.created, cid: undefined } }))
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
					expect(await portfolio.memories.revisions.create(input)).toEqual({
						ok: false,
						error: {
							type:
								stage === 'body-output' || stage === 'stamp-output'
									? 'invalid-output'
									: 'storage-operation-failed',
						},
					})
					expect(update).toHaveBeenCalledTimes(1)
				} finally {
					adapter.createMany = createMany
					adapter.session = session
					update.mockRestore()
				}
				expect(sessions).toBe(1)
				expect(inserted).toBe(stage === 'before-insert' ? 0 : 1)
				expect(attempted).toHaveLength(1)
				const id = attempted[0]?.id
				if (typeof id !== 'string') throw new Error('Expected the attempted revision ID')
				expect(await portfolio.memories.revisions.find({ revisionId: id })).toEqual({
					ok: false,
					error: { type: 'not-found', resource: 'memory-revision', id },
				})
				await expectHistory(portfolio, memory, history)
				const retry = requireSuccess(await portfolio.memories.revisions.create(input))
				expect(retry.revision.version).toBe(3)
				expect(retry.revision.id).not.toBe(id)
				await expectHistory(portfolio, retry.memory, [...history, retry.revision])
			})
		},
	)
	it.each(['empty', 'multiple', 'parent', 'summary', 'creation', 'valid-then-malformed'] as const)(
		'rolls back the summary without inserting history when the complete update result is %s',
		async (mode) => {
			await withRevisionFixture(async ({ portfolio, adapter, memory, history, input }) => {
				const updateMany = adapter.updateMany.bind(adapter)
				const insert = vi.spyOn(adapter, 'createMany')
				let written = 0
				adapter.updateMany = async (...args) => {
					const rows = await updateMany(...args)
					written += rows.length
					switch (mode) {
						case 'empty':
							return []
						case 'multiple':
							return [...rows, ...rows]
						case 'parent':
							return rows.map((row) => ({ ...row, parentId: undefined }))
						case 'summary':
							return rows.map((row) => ({
								...row,
								revision: { id: 'invalid', version: 3, title: 'Third' },
							}))
						case 'creation':
							return rows.map((row) => ({ ...row, created: { ...memory.created, cid: undefined } }))
						case 'valid-then-malformed':
							return [...rows, ...rows.map((row) => ({ ...row, parentId: 'invalid' }))]
						default:
							throw new Error('Unexpected update-result mode')
					}
				}
				try {
					expect(await portfolio.memories.revisions.create(input)).toEqual({
						ok: false,
						error:
							mode === 'empty'
								? { type: 'revision-conflict', memoryId: memory.id, expectedVersion: 2 }
								: { type: 'invalid-storage-output' },
					})
					expect(written).toBe(1)
					expect(insert).not.toHaveBeenCalled()
				} finally {
					adapter.updateMany = updateMany
					insert.mockRestore()
				}
				await expectHistory(portfolio, memory, history)
			})
		},
	)
	it('refuses matching maximum versions before writes but compares stale requests first', async () => {
		const { dependencies } = createCountedSecretDependencies()
		const adapter = dependencies.storage.adapter
		await withReadyPortfolio(async (portfolio) => {
			const { child } = await createMemoryFixture(portfolio)
			const revision = { ...child.revision, version: Number.MAX_SAFE_INTEGER }
			const memory = { ...child.memory, revision: { ...child.memory.revision, version: revision.version } }
			adapter.stores.get('memories')!.set(memory.id, memory)
			adapter.stores.get('memory_revisions')!.set(revision.id, revision)
			const update = vi.spyOn(adapter, 'updateMany')
			const insert = vi.spyOn(adapter, 'createMany')
			try {
				expect(
					await portfolio.memories.revisions.create({
						memoryId: memory.id,
						expectedVersion: 1,
						title: 'Stale',
						body: '',
					}),
				).toEqual({
					ok: false,
					error: { type: 'revision-conflict', memoryId: memory.id, expectedVersion: 1 },
				})
				expect(
					await portfolio.memories.revisions.create({
						memoryId: memory.id,
						expectedVersion: revision.version,
						title: 'Full',
						body: '',
					}),
				).toEqual({
					ok: false,
					error: { type: 'revision-version-exhausted' },
				})
				expect(update).not.toHaveBeenCalled()
				expect(insert).not.toHaveBeenCalled()
			} finally {
				update.mockRestore()
				insert.mockRestore()
			}
			expect(requireSuccess(await portfolio.memories.find({ memoryId: memory.id }))).toEqual(memory)
			expect(requireSuccess(await portfolio.memories.revisions.list({ memoryId: memory.id }))).toEqual([revision])
		}, dependencies)
	})
	it('preserves the version predicate at the actual native write, not just the earlier read', async () => {
		const { dependencies } = createCountedSecretDependencies()
		const adapter = dependencies.storage.adapter
		const updateMany = adapter.updateMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const { parent, child } = await createMemoryFixture(portfolio)
			const insert = vi.spyOn(adapter, 'createMany')
			let matched: unknown
			let updates = 0
			adapter.updateMany = async (...args) => {
				updates++
				expect(args[0].name).toBe('memories')
				// Same transaction interposition, immediately before native evaluation.
				adapter.stores
					.get('memories')!
					.set(child.memory.id, { ...child.memory, revision: { ...child.memory.revision, version: 2 } })
				const rows = await updateMany(...args)
				matched = rows
				return rows
			}
			try {
				expect(
					await portfolio.memories.revisions.create({
						memoryId: child.memory.id,
						expectedVersion: 1,
						title: 'Guarded',
						body: '',
					}),
				).toEqual({
					ok: false,
					error: { type: 'revision-conflict', memoryId: child.memory.id, expectedVersion: 1 },
				})
				expect(matched).toEqual([])
				expect(updates).toBe(1)
				expect(insert).not.toHaveBeenCalled()
			} finally {
				adapter.updateMany = updateMany
				insert.mockRestore()
			}
			for (const pair of [parent, child]) {
				expect(requireSuccess(await portfolio.memories.find({ memoryId: pair.memory.id }))).toEqual(pair.memory)
				expect(requireSuccess(await portfolio.memories.revisions.list({ memoryId: pair.memory.id }))).toEqual([
					pair.revision,
				])
			}
		}, dependencies)
	})
	it('refuses stale requests before either write without exposing the current version', async () => {
		const { dependencies, codecCalls } = createCountedSecretDependencies()
		const adapter = dependencies.storage.adapter
		await withReadyPortfolio(async (portfolio) => {
			const { child } = await createMemoryFixture(portfolio)
			const input = { memoryId: child.memory.id, expectedVersion: 1, title: 'Second', body: '' }
			const second = requireSuccess(await portfolio.memories.revisions.create(input))
			const update = vi.spyOn(adapter, 'updateMany')
			const insert = vi.spyOn(adapter, 'createMany')
			try {
				expect(await portfolio.memories.revisions.create(input)).toEqual({
					ok: false,
					error: { type: 'revision-conflict', memoryId: child.memory.id, expectedVersion: 1 },
				})
				expect(update).not.toHaveBeenCalled()
				expect(insert).not.toHaveBeenCalled()
			} finally {
				update.mockRestore()
				insert.mockRestore()
			}
			expect(requireSuccess(await portfolio.memories.find({ memoryId: child.memory.id }))).toEqual(second.memory)
			expect(requireSuccess(await portfolio.memories.revisions.list({ memoryId: child.memory.id }))).toEqual([
				child.revision,
				second.revision,
			])
			expect(codecCalls).toEqual({ encodes: 0, decodes: 0 })
		}, dependencies)
	})
	it('appends a full snapshot with a matching compact head and immutable prior history', async () => {
		await withReadyPortfolio(async (portfolio) => {
			const { parent, child } = await createMemoryFixture(portfolio)
			const second = requireSuccess(
				await portfolio.memories.revisions.create({
					memoryId: child.memory.id,
					expectedVersion: 1,
					title: '  Second É  ',
					body: '  exact\nbody  ',
				}),
			)
			expect(second.memory).toEqual({
				...child.memory,
				revision: { id: second.revision.id, version: 2, title: 'Second É' },
			})
			expect(second.revision).toEqual({
				id: second.memory.revision.id,
				memoryId: child.memory.id,
				version: 2,
				title: 'Second É',
				body: '  exact\nbody  ',
				created: { src: 'local', at: second.revision.created.at, by: 'test-author', cid: 'test-call' },
			})
			expect(new Date(second.revision.created.at).toISOString()).toBe(second.revision.created.at)
			expect(second.revision.id).not.toBe(child.revision.id)
			expect(requireSuccess(await portfolio.memories.find({ memoryId: child.memory.id }))).toEqual(second.memory)
			expect(requireSuccess(await portfolio.memories.revisions.list({ memoryId: child.memory.id }))).toEqual([
				child.revision,
				second.revision,
			])
			for (const pair of [parent, child])
				expect(
					requireSuccess(await portfolio.memories.revisions.find({ revisionId: pair.revision.id })),
				).toEqual(pair.revision)
			expect(requireSuccess(await portfolio.memories.find({ memoryId: parent.memory.id }))).toEqual(parent.memory)
		})
	})
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
						return args[0].name === 'memory_revisions'
							? rows.map((row) => ({ ...row, ...corruption }))
							: rows
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
			expect(requireSuccess(await portfolio.memories.revisions.list({ memoryId: parent.memory.id }))).toEqual([
				parent.revision,
			])
		}, dependencies)
	})
	it('lists every full revision by version under a required valid Memory, including empty history', async () => {
		const { dependencies, codecCalls } = createCountedSecretDependencies()
		const adapter = dependencies.storage.adapter
		const findMany = adapter.findMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const pair = requireSuccess(
				await portfolio.memories.create({ parentId: null, title: 'Original', body: 'first' }),
			)
			const other = requireSuccess(
				await portfolio.memories.create({ parentId: null, title: 'Other', body: 'unrelated' }),
			)
			const history = [
				pair.revision,
				...Array.from({ length: 124 }, (_, index) => ({
					...pair.revision,
					id: `01k${(124 - index).toString().padStart(23, '0')}`,
					version: index + 2,
					title: `Snapshot ${index + 2}`,
					body: `  body É ${index + 2}\n`,
					created: {
						...pair.revision.created,
						at: new Date(index * 1000).toISOString(),
						by: `author ${index}`,
					},
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
			adapter.stores
				.get('memory_revisions')!
				.set(last.id, { ...last, created: { ...last.created, cid: undefined } })
			expect(await list({ memoryId: pair.memory.id })).toEqual({
				ok: false,
				error: { type: 'invalid-storage-output' },
			})
			adapter.stores.get('memory_revisions')!.clear()
			expect(requireSuccess(await list({ memoryId: pair.memory.id }))).toEqual([])
			expect(adapter.stores.get('memories')!.get(pair.memory.id)).toEqual(current)
			const missing = '01k00000000000000000000999'
			expect(await list({ memoryId: missing })).toEqual({
				ok: false,
				error: { type: 'not-found', resource: 'memory', id: missing },
			})
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
					expect(await list({ memoryId: pair.memory.id })).toEqual({
						ok: false,
						error: { type: 'invalid-storage-output' },
					})
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
			const pair = requireSuccess(
				await portfolio.memories.create({ parentId: null, title: 'Original', body: '  first É\n' }),
			)
			const newer = {
				...pair.revision,
				id: '01k00000000000000000000002',
				version: 2,
				title: 'New',
				body: 'new',
				created: { ...pair.revision.created, by: 'new author' },
			}
			adapter.stores.get('memory_revisions')!.set(newer.id, newer)
			adapter.stores.get('memories')!.set(pair.memory.id, {
				...pair.memory,
				revision: { id: newer.id, version: newer.version, title: newer.title },
			})
			const stored = {
				...pair.revision,
				title: '  Original  ',
				ignored: true,
				created: { ...pair.revision.created, ignored: true },
			}
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
					expect(await find({ revisionId: pair.revision.id })).toEqual({
						ok: false,
						error: { type: 'invalid-storage-output' },
					})
				}
				expect(reads.every((name) => name === 'memory_revisions')).toBe(true)
				expect(codecCalls).toEqual({ encodes: 0, decodes: 0 })
			} finally {
				adapter.findMany = findMany
			}
		}, dependencies)
	})
})
