import { v } from 'valleyed'
import { describe, expect, it } from 'vitest'

import { auditStampPipe } from '../../domain/commons'
import { createProjectPair, createTestDependencies, requireSuccess, withReadyPortfolio } from '../../testing/fixtures'

describe('secrets', () => {
	it('returns complete ID-sorted usages and rejects a malformed selected row, not unrelated rows', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		await withReadyPortfolio(async (portfolio) => {
			const { project, other } = await createProjectPair(portfolio)
			const secret = requireSuccess(await portfolio.secrets.create({ title: 'Access', value: 'synthetic-pat' }))
			const unused = requireSuccess(
				await portfolio.secrets.create({ title: 'Other access', value: 'synthetic-other' }),
			)
			const asset = requireSuccess(
				await portfolio.projects.assets.create({
					projectId: project.id,
					spec: {
						type: 'repository',
						source: { provider: 'github', owner: 'Owner', name: 'Repo', secretId: secret.id },
					},
				}),
			)
			const expected = Array.from({ length: 125 }, (_, index) => ({
				...asset,
				id: `01k${index.toString().padStart(23, '0')}`,
				projectId: index % 2 === 0 ? project.id : other.id,
			}))
			adapter.stores.get('assets')!.clear()
			for (const row of [...expected].reverse()) adapter.stores.get('assets')!.set(row.id, row)
			adapter.stores.get('assets')!.set(asset.id, {
				...asset,
				spec: { ...asset.spec, source: { ...asset.spec.source, secretId: unused.id } },
			})
			adapter.stores.get('assets')!.set(unused.id, {
				...asset,
				id: unused.id,
				spec: { ...asset.spec, source: { ...asset.spec.source, secretId: `${secret.id}extra` } },
				created: null,
			})
			expect(requireSuccess(await portfolio.secrets.usages({ secretId: secret.id }))).toEqual(expected)
			expect(requireSuccess(await portfolio.secrets.usages({ secretId: unused.id }))).toEqual([
				{ ...asset, spec: { ...asset.spec, source: { ...asset.spec.source, secretId: unused.id } } },
			])
			adapter.stores.get('assets')!.set(expected[0]!.id, { ...expected[0]!, created: null })
			expect(await portfolio.secrets.usages({ secretId: secret.id })).toEqual({
				ok: false,
				error: { type: 'invalid-storage-output' },
			})
		}, dependencies)
	})
	it('requires the full Secret before querying usages even for orphan references', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const findMany = adapter.findMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const secret = requireSuccess(await portfolio.secrets.create({ title: 'Access', value: 'synthetic-pat' }))
			const fullSecret = structuredClone(adapter.stores.get('secrets')!.get(secret.id)!)
			const missing = '01k00000000000000000000001'
			const reads: string[] = []
			adapter.findMany = (...args) => {
				reads.push(args[0].name)
				return findMany(...args)
			}
			try {
				expect(await portfolio.secrets.usages({ secretId: missing })).toEqual({
					ok: false,
					error: { type: 'not-found', resource: 'secret', id: missing },
				})
				expect(reads.splice(0)).toEqual(['secret_protection', 'secrets'])
				adapter.stores.set(
					'assets',
					new Map([
						[
							'01k00000000000000000000002',
							{
								id: '01k00000000000000000000002',
								projectId: '01k00000000000000000000003',
								spec: {
									type: 'repository',
									source: { provider: 'github', owner: 'Owner', name: 'Repo', secretId: missing },
								},
								created: secret.created,
							},
						],
					]),
				)
				expect(await portfolio.secrets.usages({ secretId: missing })).toEqual({
					ok: false,
					error: { type: 'not-found', resource: 'secret', id: missing },
				})
				expect(reads.splice(0)).toEqual(['secret_protection', 'secrets'])
				for (const corrupt of [
					{ ...fullSecret, value: { mode: 'plaintext', plaintext: '' } },
					{ ...fullSecret, value: undefined },
					{ ...fullSecret, value: 1 },
					{ ...fullSecret, valueUpdated: undefined },
					{ ...fullSecret, valueUpdated: { ...secret.valueUpdated, cid: undefined } },
					{ ...fullSecret, created: null },
				]) {
					adapter.stores.get('secrets')!.set(secret.id, corrupt)
					expect(await portfolio.secrets.usages({ secretId: secret.id })).toEqual({
						ok: false,
						error: { type: 'invalid-storage-output' },
					})
					expect(reads.splice(0)).toEqual(['secret_protection', 'secrets'])
				}
				adapter.stores.get('secrets')!.set(secret.id, fullSecret)
				expect(requireSuccess(await portfolio.secrets.usages({ secretId: secret.id }))).toEqual([])
			} finally {
				adapter.findMany = findMany
			}
		}, dependencies)
	})
	it('returns explicit safe replacement metadata rather than native protected extras', async () => {
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
							valueRef: 'synthetic-PROTECTED',
							created: { ...created.value, ignored: 'synthetic-PROTECTED' },
							valueUpdated: { ...updated.value, ignored: 'synthetic-PROTECTED' },
						}
					})
				const result = await portfolio.secrets.updateValue({
					secretId: before.id,
					value: 'synthetic-PROTECTED',
				})
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

	it.each(['native-failure', 'malformed-output', 'commit-rollback'] as const)(
		'keeps the old protected value and metadata when replacement has %s',
		async (fault) => {
			const dependencies = createTestDependencies()
			const adapter = dependencies.storage.adapter
			const updateMany = adapter.updateMany.bind(adapter)
			const session = adapter.session.bind(adapter)
			await withReadyPortfolio(async (portfolio) => {
				const created = requireSuccess(await portfolio.secrets.create({ title: 'Keep', value: 'old value' }))
				const before = structuredClone(adapter.stores.get('secrets')!.get(created.id))
				try {
					if (fault === 'native-failure') {
						adapter.updateMany = async (...args) => {
							await updateMany(...args)
							throw new Error('synthetic replacement failure')
						}
					} else if (fault === 'malformed-output') {
						adapter.updateMany = async (...args) =>
							(await updateMany(...args)).map((row) => ({ ...row, valueUpdated: null }))
					} else {
						adapter.session = (work) =>
							session(async () => {
								await work()
								throw new Error('synthetic replacement commit failure')
							})
					}
					expect(
						await portfolio.secrets.updateValue({ secretId: created.id, value: 'new value' }),
					).toMatchObject({
						ok: false,
						error: {
							type: fault === 'malformed-output' ? 'invalid-storage-output' : 'storage-operation-failed',
						},
					})
				} finally {
					adapter.updateMany = updateMany
					adapter.session = session
				}
				expect(adapter.stores.get('secrets')!.get(created.id)).toEqual(before)
			}, dependencies)
		},
	)

	it.each(['before-insert', 'after-insert', 'metadata', 'commit'] as const)(
		'does not commit a failed create at %s',
		async (mode) => {
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
							adapter.createMany = async (...args) =>
								(await createMany(...args)).map((row) => ({ ...row, title: null }))
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
					expect(
						await portfolio.secrets.create({ title: 'Uncommitted', value: 'synthetic-PROTECTED' }),
					).toEqual({
						ok: false,
						error: { type: mode === 'metadata' ? 'invalid-storage-output' : 'storage-operation-failed' },
					})
				} finally {
					adapter.createMany = createMany
					adapter.session = session
				}
				expect(requireSuccess(await portfolio.secrets.list())).toEqual([])
			}, dependencies)
		},
	)

	it('validates native Secret write responses and explicitly projects safe metadata', async () => {
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
							valueRef: 'synthetic-PROTECTED',
							created: { ...stamp.value, ignored: 'synthetic-PROTECTED' },
							valueUpdated: { ...stamp.value, ignored: 'synthetic-PROTECTED' },
						}
					})
				const secret = requireSuccess(
					await portfolio.secrets.create({ title: 'Safe', value: 'synthetic-PROTECTED' }),
				)
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
			rows.set(secret.id, { ...rows.get(secret.id)!, value: { mode: 'plaintext', plaintext: '' } })
			expect(await find({ secretId: secret.id })).toEqual({
				ok: false,
				error: { type: 'invalid-storage-output' },
			})
		}, dependencies)
	})
})
