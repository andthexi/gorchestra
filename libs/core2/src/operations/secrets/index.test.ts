import { v } from 'valleyed'
import { describe, expect, it, vi } from 'vitest'

import { auditStampPipe } from '../../domain/commons'
import { PortfolioClient } from '../../index'
import { createTestDependencies, requireSuccess, withReadyPortfolio } from '../../testing/fixtures'
import { hostileDiagnostics, nonStringValues } from '../../testing/secret-codecs'

describe('secrets', () => {
	it('returns parsed safe replacement metadata rather than native protected extras', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const updateMany = adapter.updateMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const before = requireSuccess(await portfolio.secrets.create({ title: 'Keep', value: 'synthetic-old' }))
			try {
				adapter.updateMany = async (...args) =>
					(await updateMany(...args)).map((row) => {
						const created = v.validate(auditStampPipe, row.created)
						const updated = v.validate(auditStampPipe, row.valueUpdated)
						if (!created.valid || !updated.valid) throw new Error('Expected native stamps')
						return {
							...row,
							title: '  Keep  ',
							value: 'synthetic-PROTECTED',
							created: { ...created.value, ignored: 'synthetic-PROTECTED' },
							valueUpdated: { ...updated.value, ignored: 'synthetic-PROTECTED' },
						}
					})
				const result = await portfolio.secrets.updateValue({ secretId: before.id, value: 'synthetic-PROTECTED' })
				const after = requireSuccess(result)
				expect(Object.keys(result).sort()).toEqual(['ok', 'value'])
				expect(Object.keys(after).sort()).toEqual(['created', 'id', 'title', 'valueUpdated'])
				expect(Object.keys(after.valueUpdated).sort()).toEqual(['at', 'by', 'cid', 'src'])
				expect(after.created).toEqual(before.created)
				expect(after.title).toBe('Keep')
				expect(JSON.stringify(result)).not.toContain('synthetic-PROTECTED')
				expect(requireSuccess(await portfolio.secrets.find({ secretId: before.id }))).toEqual(after)
			} finally {
				adapter.updateMany = updateMany
			}
		}, dependencies)
	})
	it.each([false, true])('drains a pending replacement encoder inside its transaction before shutdown (failure: %s)', async (fail) => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const session = adapter.session.bind(adapter)
		const updateMany = adapter.updateMany.bind(adapter)
		const entered = Promise.withResolvers<void>()
		const gate = Promise.withResolvers<void>()
		let encodes = 0
		let decodes = 0
		let active = false
		let cleaned = 0
		let writes = 0
		let settled = false
		const events: string[] = []
		dependencies.secrets.encode = async () => {
			if (++encodes === 1) return 'synthetic-old-reference'
			entered.resolve()
			await gate.promise
			events.push('encoded')
			if (fail) throw new Error('synthetic-PROTECTED')
			return 'synthetic-new-reference'
		}
		dependencies.secrets.decode = () => {
			decodes++
			return Promise.resolve({})
		}
		const opened = requireSuccess(await PortfolioClient.new(dependencies))
		try {
			if (opened.state !== 'uninitialized') throw new Error('Expected setup')
			const client = requireSuccess(await opened.setup())
			const portfolio = requireSuccess(client.as({ by: 'replacement-author' }))
			const before = requireSuccess(await portfolio.secrets.create({ title: 'Keep', value: 'synthetic-old' }))
			adapter.session = async (work) => {
				active = true
				try {
					return await session(work)
				} finally {
					active = false
					events.push('session-settled')
				}
			}
			adapter.updateMany = (...args) => {
				writes++
				return updateMany(...args)
			}
			adapter.disconnect = () => {
				cleaned++
				events.push('cleanup')
				expect(active).toBe(false)
				return Promise.resolve()
			}
			const pending = portfolio.secrets.updateValue({ secretId: before.id, value: 'synthetic-PROTECTED' }).then((result) => {
				settled = true
				return result
			})
			try {
				await entered.promise
				expect(active).toBe(true)
				expect(settled).toBe(false)
				expect(writes).toBe(0)
				expect(adapter.stores.get('secrets')!.get(before.id)).toEqual({ ...before, valueRef: 'synthetic-old-reference' })
				const shutdown = client.shutdown()
				expect(opened.shutdown()).toBe(shutdown)
				expect(await portfolio.secrets.updateValue({ secretId: before.id, value: 'too-late' })).toEqual({
					ok: false,
					error: { type: 'storage-operation-failed' },
				})
				expect(cleaned).toBe(0)
				expect(encodes).toBe(2)
				gate.resolve()
				const result = await pending
				if (fail) {
					expect(result).toEqual({ ok: false, error: { type: 'secret-encoding-failed' } })
					expect(adapter.stores.get('secrets')!.get(before.id)).toEqual({ ...before, valueRef: 'synthetic-old-reference' })
				} else {
					const after = requireSuccess(result)
					expect(adapter.stores.get('secrets')!.get(before.id)).toEqual({ ...after, valueRef: 'synthetic-new-reference' })
				}
				requireSuccess(await shutdown)
				expect(writes).toBe(fail ? 0 : 1)
				expect(decodes).toBe(0)
				expect(cleaned).toBe(1)
				expect(events).toEqual(['encoded', 'session-settled', 'cleanup'])
			} finally {
				gate.resolve()
				await pending
			}
		} finally {
			gate.resolve()
			await opened.shutdown()
			adapter.session = session
			adapter.updateMany = updateMany
			delete adapter.disconnect
		}
	})
	it.each(['commit', 'rollback'] as const)('waits for native %s before settling a replacement Result', async (mode) => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const session = adapter.session.bind(adapter)
		const updateMany = adapter.updateMany.bind(adapter)
		const reached = Promise.withResolvers<void>()
		const release = Promise.withResolvers<void>()
		let encodes = 0
		dependencies.secrets.encode = () => Promise.resolve(`synthetic-reference-${++encodes}`)
		await withReadyPortfolio(async (portfolio) => {
			const before = requireSuccess(await portfolio.secrets.create({ title: 'Keep', value: 'synthetic-old' }))
			let settled = false
			let aborted = false
			adapter.updateMany = async (...args) => {
				const rows = await updateMany(...args)
				return mode === 'rollback' ? rows.map((row) => ({ ...row, title: null })) : rows
			}
			adapter.session = (work) =>
				session(async () => {
					try {
						const result = await work()
						reached.resolve()
						await release.promise
						return result
					} catch (error) {
						aborted = true
						reached.resolve()
						await release.promise
						throw error
					}
				})
			const pending = portfolio.secrets.updateValue({ secretId: before.id, value: 'synthetic-PROTECTED' }).then((result) => {
				settled = true
				return result
			})
			try {
				await reached.promise
				expect(settled).toBe(false)
				expect(aborted).toBe(mode === 'rollback')
				expect(encodes).toBe(2)
				release.resolve()
				const result = await pending
				switch (mode) {
					case 'commit': {
						const after = requireSuccess(result)
						expect(after).toMatchObject({ id: before.id, title: before.title, created: before.created })
						expect(adapter.stores.get('secrets')!.get(before.id)).toEqual({ ...after, valueRef: 'synthetic-reference-2' })
						break
					}
					case 'rollback':
						expect(result).toEqual({ ok: false, error: { type: 'invalid-output' } })
						expect(adapter.stores.get('secrets')!.get(before.id)).toEqual({ ...before, valueRef: 'synthetic-reference-1' })
						break
					default:
						throw new Error('Unexpected session outcome')
				}
			} finally {
				release.resolve()
				await pending
				adapter.session = session
				adapter.updateMany = updateMany
			}
		}, dependencies)
	})
	it.each(['read', 'before-write', 'after-write', 'empty-result', 'metadata', 'stamp', 'commit'] as const)(
		'rolls back replacement failure at %s without hiding native failure',
		async (mode) => {
			const dependencies = createTestDependencies()
			const adapter = dependencies.storage.adapter
			const findMany = adapter.findMany.bind(adapter)
			const updateMany = adapter.updateMany.bind(adapter)
			const session = adapter.session.bind(adapter)
			let encodes = 0
			let writes = 0
			let decodes = 0
			dependencies.secrets.encode = () => Promise.resolve(`synthetic-reference-${++encodes}`)
			dependencies.secrets.decode = () => {
				decodes++
				return Promise.resolve({})
			}
			await withReadyPortfolio(async (portfolio) => {
				const before = requireSuccess(await portfolio.secrets.create({ title: 'Keep', value: 'synthetic-old' }))
				try {
					adapter.updateMany = async (...args) => {
						writes++
						if (mode === 'before-write') throw new Error('synthetic-PROTECTED')
						const rows = await updateMany(...args)
						switch (mode) {
							case 'after-write':
								throw new Error('synthetic-PROTECTED')
							case 'empty-result':
								return []
							case 'metadata':
								return rows.map((row) => ({ ...row, title: null }))
							case 'stamp':
								return rows.map((row) => ({ ...row, valueUpdated: { src: 'local', at: before.created.at, by: '' } }))
							case 'read':
							case 'commit':
								return rows
							default:
								throw new Error('Unexpected native fault')
						}
					}
					if (mode === 'read') adapter.findMany = () => Promise.reject(new Error('synthetic-PROTECTED'))
					if (mode === 'commit')
						adapter.session = (work) =>
							session(async () => {
								await work()
								throw new Error('synthetic-PROTECTED')
							})
					expect(await portfolio.secrets.updateValue({ secretId: before.id, value: 'synthetic-PROTECTED' })).toEqual({
						ok: false,
						error: {
							type: ['empty-result', 'metadata', 'stamp'].includes(mode) ? 'invalid-output' : 'storage-operation-failed',
						},
					})
				} finally {
					adapter.findMany = findMany
					adapter.updateMany = updateMany
					adapter.session = session
				}
				expect(writes).toBe(mode === 'read' ? 0 : 1)
				expect(encodes).toBe(mode === 'read' ? 1 : 2)
				expect(decodes).toBe(0)
				expect(adapter.stores.get('secrets')!.get(before.id)).toEqual({ ...before, valueRef: 'synthetic-reference-1' })
				expect(requireSuccess(await portfolio.secrets.find({ secretId: before.id }))).toEqual(before)
				// Only database state is rolled back; encoder effects are not compensated.
				requireSuccess(await portfolio.secrets.updateValue({ secretId: before.id, value: 'explicit-resubmission' }))
				expect(encodes).toBe(mode === 'read' ? 2 : 3)
			}, dependencies)
		},
	)
	it('applies repeated whitespace values with fresh attribution and only owned-field writes', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const updateMany = adapter.updateMany.bind(adapter)
		const createMany = adapter.createMany.bind(adapter)
		const calls: Array<{ secretId: string; value: string }> = []
		let decodes = 0
		let creates = 0
		const writes: Array<{ table: string; fields: string[] }> = []
		dependencies.secrets.encode = (input) => {
			calls.push({ ...input })
			return Promise.resolve(' \t\n')
		}
		dependencies.secrets.decode = () => {
			decodes++
			return Promise.resolve({})
		}
		const opened = requireSuccess(await PortfolioClient.new(dependencies))
		try {
			vi.useFakeTimers({ toFake: ['Date'] })
			vi.setSystemTime(new Date('2026-11-11T00:00:00.000Z'))
			if (opened.state !== 'uninitialized') throw new Error('Expected fresh storage')
			const client = requireSuccess(await opened.setup())
			const creator = requireSuccess(client.as({ by: 'creator', cid: 'creation' }))
			const editor = requireSuccess(client.as({ by: ' editor\n', cid: '' }))
			const before = requireSuccess(await creator.secrets.create({ title: 'Keep title', value: ' \t\n' }))
			const asset = {
				id: '01k00000000000000000000001',
				projectId: '01k00000000000000000000002',
				spec: { type: 'repository', source: { provider: 'github', owner: 'Owner', name: 'Repo', secretId: before.id } },
				created: before.created,
			}
			// Existing Asset references are arranged storage, not a future public operation.
			adapter.stores.set('assets', new Map([[asset.id, structuredClone(asset)]]))
			adapter.createMany = () => {
				creates++
				throw new Error('Replacement must not create')
			}
			adapter.updateMany = (...args) => {
				writes.push({ table: args[0].name, fields: Object.keys(args[3]).sort() })
				return updateMany(...args)
			}
			const { updateValue } = editor.secrets
			for (const at of ['2026-11-12T00:00:00.000Z', '2026-11-13T00:00:00.000Z']) {
				vi.setSystemTime(new Date(at))
				const input = {
					secretId: before.id,
					value: ' \t\n',
					id: 'forged',
					title: 'forged',
					created: {},
					valueRef: 'forged',
					valueUpdated: {},
				}
				const after = requireSuccess(await updateValue(input))
				expect(after).toEqual({ ...before, valueUpdated: { src: 'local', at, by: ' editor\n', cid: '' } })
				expect(Object.keys(after).sort()).toEqual(['created', 'id', 'title', 'valueUpdated'])
				expect(adapter.stores.get('secrets')!.get(before.id)).toEqual({ ...after, valueRef: ' \t\n' })
				expect(requireSuccess(await creator.secrets.find({ secretId: before.id }))).toEqual(after)
			}
			expect(calls).toEqual(Array.from({ length: 3 }, () => ({ secretId: before.id, value: ' \t\n' })))
			expect(writes).toEqual(Array.from({ length: 2 }, () => ({ table: 'secrets', fields: ['valueRef', 'valueUpdated'] })))
			expect(decodes).toBe(0)
			expect(creates).toBe(0)
			expect([...adapter.stores.get('assets')!.values()]).toEqual([asset])
			expect(adapter.stores.get('secrets')!.size).toBe(1)
		} finally {
			adapter.createMany = createMany
			adapter.updateMany = updateMany
			vi.useRealTimers()
			requireSuccess(await opened.shutdown())
		}
	})
	it.each([
		...nonStringValues.map((entry) => ({ ...entry, mode: 'return' as const })),
		{ name: 'empty', value: '', mode: 'return' as const },
		{ name: 'throw', value: undefined, mode: 'throw' as const },
		{ name: 'reject', value: undefined, mode: 'reject' as const },
	])('preserves the old row after a $name replacement encoder failure', async ({ mode, value }) => {
		const dependencies = createTestDependencies()
		const diagnostics = hostileDiagnostics()
		let failing = false
		let encodes = 0
		let decodes = 0
		Object.defineProperty(dependencies.secrets, 'encode', {
			value: () => {
				encodes++
				if (!failing) return Promise.resolve('synthetic-old-reference')
				switch (mode) {
					case 'return':
						return Promise.resolve(value)
					case 'throw':
						throw diagnostics.error
					case 'reject': {
						const rejected = Promise.withResolvers<never>()
						rejected.reject(diagnostics.rejection)
						return rejected.promise
					}
					default:
						throw new Error('Unexpected encoder fault')
				}
			},
		})
		dependencies.secrets.decode = () => {
			decodes++
			return Promise.resolve({})
		}
		await withReadyPortfolio(async (portfolio) => {
			const before = requireSuccess(await portfolio.secrets.create({ title: 'Keep', value: 'synthetic-old' }))
			failing = true
			const result = await portfolio.secrets.updateValue({ secretId: before.id, value: 'synthetic-PROTECTED' })
			expect(result).toEqual({ ok: false, error: { type: 'secret-encoding-failed' } })
			expect(encodes).toBe(2)
			expect(decodes).toBe(0)
			expect(diagnostics.reads()).toBe(0)
			expect(dependencies.storage.adapter.stores.get('secrets')!.get(before.id)).toEqual({
				...before,
				valueRef: 'synthetic-old-reference',
			})
			expect(requireSuccess(await portfolio.secrets.find({ secretId: before.id }))).toEqual(before)
			failing = false
			requireSuccess(await portfolio.secrets.updateValue({ secretId: before.id, value: 'explicit-resubmission' }))
			expect(encodes).toBe(3)
		}, dependencies)
	})
	it('rejects invalid replacement input before opening a transaction', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const session = adapter.session.bind(adapter)
		let encodes = 0
		let decodes = 0
		dependencies.secrets.encode = () => {
			encodes++
			return Promise.resolve('synthetic-reference')
		}
		dependencies.secrets.decode = () => {
			decodes++
			return Promise.resolve({})
		}
		await withReadyPortfolio(async (portfolio) => {
			const secret = requireSuccess(await portfolio.secrets.create({ title: 'Keep', value: 'synthetic-old' }))
			let sessions = 0
			adapter.session = () => {
				sessions++
				throw new Error('Invalid replacement must not enter storage')
			}
			try {
				const inputs: unknown[] = [
					undefined,
					null,
					{},
					{ secretId: secret.id },
					{ value: 'synthetic-PROTECTED' },
					...[...nonStringValues.map((entry) => entry.value), ''].map((value) => ({ secretId: secret.id, value })),
					...[
						...nonStringValues.map((entry) => entry.value),
						'',
						secret.id.toUpperCase(),
						` ${secret.id}`,
						`${secret.id}\n`,
						'8zzzzzzzzzzzzzzzzzzzzzzzzz',
					].map((secretId) => ({ secretId, value: 'synthetic-PROTECTED' })),
					{
						secretId: secret.id,
						get value(): never {
							throw new Error('synthetic-PROTECTED')
						},
					},
				]
				for (const input of inputs) {
					const result: unknown = await Reflect.apply(portfolio.secrets.updateValue, undefined, [input])
					expect(result).toMatchObject({ ok: false, error: { type: 'invalid-input' } })
					expect(JSON.stringify(result)).not.toContain('synthetic-PROTECTED')
				}
				expect(sessions).toBe(0)
				expect(encodes).toBe(1)
				expect(decodes).toBe(0)
			} finally {
				adapter.session = session
			}
			expect(adapter.stores.get('secrets')!.get(secret.id)).toEqual({ ...secret, valueRef: 'synthetic-reference' })
		}, dependencies)
	})
	it('validates the full stored Secret before encoding its replacement', async () => {
		const dependencies = createTestDependencies()
		let encodes = 0
		dependencies.secrets.encode = () => {
			encodes++
			return Promise.resolve('synthetic-reference')
		}
		const adapter = dependencies.storage.adapter
		const findMany = adapter.findMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const secret = requireSuccess(await portfolio.secrets.create({ title: 'Unchanged', value: 'synthetic-raw' }))
			const baseline = { ...secret, valueRef: 'synthetic-reference' }
			const candidates: Record<string, unknown>[] = [
				{ ...secret },
				...[...nonStringValues.map((entry) => entry.value), ''].map((valueRef) => ({ ...baseline, valueRef })),
				{ ...baseline, id: 'INVALID' },
				{ ...baseline, title: '' },
				{ ...baseline, title: 1 },
				...['created', 'valueUpdated'].flatMap((field) => [
					{ ...baseline, [field]: undefined },
					{ ...baseline, [field]: { src: 'local', at: secret.created.at, by: '' } },
					{ ...baseline, [field]: { ...secret.created, at: 'invalid' } },
				]),
			]
			try {
				for (const row of candidates) {
					// Fault after native cloning so hostile getters stay outside the snapshot.
					adapter.findMany = async (...args) =>
						(await findMany(...args)).map((stored) => (stored.id === secret.id ? row : stored))
					expect(await portfolio.secrets.updateValue({ secretId: secret.id, value: 'synthetic-PROTECTED' })).toEqual({
						ok: false,
						error: { type: 'invalid-storage-output' },
					})
					expect(encodes).toBe(1)
					expect(adapter.stores.get('secrets')!.get(secret.id)).toEqual(baseline)
				}
			} finally {
				adapter.findMany = findMany
			}
			expect(requireSuccess(await portfolio.secrets.find({ secretId: secret.id }))).toEqual(secret)
		}, dependencies)
	})
	it('refuses a missing Secret before encoding a replacement', async () => {
		const dependencies = createTestDependencies()
		let calls = 0
		dependencies.secrets.encode = () => {
			calls++
			return Promise.resolve('synthetic-reference')
		}
		await withReadyPortfolio(async (portfolio) => {
			const secretId = '01k00000000000000000000001'
			const result = await portfolio.secrets.updateValue({ secretId, value: 'synthetic-PROTECTED' })
			expect(result).toEqual({ ok: false, error: { type: 'not-found', resource: 'secret', id: secretId } })
			if (result.ok || result.error.type !== 'not-found') throw new Error('Expected missing Secret')
			const resource: 'secret' = result.error.resource
			expect(resource).toBe('secret')
			expect(calls).toBe(0)
			expect(requireSuccess(await portfolio.secrets.list())).toEqual([])
		}, dependencies)
	})
	it('replaces the value under the same identity without renaming or recreating the Secret', async () => {
		const dependencies = createTestDependencies()
		const calls: Array<{ secretId: string; value: string }> = []
		dependencies.secrets.encode = (input) => {
			calls.push({ ...input })
			return Promise.resolve(`synthetic-reference-${calls.length}`)
		}
		await withReadyPortfolio(async (portfolio) => {
			const before = requireSuccess(await portfolio.secrets.create({ title: 'Keep title', value: 'first-synthetic-value' }))
			const after = requireSuccess(await portfolio.secrets.updateValue({ secretId: before.id, value: ' second-synthetic-value\n' }))
			expect(after.id).toBe(before.id)
			expect(after.title).toBe(before.title)
			expect(after.created).toEqual(before.created)
			expect(Object.keys(after).sort()).toEqual(['created', 'id', 'title', 'valueUpdated'])
			expect(calls).toEqual([
				{ secretId: before.id, value: 'first-synthetic-value' },
				{ secretId: before.id, value: ' second-synthetic-value\n' },
			])
			expect([...dependencies.storage.adapter.stores.get('secrets')!.values()]).toEqual([
				{ ...after, valueRef: 'synthetic-reference-2' },
			])
			expect(requireSuccess(await portfolio.secrets.find({ secretId: before.id }))).toEqual(after)
		}, dependencies)
	})
	it.each([...nonStringValues, { name: 'empty', value: '' }])(
		'rejects a $name encoder result without writing and remains usable',
		async ({ value }) => {
			const dependencies = createTestDependencies()
			const original = dependencies.secrets.encode
			let calls = 0
			let decodes = 0
			let invalid = true
			Object.defineProperty(dependencies.secrets, 'encode', {
				value: (input: Parameters<typeof original>[0]) => {
					calls++
					return invalid ? Promise.resolve(value) : original(input)
				},
			})
			dependencies.secrets.decode = () => {
				decodes++
				return Promise.resolve({})
			}
			await withReadyPortfolio(async (portfolio) => {
				expect(await portfolio.secrets.create({ title: 'Failed', value: 'synthetic-PROTECTED' })).toEqual({
					ok: false,
					error: { type: 'secret-encoding-failed' },
				})
				expect(requireSuccess(await portfolio.secrets.list())).toEqual([])
				expect(dependencies.storage.adapter.stores.get('secrets')?.size ?? 0).toBe(0)
				expect(calls).toBe(1)
				invalid = false
				requireSuccess(await portfolio.secrets.create({ title: 'Retry', value: 'synthetic-raw' }))
				expect(calls).toBe(2)
				expect(decodes).toBe(0)
			}, dependencies)
		},
	)

	it.each(['throw', 'reject'] as const)('never inspects encoder %s diagnostics', async (mode) => {
		const dependencies = createTestDependencies()
		const diagnostics = hostileDiagnostics()
		let calls = 0
		dependencies.secrets.encode = () => {
			calls++
			switch (mode) {
				case 'throw':
					throw diagnostics.error
				case 'reject': {
					const rejected = Promise.withResolvers<never>()
					rejected.reject(diagnostics.rejection)
					return rejected.promise
				}
				default:
					throw new Error('Unexpected test mode')
			}
		}
		await withReadyPortfolio(async (portfolio) => {
			expect(await portfolio.secrets.create({ title: 'No diagnostics', value: 'synthetic-PROTECTED' })).toEqual({
				ok: false,
				error: { type: 'secret-encoding-failed' },
			})
			expect(requireSuccess(await portfolio.secrets.list())).toEqual([])
			expect(calls).toBe(1)
			expect(diagnostics.reads()).toBe(0)
		}, dependencies)
	})

	it('accepts whitespace-only raw values and references exactly through detached methods', async () => {
		const dependencies = createTestDependencies()
		const calls: unknown[] = []
		dependencies.secrets.encode = (input) => {
			calls.push(input)
			return Promise.resolve(' \t\n')
		}
		await withReadyPortfolio(async (portfolio) => {
			const { create, find, list } = portfolio.secrets
			const secret = requireSuccess(await create({ title: '  Keep\nÉ  ', value: '\n \t' }))
			expect(calls).toEqual([{ secretId: secret.id, value: '\n \t' }])
			expect(dependencies.storage.adapter.stores.get('secrets')!.get(secret.id)).toEqual({ ...secret, valueRef: ' \t\n' })
			expect(requireSuccess(await find({ secretId: secret.id }))).toEqual(secret)
			expect(requireSuccess(await list())).toEqual([secret])
		}, dependencies)
	})

	it('rejects malformed public input before either a codec or session', async () => {
		const dependencies = createTestDependencies()
		let calls = 0
		dependencies.secrets.encode = () => {
			calls++
			return Promise.resolve('unused')
		}
		const adapter = dependencies.storage.adapter
		const original = adapter.session.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			let sessions = 0
			adapter.session = () => {
				sessions++
				throw new Error('No invalid input session')
			}
			try {
				for (const value of [...nonStringValues.map((entry) => entry.value), '']) {
					const result: unknown = await Reflect.apply(portfolio.secrets.create, undefined, [{ title: 'Valid', value }])
					expect(result).toMatchObject({ ok: false, error: { type: 'invalid-input' } })
					expect(JSON.stringify(result)).not.toContain('synthetic-PROTECTED')
				}
				for (const title of [...nonStringValues.map((entry) => entry.value), ' \n']) {
					const result: unknown = await Reflect.apply(portfolio.secrets.create, undefined, [
						{ title, value: 'synthetic-PROTECTED' },
					])
					expect(result).toMatchObject({ ok: false, error: { type: 'invalid-input' } })
				}
				for (const input of [
					{ title: 'Missing' },
					{
						title: 'Throw',
						get value(): string {
							throw new Error('synthetic-PROTECTED')
						},
					},
				]) {
					const result: unknown = await Reflect.apply(portfolio.secrets.create, undefined, [input])
					expect(result).toMatchObject({ ok: false, error: { type: 'invalid-input' } })
					expect(JSON.stringify(result)).not.toContain('synthetic-PROTECTED')
				}
				for (const secretId of [
					'01K00000000000000000000001',
					' 01k00000000000000000000001',
					'01k00000000000000000000001\n',
					'8zzzzzzzzzzzzzzzzzzzzzzzzz',
				]) {
					expect(await portfolio.secrets.find({ secretId })).toEqual({
						ok: false,
						error: { type: 'invalid-input', issues: [{ path: 'secretId', message: 'Expected a Core id.' }] },
					})
				}
				expect(sessions).toBe(0)
				expect(calls).toBe(0)
			} finally {
				adapter.session = original
			}
		}, dependencies)
	})

	it.each(['before-insert', 'after-insert', 'metadata', 'commit'] as const)('does not commit a failed create at %s', async (mode) => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const createMany = adapter.createMany.bind(adapter)
		const session = adapter.session.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			try {
				switch (mode) {
					case 'before-insert':
						adapter.createMany = () => {
							throw new Error('synthetic-PROTECTED')
						}
						break
					case 'after-insert':
						adapter.createMany = async (...args) => {
							await createMany(...args)
							throw new Error('synthetic-PROTECTED')
						}
						break
					case 'metadata':
						adapter.createMany = async (...args) => (await createMany(...args)).map((row) => ({ ...row, title: null }))
						break
					case 'commit':
						adapter.session = (work) =>
							session(async () => {
								await work()
								throw new Error('synthetic-PROTECTED')
							})
						break
					default:
						throw new Error('Unexpected test mode')
				}
				expect(await portfolio.secrets.create({ title: 'Uncommitted', value: 'synthetic-PROTECTED' })).toEqual({
					ok: false,
					error: { type: mode === 'metadata' ? 'invalid-output' : 'storage-operation-failed' },
				})
			} finally {
				adapter.createMany = createMany
				adapter.session = session
			}
			expect(requireSuccess(await portfolio.secrets.list())).toEqual([])
		}, dependencies)
	})

	it('validates every full stored field before safe find/list projection', async () => {
		const dependencies = createTestDependencies()
		let encodes = 0
		let decodes = 0
		dependencies.secrets.encode = () => {
			encodes++
			return Promise.resolve('synthetic-PROTECTED-ref')
		}
		dependencies.secrets.decode = () => {
			decodes++
			return Promise.resolve({})
		}
		await withReadyPortfolio(async (portfolio) => {
			const secret = requireSuccess(await portfolio.secrets.create({ title: 'Corrupt', value: 'synthetic-PROTECTED' }))
			requireSuccess(await portfolio.secrets.create({ title: 'Valid sibling', value: 'synthetic-raw' }))
			const baseline = { ...secret, valueRef: 'synthetic-PROTECTED-ref' }
			const candidates: Record<string, unknown>[] = [
				{ ...secret },
				...[...nonStringValues.map((entry) => entry.value), ''].map((valueRef) => ({ ...baseline, valueRef })),
				{ ...baseline, id: 'INVALID' },
				{ ...baseline, title: '' },
				{ ...baseline, title: 1 },
				{ ...baseline, created: undefined },
				{ ...baseline, valueUpdated: undefined },
				...['created', 'valueUpdated'].flatMap((field) => [
					{ ...baseline, [field]: { src: 'local', at: secret.created.at, by: '' } },
					{ ...baseline, [field]: { ...secret.created, at: 'invalid' } },
				]),
			]
			const adapter = dependencies.storage.adapter
			const original = adapter.findMany.bind(adapter)
			try {
				for (const row of candidates) {
					// Inject after native cloning: getter-bearing synthetic values cannot be snapshotted.
					adapter.findMany = async (...args) =>
						(await original(...args)).map((stored) => (stored.id === secret.id ? row : stored))
					expect(await portfolio.secrets.find({ secretId: secret.id })).toEqual({
						ok: false,
						error: { type: 'invalid-storage-output' },
					})
					expect(await portfolio.secrets.list()).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
				}
			} finally {
				adapter.findMany = original
			}
			expect(encodes).toBe(2)
			expect(decodes).toBe(0)
		}, dependencies)
	})

	it('strips native metadata extras from public results', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const original = adapter.createMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			try {
				adapter.createMany = async (...args) =>
					(await original(...args)).map((row) => {
						const stamp = v.validate(auditStampPipe, row.created)
						if (!stamp.valid) throw new Error('Expected valid native stamp')
						return {
							...row,
							value: 'synthetic-PROTECTED',
							created: { ...stamp.value, ignored: 'synthetic-PROTECTED' },
							valueUpdated: { ...stamp.value, ignored: 'synthetic-PROTECTED' },
						}
					})
				const secret = requireSuccess(await portfolio.secrets.create({ title: 'Safe', value: 'synthetic-PROTECTED' }))
				expect(Object.keys(secret).sort()).toEqual(['created', 'id', 'title', 'valueUpdated'])
				expect(Object.keys(secret.created).sort()).toEqual(['at', 'by', 'cid', 'src'])
				expect(Object.keys(secret.valueUpdated).sort()).toEqual(['at', 'by', 'cid', 'src'])
				expect(JSON.stringify(secret)).not.toContain('synthetic-PROTECTED')
				expect(requireSuccess(await portfolio.secrets.find({ secretId: secret.id }))).toEqual(secret)
				expect(requireSuccess(await portfolio.secrets.list())).toEqual([secret])
			} finally {
				adapter.createMany = original
			}
		}, dependencies)
	})

	it('classifies native read errors without invoking either codec', async () => {
		const dependencies = createTestDependencies()
		let calls = 0
		dependencies.secrets.encode = () => {
			calls++
			return Promise.resolve('unused')
		}
		dependencies.secrets.decode = () => {
			calls++
			return Promise.resolve({})
		}
		const adapter = dependencies.storage.adapter
		const original = adapter.findMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			try {
				adapter.findMany = () => Promise.reject(new Error('synthetic-PROTECTED'))
				expect(await portfolio.secrets.find({ secretId: '01k00000000000000000000001' })).toEqual({
					ok: false,
					error: { type: 'storage-operation-failed' },
				})
				expect(await portfolio.secrets.list()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
			} finally {
				adapter.findMany = original
			}
			expect(requireSuccess(await portfolio.secrets.list())).toEqual([])
			expect(calls).toBe(0)
		}, dependencies)
	})

	it('lists every Secret ID ascending and rejects a corrupt member before projection without codecs', async () => {
		const dependencies = createTestDependencies()
		let encodes = 0
		let decodes = 0
		dependencies.secrets.encode = () => {
			encodes++
			return Promise.resolve('synthetic-reference')
		}
		dependencies.secrets.decode = () => {
			decodes++
			return Promise.resolve({})
		}
		await withReadyPortfolio(async (portfolio) => {
			const { list } = portfolio.secrets
			expect(requireSuccess(await list())).toEqual([])
			const secret = requireSuccess(await portfolio.secrets.create({ title: 'Template', value: 'synthetic-raw' }))
			const rows = dependencies.storage.adapter.stores.get('secrets')!
			rows.clear()
			const expected = Array.from({ length: 125 }, (_, index) => ({ ...secret, id: `01k${index.toString().padStart(23, '0')}` }))
			for (const row of [...expected].reverse()) rows.set(row.id, { ...row, valueRef: 'synthetic-reference' })
			expect(requireSuccess(await list())).toEqual(expected)
			rows.set(secret.id, { ...secret })
			expect(await list()).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
			expect(encodes).toBe(1)
			expect(decodes).toBe(0)
		}, dependencies)
	})
	it('finds only safe metadata after validating the complete stored Secret', async () => {
		const dependencies = createTestDependencies()
		await withReadyPortfolio(async (portfolio) => {
			const secretId = '01k00000000000000000000001'
			const missing = await portfolio.secrets.find({ secretId })
			expect(missing).toEqual({ ok: false, error: { type: 'not-found', resource: 'secret', id: secretId } })
			if (missing.ok || missing.error.type !== 'not-found') throw new Error('Expected missing Secret')
			const resource: 'secret' = missing.error.resource
			expect(resource).toBe('secret')
			const secret = requireSuccess(await portfolio.secrets.create({ title: 'Read', value: 'synthetic-raw' }))
			const { find } = portfolio.secrets
			expect(requireSuccess(await find({ secretId: secret.id }))).toEqual(secret)
			const rows = dependencies.storage.adapter.stores.get('secrets')!
			rows.set(secret.id, { ...secret, valueRef: '' })
			expect(await find({ secretId: secret.id })).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
		}, dependencies)
	})
	it('encodes the exact raw value with the one persisted identity and returns only safe metadata', async () => {
		const dependencies = createTestDependencies()
		const calls: Array<{ secretId: string; value: string }> = []
		const value = ' synthetic-É-secret\t\n'
		const valueRef = ' synthetic-reference\n'
		dependencies.secrets.encode = (input) => {
			calls.push({ ...input })
			return Promise.resolve(valueRef)
		}
		dependencies.secrets.decode = () => {
			throw new Error('Metadata must not decode')
		}
		await withReadyPortfolio(async (portfolio) => {
			const input = { title: '  GitHub É  ', value, id: 'forged', created: { by: 'forged' }, valueRef: 'forged' }
			const secret = requireSuccess(await portfolio.secrets.create(input))
			expect(calls).toEqual([{ secretId: secret.id, value }])
			expect(Object.keys(secret).sort()).toEqual(['created', 'id', 'title', 'valueUpdated'])
			expect(secret.title).toBe('GitHub É')
			expect(secret.created).toEqual(secret.valueUpdated)
			expect(secret.created).toMatchObject({ src: 'local', by: 'test-author', cid: 'test-call' })
			expect([...dependencies.storage.adapter.stores.get('secrets')!.values()]).toEqual([{ ...secret, valueRef }])
			expect(JSON.stringify(secret)).not.toContain('synthetic-')
		}, dependencies)
	})
})
