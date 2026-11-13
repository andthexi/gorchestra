import { describe, expect, it } from 'vitest'

import { createCountedSecretDependencies } from '../../../testing/dependencies'
import {
	createAssetFixture,
	createAssetPrerequisites,
	createProjectPair,
	createTestDependencies,
	requireSuccess,
	withReadyPortfolio,
} from '../../../testing/fixtures'

describe('project assets', () => {
	it('returns parsed native Asset results and read records without repairing stored extras', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const createMany = adapter.createMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const {
				project,
				secret,
				input: { spec },
			} = await createAssetPrerequisites(portfolio)
			const writes: Array<Record<string, unknown>[]> = []
			adapter.createMany = async (...args) => {
				writes.push(structuredClone(args[2]))
				return (await createMany(...args)).map((row) => ({
					...row,
					title: 'synthetic-PROTECTED',
					spec: { ...spec, ignored: true, source: { ...spec.source, ignored: true } },
				}))
			}
			try {
				const result = await portfolio.projects.assets.create({ projectId: project.id, spec })
				const asset = requireSuccess(result)
				expect(result).toEqual({ ok: true, value: asset })
				expect(Object.keys(asset).sort()).toEqual(['created', 'id', 'projectId', 'spec'])
				expect(asset.spec).toEqual(spec)
				expect(writes).toEqual([[asset]])
				const stored = {
					...asset,
					title: 'synthetic-PROTECTED',
					spec: { ...spec, ignored: true, source: { ...spec.source, ignored: true } },
					created: { ...asset.created, ignored: true },
				}
				adapter.stores.get('assets')!.set(asset.id, stored)
				expect(requireSuccess(await portfolio.projects.assets.find({ projectId: project.id, assetId: asset.id }))).toEqual(asset)
				expect(requireSuccess(await portfolio.projects.assets.list({ projectId: project.id }))).toEqual([asset])
				expect(requireSuccess(await portfolio.secrets.usages({ secretId: secret.id }))).toEqual([asset])
				expect(adapter.stores.get('assets')!.get(asset.id)).toEqual(stored)
			} finally {
				adapter.createMany = createMany
			}
		}, dependencies)
	})
	it('validates full Asset records delivered by native queries before any use', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const findMany = adapter.findMany.bind(adapter)
		const createMany = adapter.createMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const { project, secret, input, asset } = await createAssetFixture(portfolio)
			const corruptions = [
				{ id: 'invalid' },
				{ projectId: 'invalid' },
				{ spec: { ...asset.spec, type: 'unsupported' } },
				...[{ provider: 'gitlab' }, { owner: '.' }, { name: 'a/b' }, { secretId: 'invalid' }].map((source) => ({
					spec: { ...asset.spec, source: { ...asset.spec.source, ...source } },
				})),
				{ created: { ...asset.created, cid: undefined } },
			]
			let writes = 0
			adapter.createMany = (...args) => {
				writes++
				return createMany(...args)
			}
			try {
				for (const corruption of corruptions) {
					// Inject after native filtering so every malformed record belongs to the returned-row contract.
					adapter.findMany = async (...args) => {
						const rows = await findMany(...args)
						return args[0].name === 'assets' ? rows.map((row) => ({ ...row, ...corruption })) : rows
					}
					for (const result of [
						await portfolio.projects.assets.create(input),
						await portfolio.projects.assets.find({ projectId: project.id, assetId: asset.id }),
						await portfolio.projects.assets.list({ projectId: project.id }),
						await portfolio.secrets.usages({ secretId: secret.id }),
					])
						expect(result).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
				}
				expect(writes).toBe(0)
				expect([...adapter.stores.get('assets')!.values()]).toEqual([asset])
			} finally {
				adapter.findMany = findMany
				adapter.createMany = createMany
			}
		}, dependencies)
	})
	it('classifies native prerequisite and Asset read failures without writes or closed admission', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const findMany = adapter.findMany.bind(adapter)
		const createMany = adapter.createMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const { project, secret, input, asset } = await createAssetFixture(portfolio)
			let writes = 0
			adapter.createMany = (...args) => {
				writes++
				return createMany(...args)
			}
			try {
				for (const table of ['projects', 'secrets', 'assets']) {
					adapter.findMany = (...args) => {
						if (args[0].name === table) throw new Error('synthetic-PROTECTED')
						return findMany(...args)
					}
					expect(await portfolio.projects.assets.create(input)).toEqual({
						ok: false,
						error: { type: 'storage-operation-failed' },
					})
					if (table !== 'secrets') {
						expect(await portfolio.projects.assets.find({ projectId: project.id, assetId: asset.id })).toEqual({
							ok: false,
							error: { type: 'storage-operation-failed' },
						})
						expect(await portfolio.projects.assets.list({ projectId: project.id })).toEqual({
							ok: false,
							error: { type: 'storage-operation-failed' },
						})
					}
					if (table !== 'projects')
						expect(await portfolio.secrets.usages({ secretId: secret.id })).toEqual({
							ok: false,
							error: { type: 'storage-operation-failed' },
						})
				}
				expect(writes).toBe(0)
			} finally {
				adapter.findMany = findMany
				adapter.createMany = createMany
			}
			expect(requireSuccess(await portfolio.projects.assets.find({ projectId: project.id, assetId: asset.id }))).toEqual(asset)
			expect(requireSuccess(await portfolio.projects.assets.list({ projectId: project.id }))).toEqual([asset])
			expect(requireSuccess(await portfolio.secrets.usages({ secretId: secret.id }))).toEqual([asset])
		}, dependencies)
	})
	it.each(['before-insert', 'after-insert', 'output', 'commit'] as const)(
		'rolls back an Asset create failure at %s without changing prerequisites',
		async (stage) => {
			const dependencies = createTestDependencies()
			const adapter = dependencies.storage.adapter
			const createMany = adapter.createMany.bind(adapter)
			const session = adapter.session.bind(adapter)
			await withReadyPortfolio(async (portfolio) => {
				const { project, secret, input, asset: existing } = await createAssetFixture(portfolio)
				const fullSecret = structuredClone(adapter.stores.get('secrets')!.get(secret.id)!)
				let inserted = 0
				adapter.createMany = async (...args) => {
					if (stage === 'before-insert') throw new Error('synthetic-PROTECTED')
					const rows = await createMany(...args)
					inserted += rows.length
					if (stage === 'after-insert') throw new Error('synthetic-PROTECTED')
					return stage === 'output' ? rows.map((row) => ({ ...row, created: null })) : rows
				}
				if (stage === 'commit')
					adapter.session = (work) =>
						session(async () => {
							await work()
							throw new Error('synthetic-PROTECTED')
						})
				try {
					expect(
						await portfolio.projects.assets.create({
							...input,
							spec: { ...input.spec, source: { ...input.spec.source, name: 'Different' } },
						}),
					).toEqual({ ok: false, error: { type: stage === 'output' ? 'invalid-output' : 'storage-operation-failed' } })
				} finally {
					adapter.createMany = createMany
					adapter.session = session
				}
				expect(inserted).toBe(stage === 'before-insert' ? 0 : 1)
				expect(requireSuccess(await portfolio.projects.assets.list({ projectId: project.id }))).toEqual([existing])
				expect(requireSuccess(await portfolio.projects.find({ projectId: project.id }))).toEqual(project)
				expect(requireSuccess(await portfolio.secrets.find({ secretId: secret.id }))).toEqual(secret)
				expect(adapter.stores.get('secrets')!.get(secret.id)).toEqual(fullSecret)
			}, dependencies)
		},
	)
	it('rejects malformed identifiers and required fields before a transaction or codec', async () => {
		const { dependencies, codecCalls } = createCountedSecretDependencies()
		const adapter = dependencies.storage.adapter
		const session = adapter.session.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const id = '01k00000000000000000000001'
			const spec = {
				type: 'repository' as const,
				source: { provider: 'github' as const, owner: 'Owner', name: 'Repo', secretId: id },
			}
			const { create, find, list } = portfolio.projects.assets
			const boxedId: unknown = Object(id)
			const boxedName: unknown = Object('Repo')
			let sessions = 0
			adapter.session = () => {
				sessions++
				throw new Error('Invalid input must not open a transaction')
			}
			try {
				for (const invalid of [
					'',
					id.toUpperCase(),
					` ${id}`,
					`${id}\n`,
					'8zzzzzzzzzzzzzzzzzzzzzzzzz',
					'not-an-id',
					null,
					1,
					boxedId,
					{ constructor: { name: 'String' } },
				]) {
					for (const [operation, input, path] of [
						[create, { projectId: invalid, spec }, 'projectId'],
						[
							create,
							{ projectId: id, spec: { ...spec, source: { ...spec.source, secretId: invalid } } },
							'spec.source.secretId',
						],
						[find, { projectId: invalid, assetId: id }, 'projectId'],
						[find, { projectId: id, assetId: invalid }, 'assetId'],
						[list, { projectId: invalid }, 'projectId'],
						[portfolio.secrets.usages, { secretId: invalid }, 'secretId'],
					] as const) {
						const result: unknown = await Reflect.apply(operation, undefined, [input])
						expect(result).toEqual({
							ok: false,
							error: { type: 'invalid-input', issues: [{ path, message: 'Expected a Core id.' }] },
						})
					}
				}
				for (const field of ['owner', 'name']) {
					for (const invalid of [
						'',
						'.',
						'..',
						' Owner',
						'Owner ',
						'Repo\n',
						'https://github.com/Owner/Repo',
						'a/b',
						'a\\b',
						'a%2fb',
						'a%5cb',
						'é',
						boxedName,
						null,
					]) {
						const result: unknown = await Reflect.apply(create, undefined, [
							{ projectId: id, spec: { ...spec, source: { ...spec.source, [field]: invalid } } },
						])
						expect(result).toEqual({
							ok: false,
							error: {
								type: 'invalid-input',
								issues: [{ path: `spec.source.${field}`, message: 'Expected a repository identifier.' }],
							},
						})
					}
				}
				for (const operation of [create, find, list, portfolio.secrets.usages]) {
					for (const input of [undefined, null, {}, 1, []])
						expect(await Reflect.apply(operation, undefined, [input])).toMatchObject({
							ok: false,
							error: { type: 'invalid-input' },
						})
				}
				for (const input of [
					{ projectId: id },
					{ spec },
					{ projectId: id, spec: { ...spec, type: 'source-control' } },
					{ projectId: id, spec: { ...spec, source: { ...spec.source, provider: 'gitlab' } } },
					{ projectId: id, spec: { ...spec, source: { owner: 'Owner', name: 'Repo' } } },
				])
					expect(await Reflect.apply(create, undefined, [input])).toMatchObject({ ok: false, error: { type: 'invalid-input' } })
				expect(await Reflect.apply(find, undefined, [{ projectId: id }])).toMatchObject({
					ok: false,
					error: { type: 'invalid-input' },
				})
				expect(await Reflect.apply(find, undefined, [{ assetId: id }])).toMatchObject({
					ok: false,
					error: { type: 'invalid-input' },
				})
				expect({ sessions, ...codecCalls }).toEqual({ sessions: 0, encodes: 0, decodes: 0 })
			} finally {
				adapter.session = session
			}
		}, dependencies)
	})
	it('preserves accepted punctuation and strips caller-owned identity and nested extras', async () => {
		await withReadyPortfolio(async (portfolio) => {
			const project = requireSuccess(await portfolio.projects.create({ title: 'App', spec: { type: 'source-control' } }))
			const secret = requireSuccess(await portfolio.secrets.create({ title: 'Access', value: 'synthetic-pat' }))
			for (const identifier of ['A.B_c-1', '...', '_', '-']) {
				const spec = {
					type: 'repository' as const,
					source: { provider: 'github' as const, owner: identifier, name: identifier, secretId: secret.id },
				}
				const input = {
					projectId: project.id,
					id: 'caller-id',
					title: 'ignored',
					created: {},
					spec: { ...spec, ignored: true, source: { ...spec.source, ignored: true } },
				}
				const asset = requireSuccess(await portfolio.projects.assets.create(input))
				expect(asset.id).not.toBe(input.id)
				expect(Object.keys(asset).sort()).toEqual(['created', 'id', 'projectId', 'spec'])
				expect(asset.spec).toEqual(spec)
				expect(input.spec.source.ignored).toBe(true)
			}
		})
	})
	it('cannot use a Secret from another Portfolio', async () => {
		await withReadyPortfolio(async (foreign) => {
			const secret = requireSuccess(await foreign.secrets.create({ title: 'Foreign', value: 'synthetic-pat' }))
			await withReadyPortfolio(async (portfolio) => {
				const project = requireSuccess(await portfolio.projects.create({ title: 'Local', spec: { type: 'source-control' } }))
				expect(
					await portfolio.projects.assets.create({
						projectId: project.id,
						spec: { type: 'repository', source: { provider: 'github', owner: 'Owner', name: 'Repo', secretId: secret.id } },
					}),
				).toEqual({ ok: false, error: { type: 'not-found', resource: 'secret', id: secret.id } })
				expect(requireSuccess(await portfolio.projects.assets.list({ projectId: project.id }))).toEqual([])
			})
		})
	})
	it('lists every scoped Asset by ID and requires a valid Project even when empty', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		await withReadyPortfolio(async (portfolio) => {
			const { project, other } = await createProjectPair(portfolio)
			const { list } = portfolio.projects.assets
			expect(requireSuccess(await list({ projectId: project.id }))).toEqual([])
			const missing = '01k00000000000000000000001'
			expect(await list({ projectId: missing })).toEqual({
				ok: false,
				error: { type: 'not-found', resource: 'project', id: missing },
			})
			const secret = requireSuccess(await portfolio.secrets.create({ title: 'Access', value: 'synthetic-pat' }))
			const asset = requireSuccess(
				await portfolio.projects.assets.create({
					projectId: project.id,
					spec: { type: 'repository', source: { provider: 'github', owner: 'Owner', name: 'Repo', secretId: secret.id } },
				}),
			)
			const expected = Array.from({ length: 125 }, (_, index) => ({ ...asset, id: `01k${index.toString().padStart(23, '0')}` }))
			adapter.stores.get('assets')!.clear()
			for (const row of [...expected].reverse()) adapter.stores.get('assets')!.set(row.id, row)
			adapter.stores.get('assets')!.set(asset.id, { ...asset, projectId: other.id, created: null })
			expect(requireSuccess(await list({ projectId: project.id }))).toEqual(expected)
			adapter.stores.get('assets')!.set(expected[0]!.id, { ...expected[0]!, created: null })
			expect(await list({ projectId: project.id })).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
			adapter.stores.get('projects')!.set(project.id, { ...project, spec: { type: 'unsupported' } })
			const findMany = adapter.findMany.bind(adapter)
			const reads: string[] = []
			adapter.findMany = (...args) => {
				reads.push(args[0].name)
				return findMany(...args)
			}
			try {
				expect(await list({ projectId: project.id })).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
				expect(reads).toEqual(['projects'])
			} finally {
				adapter.findMany = findMany
			}
		}, dependencies)
	})
	it('finds an Asset only under its required valid Project without disclosing another owner', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		await withReadyPortfolio(async (portfolio) => {
			const { project, other } = await createProjectPair(portfolio)
			const secret = requireSuccess(await portfolio.secrets.create({ title: 'Access', value: 'synthetic-pat' }))
			const asset = requireSuccess(
				await portfolio.projects.assets.create({
					projectId: project.id,
					spec: { type: 'repository', source: { provider: 'github', owner: 'Owner', name: 'Repo', secretId: secret.id } },
				}),
			)
			const { find } = portfolio.projects.assets
			expect(requireSuccess(await find({ projectId: project.id, assetId: asset.id }))).toEqual(asset)
			expect(await find({ projectId: other.id, assetId: asset.id })).toEqual({
				ok: false,
				error: { type: 'not-found', resource: 'asset', id: asset.id },
			})
			const missing = '01k00000000000000000000001'
			expect(await find({ projectId: missing, assetId: asset.id })).toEqual({
				ok: false,
				error: { type: 'not-found', resource: 'project', id: missing },
			})
			expect(await find({ projectId: project.id, assetId: missing })).toEqual({
				ok: false,
				error: { type: 'not-found', resource: 'asset', id: missing },
			})
			adapter.stores.get('assets')!.set(asset.id, { ...asset, spec: { ...asset.spec, type: 'unsupported' } })
			expect(await find({ projectId: other.id, assetId: asset.id })).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
			adapter.stores.get('projects')!.set(other.id, { ...other, created: { ...other.created, cid: undefined } })
			const findMany = adapter.findMany.bind(adapter)
			const reads: string[] = []
			adapter.findMany = (...args) => {
				reads.push(args[0].name)
				return findMany(...args)
			}
			try {
				expect(await find({ projectId: other.id, assetId: missing })).toEqual({
					ok: false,
					error: { type: 'invalid-storage-output' },
				})
				expect(reads).toEqual(['projects'])
			} finally {
				adapter.findMany = findMany
			}
		}, dependencies)
	})
	it('validates every scoped candidate before returning an observed duplicate', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const createMany = adapter.createMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const { input, asset } = await createAssetFixture(portfolio)
			adapter.stores.get('assets')!.set('01k00000000000000000000001', {
				...asset,
				id: '01k00000000000000000000001',
				created: { ...asset.created, cid: undefined },
			})
			let writes = 0
			adapter.createMany = (...args) => {
				writes++
				return createMany(...args)
			}
			try {
				expect(await portfolio.projects.assets.create(input)).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
				expect(writes).toBe(0)
				expect(adapter.stores.get('assets')!.get(asset.id)).toEqual(asset)
			} finally {
				adapter.createMany = createMany
			}
		}, dependencies)
	})
	it('refuses observed case-insensitive targets within one Project regardless of Secret', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const createMany = adapter.createMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const { project, other } = await createProjectPair(portfolio)
			const secret = requireSuccess(await portfolio.secrets.create({ title: 'Access', value: 'synthetic-pat' }))
			const replacement = requireSuccess(await portfolio.secrets.create({ title: 'Other access', value: 'synthetic-other' }))
			const input = {
				projectId: project.id,
				spec: {
					type: 'repository' as const,
					source: { provider: 'github' as const, owner: 'Acme.Tools', name: 'Repo_v2-1', secretId: secret.id },
				},
			}
			const asset = requireSuccess(await portfolio.projects.assets.create(input))
			let writes = 0
			adapter.createMany = (...args) => {
				writes++
				return createMany(...args)
			}
			try {
				for (const [owner, name] of [
					['Acme.Tools', 'Repo_v2-1'],
					['acme.tools', 'Repo_v2-1'],
					['Acme.Tools', 'repo_v2-1'],
					['ACME.TOOLS', 'REPO_V2-1'],
				]) {
					for (const secretId of [secret.id, replacement.id])
						expect(
							await portfolio.projects.assets.create({
								...input,
								spec: { ...input.spec, source: { ...input.spec.source, owner: owner!, name: name!, secretId } },
							}),
						).toEqual({ ok: false, error: { type: 'duplicate-asset-target', assetId: asset.id } })
				}
				expect(writes).toBe(0)
				expect(adapter.stores.get('assets')!.get(asset.id)).toEqual(asset)
				requireSuccess(await portfolio.projects.assets.create({ ...input, projectId: other.id }))
				for (const source of [
					{ ...input.spec.source, owner: 'Acme-Tools' },
					{ ...input.spec.source, name: 'Repo_v2-10' },
				])
					requireSuccess(await portfolio.projects.assets.create({ ...input, spec: { ...input.spec, source } }))
				expect(writes).toBe(3)
			} finally {
				adapter.createMany = createMany
			}
		}, dependencies)
	})
	it('requires full valid Project then Secret before any Asset write', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const createMany = adapter.createMany.bind(adapter)
		const findMany = adapter.findMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			const project = requireSuccess(await portfolio.projects.create({ title: 'App', spec: { type: 'source-control' } }))
			const secret = requireSuccess(await portfolio.secrets.create({ title: 'Access', value: 'synthetic-pat' }))
			const fullSecret = structuredClone(adapter.stores.get('secrets')!.get(secret.id)!)
			const missing = '01k00000000000000000000001'
			const input = {
				projectId: project.id,
				spec: {
					type: 'repository' as const,
					source: { provider: 'github' as const, owner: 'Owner', name: 'Repo', secretId: secret.id },
				},
			}
			let writes = 0
			const reads: string[] = []
			adapter.createMany = (...args) => {
				writes++
				return createMany(...args)
			}
			adapter.findMany = (...args) => {
				reads.push(args[0].name)
				return findMany(...args)
			}
			try {
				expect(await portfolio.projects.assets.create({ ...input, projectId: missing })).toEqual({
					ok: false,
					error: { type: 'not-found', resource: 'project', id: missing },
				})
				expect(reads.splice(0)).toEqual(['projects'])
				for (const corrupt of [
					{ ...project, spec: { type: 'unsupported' } },
					{ ...project, created: { ...project.created, cid: undefined } },
				]) {
					adapter.stores.get('projects')!.set(project.id, corrupt)
					expect(await portfolio.projects.assets.create(input)).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
					expect(reads.splice(0)).toEqual(['projects'])
				}
				adapter.stores.get('projects')!.set(project.id, project)
				expect(
					await portfolio.projects.assets.create({
						...input,
						spec: { ...input.spec, source: { ...input.spec.source, secretId: missing } },
					}),
				).toEqual({ ok: false, error: { type: 'not-found', resource: 'secret', id: missing } })
				expect(reads.splice(0)).toEqual(['projects', 'secrets'])
				for (const corrupt of [
					{ ...fullSecret, valueRef: '' },
					{ ...fullSecret, valueRef: undefined },
					{ ...fullSecret, valueRef: 1 },
					{ ...fullSecret, valueUpdated: undefined },
					{ ...fullSecret, created: { ...secret.created, cid: undefined } },
				]) {
					adapter.stores.get('secrets')!.set(secret.id, corrupt)
					expect(await portfolio.projects.assets.create(input)).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
					expect(reads.splice(0)).toEqual(['projects', 'secrets'])
				}
				expect(writes).toBe(0)
				expect(adapter.stores.get('assets')?.size ?? 0).toBe(0)
				adapter.stores.get('secrets')!.set(secret.id, fullSecret)
				requireSuccess(await portfolio.projects.assets.create(input))
			} finally {
				adapter.createMany = createMany
				adapter.findMany = findMany
			}
		}, dependencies)
	})
	it('creates one immutable target with exact casing and Core attribution', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		await withReadyPortfolio(async (portfolio) => {
			const project = requireSuccess(await portfolio.projects.create({ title: 'App', spec: { type: 'source-control' } }))
			const secret = requireSuccess(await portfolio.secrets.create({ title: 'Access', value: 'synthetic-pat' }))
			const spec = {
				type: 'repository' as const,
				source: { provider: 'github' as const, owner: 'Acme.Tools', name: 'Repo_v2-1', secretId: secret.id },
			}
			const before = Date.now()
			const { create } = portfolio.projects.assets
			const asset = requireSuccess(await create({ projectId: project.id, spec }))
			expect(Object.keys(asset).sort()).toEqual(['created', 'id', 'projectId', 'spec'])
			expect(asset.id).toMatch(/^[0-7][0-9a-hjkmnp-tv-z]{25}$/)
			expect(asset.projectId).toBe(project.id)
			expect(asset.spec).toEqual(spec)
			expect(asset.created).toMatchObject({ src: 'local', by: 'test-author', cid: 'test-call' })
			expect(Date.parse(asset.created.at)).toBeGreaterThanOrEqual(before)
			expect(Date.parse(asset.created.at)).toBeLessThanOrEqual(Date.now())
			expect(new Date(asset.created.at).toISOString()).toBe(asset.created.at)
			expect([...adapter.stores.get('assets')!.values()]).toEqual([asset])
			expect(requireSuccess(await portfolio.projects.find({ projectId: project.id }))).toEqual(project)
			expect(requireSuccess(await portfolio.secrets.find({ secretId: secret.id }))).toEqual(secret)
			for (const table of ['memories', 'memory_revisions']) expect(adapter.stores.get(table)?.size ?? 0).toBe(0)
		}, dependencies)
	})
})
