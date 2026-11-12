import { AsyncLocalStorage } from 'node:async_hooks'

import { Schema, type AnySchemaField } from 'equipped/orm'
import { v } from 'valleyed'

import type { Id } from '../domain/commons'

const explicitId = new AsyncLocalStorage<Id>()

export function requireExplicitId(): Id {
	const id = explicitId.getStore()
	if (id === undefined) throw new Error('Core must supply the record id')
	return id
}

export function withExplicitId<T>(id: Id, work: () => Promise<T>): Promise<T> {
	return explicitId.run(id, work)
}

export function schemaPipe<F extends Record<string, AnySchemaField>>(schema: { fields: F }) {
	// Object.fromEntries loses the key/pipe relationship; retain it in one place.
	const fields = Object.fromEntries(Object.entries(schema.fields).map(([key, field]) => [key, field.pipe])) as {
		[K in keyof F]: F[K]['pipe']
	}
	return v.object(fields)
}

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest

	it('persists the supplied Equipped identity through native create', async () => {
		const { Instance } = await import('equipped')
		const { Repo } = await import('equipped/orm')
		const { InMemoryAdapter } = await import('equipped/orm/adapters/in-memory')
		const { idPipe } = await import('../domain/commons')
		const schema = Schema.from('test_records').pk('id', idPipe, requireExplicitId).build()
		const adapter = InMemoryAdapter.create({})
		const repo = Repo.from(adapter)
			.resolve((model) => ({ table: model.name }))
			.build()
		const id = Instance.createId()
		const created = await withExplicitId(id, () => repo.on(schema).one().create({ id }))
		expect(created).toEqual({ id })
		expect(await repo.on(schema).all().find()).toEqual([{ id }])
		expect(v.validate(idPipe, id).valid).toBe(true)
	})

	it('uses the explicit slot for the native generated primary-key input', async () => {
		const { Instance } = await import('equipped')
		const { Repo } = await import('equipped/orm')
		const { InMemoryAdapter } = await import('equipped/orm/adapters/in-memory')
		const { projectSchema } = await import('../domain/project')
		const repo = Repo.from(InMemoryAdapter.create({}))
			.resolve((model) => ({ table: model.name }))
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
		const { projectSchema } = await import('../domain/project')
		const repo = Repo.from(InMemoryAdapter.create({}))
			.resolve((model) => ({ table: model.name }))
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

	it('keeps explicit slots independent across awaits and restores enclosing context', async () => {
		const { Instance } = await import('equipped')
		const outer = Instance.createId()
		const inner = Instance.createId()
		await Promise.all(
			[outer, inner].map((id) =>
				withExplicitId(id, async () => {
					await Promise.resolve()
					expect(requireExplicitId()).toBe(id)
				}),
			),
		)
		await withExplicitId(outer, async () => {
			await expect(
				withExplicitId(inner, async () => {
					await Promise.resolve()
					expect(requireExplicitId()).toBe(inner)
					throw new Error('test work failed')
				}),
			).rejects.toThrow('test work failed')
			expect(requireExplicitId()).toBe(outer)
		})
		expect(() => requireExplicitId()).toThrow('Core must supply the record id')
	})

	it('stores and reads the five authoritative models with generated identities and nested fields', async () => {
		const { Instance } = await import('equipped')
		const { Repo } = await import('equipped/orm')
		const { InMemoryAdapter } = await import('equipped/orm/adapters/in-memory')
		const { projectSchema } = await import('../domain/project')
		const { assetSchema } = await import('../domain/asset')
		const { secretSchema } = await import('../domain/secret')
		const { memorySchema } = await import('../domain/memory')
		const { memoryRevisionSchema } = await import('../domain/memory-revision')
		const adapter = InMemoryAdapter.create({})
		const repo = Repo.from(adapter)
			.resolve((model) => ({ table: model.name }))
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
					spec: { type: 'repository', source: { provider: 'github', owner: 'Acme.Tools', name: 'Repo_v2-1', secretId } },
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
			spec: { type: 'repository', source: { provider: 'github', owner: 'Acme.Tools', name: 'Repo_v2-1', secretId } },
		})
		expect(memory).toEqual({ id: memoryId, parentId: null, revision: { id: revisionId, version: 1, title: 'Notes' }, created })
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

	it('preserves distinct field input and parsed output types in the derived pipe', () => {
		const schema = Schema.from('test_lengths')
			.pk('id', v.string(), () => 'generated')
			.field(
				'length',
				v.string().pipe((value) => value.length),
			)
			.build()
		const parsed = v.validate(schemaPipe(schema), { id: 'supplied', length: 'Notes' })
		if (!parsed.valid) throw new Error('Expected parsed length')
		expect(parsed.value.length.toFixed(1)).toBe('5.0')
	})

	it('derives parsed fields including the primary key without applying create defaults', () => {
		const schema = Schema.from('test_records')
			.pk('id', v.string(), () => 'generated')
			.field('title', v.string().pipe(v.asTrimmed()), { onCreate: () => 'default' })
			.build()
		const pipe = schemaPipe(schema)
		expect(v.validate(pipe, { id: 'supplied', title: '  Notes  ', ignored: true })).toEqual({
			valid: true,
			value: { id: 'supplied', title: 'Notes' },
		})
		expect(v.validate(pipe, { title: 'Notes' }).valid).toBe(false)
		expect(v.validate(pipe, { id: 'supplied' }).valid).toBe(false)
	})
}
