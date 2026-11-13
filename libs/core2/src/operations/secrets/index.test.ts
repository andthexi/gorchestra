import { v } from 'valleyed'
import { describe, expect, it } from 'vitest'

import { auditStampPipe } from '../../domain/commons'
import { createTestDependencies, requireSuccess, withReadyPortfolio } from '../../testing/fixtures'
import { hostileDiagnostics, nonStringValues } from '../../testing/secret-codecs'

describe('secrets', () => {
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
