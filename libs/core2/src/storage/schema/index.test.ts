import { expect, it } from 'vitest'

import { withExplicitId } from './index'

it('uses the explicit slot for the native generated primary-key input', async () => {
	const { Instance } = await import('equipped')
	const { Repo } = await import('equipped/orm')
	const { InMemoryAdapter } = await import('equipped/orm/adapters/in-memory')
	const { projectSchema } = await import('../../domain/project')
	const repo = Repo.from(InMemoryAdapter.create({}))
		.resolve((name) => ({ table: name }))
		.build()
	const id = Instance.createId()
	const created = await withExplicitId(id, () =>
		repo
			.on(projectSchema)
			.one()
			.create({
				title: '  Generated input  ',
				spec: { type: 'source-control' },
				created: { src: 'local', at: '2026-11-11T00:00:00.000Z', by: '', cid: null },
			}),
	)
	expect(created.id).toBe(id)
	expect(created.title).toBe('Generated input')
	expect(await repo.on(projectSchema).all().find()).toEqual([created])
})

it('fails native create without the explicit slot even when the row has an id', async () => {
	const { Instance } = await import('equipped')
	const { Repo } = await import('equipped/orm')
	const { InMemoryAdapter } = await import('equipped/orm/adapters/in-memory')
	const { projectSchema } = await import('../../domain/project')
	const repo = Repo.from(InMemoryAdapter.create({}))
		.resolve((name) => ({ table: name }))
		.build()
	await expect(
		repo
			.on(projectSchema)
			.one()
			.create({
				id: Instance.createId(),
				title: 'No slot',
				spec: { type: 'source-control' },
				created: { src: 'local', at: '2026-11-11T00:00:00.000Z', by: '', cid: null },
			}),
	).rejects.toThrow('Core must supply the record id')
	expect(await repo.on(projectSchema).all().find()).toEqual([])
})

it('stores and reads the five authoritative models with generated identities and nested fields', async () => {
	const { Instance } = await import('equipped')
	const { Repo } = await import('equipped/orm')
	const { InMemoryAdapter } = await import('equipped/orm/adapters/in-memory')
	const { projectSchema } = await import('../../domain/project')
	const { assetSchema } = await import('../../domain/asset')
	const { secretSchema } = await import('../../domain/secret')
	const { memorySchema } = await import('../../domain/memory')
	const { memoryRevisionSchema } = await import('../../domain/memory-revision')
	const adapter = InMemoryAdapter.create({})
	const repo = Repo.from(adapter)
		.resolve((name) => ({ table: name }))
		.build()
	const created = { src: 'local', at: '2026-11-11T00:00:00.000Z', by: '  test\n', cid: null } as const
	const projectId = Instance.createId()
	const secretId = Instance.createId()
	const assetId = Instance.createId()
	const memoryId = Instance.createId()
	const revisionId = Instance.createId()

	const project = await withExplicitId(projectId, () =>
		repo
			.on(projectSchema)
			.one()
			.create({
				id: projectId,
				title: '  Project  ',
				spec: { type: 'source-control' },
				created,
			}),
	)
	const secret = await withExplicitId(secretId, () =>
		repo.on(secretSchema).one().create({
			id: secretId,
			title: '  Access  ',
			valueRef: ' 	\n',
			created,
			valueUpdated: created,
		}),
	)
	const asset = await withExplicitId(assetId, () =>
		repo
			.on(assetSchema)
			.one()
			.create({
				id: assetId,
				projectId,
				created,
				spec: {
					type: 'repository',
					source: { provider: 'github', owner: 'Acme.Tools', name: 'Repo_v2-1', secretId },
				},
			}),
	)
	const memory = await withExplicitId(memoryId, () =>
		repo
			.on(memorySchema)
			.one()
			.create({
				id: memoryId,
				parentId: null,
				revision: { id: revisionId, version: 1, title: '  Notes  ' },
				created,
			}),
	)
	const revision = await withExplicitId(revisionId, () =>
		repo.on(memoryRevisionSchema).one().create({
			id: revisionId,
			memoryId,
			version: 1,
			title: '  Notes  ',
			body: '  Body É\n',
			created,
		}),
	)

	expect(project).toEqual({ id: projectId, title: 'Project', spec: { type: 'source-control' }, created })
	expect(secret).toEqual({ id: secretId, title: 'Access', valueRef: ' 	\n', created, valueUpdated: created })
	expect(asset).toEqual({
		id: assetId,
		projectId,
		created,
		spec: {
			type: 'repository',
			source: { provider: 'github', owner: 'Acme.Tools', name: 'Repo_v2-1', secretId },
		},
	})
	expect(memory).toEqual({
		id: memoryId,
		parentId: null,
		revision: { id: revisionId, version: 1, title: 'Notes' },
		created,
	})
	expect(revision).toEqual({ id: revisionId, memoryId, version: 1, title: 'Notes', body: '  Body É\n', created })
	expect(await repo.on(projectSchema).all().find()).toEqual([project])
	expect(await repo.on(secretSchema).all().find()).toEqual([secret])
	expect(await repo.on(assetSchema).all().find()).toEqual([asset])
	expect(await repo.on(memorySchema).all().find()).toEqual([memory])
	expect(await repo.on(memoryRevisionSchema).all().find()).toEqual([revision])
	expect((await adapter.introspect()).map((table) => table.name).sort()).toEqual([
		'assets',
		'memories',
		'memory_revisions',
		'projects',
		'secrets',
	])
})
