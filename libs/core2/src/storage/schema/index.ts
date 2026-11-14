import { AsyncLocalStorage } from 'node:async_hooks'

import { Schema, type AnySchemaField } from 'equipped/orm'
import { v } from 'valleyed'

import type { Id } from '../../domain/commons'

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
		const { idPipe } = await import('../../domain/commons')
		const schema = Schema.from('test_records').pk('id', idPipe, requireExplicitId).build()
		const adapter = InMemoryAdapter.create({})
		const repo = Repo.from(adapter)
			.resolve((name) => ({ table: name }))
			.build()
		const id = Instance.createId()
		const created = await withExplicitId(id, () => repo.on(schema).one().create({ id }))
		expect(created).toEqual({ id })
		expect(await repo.on(schema).all().find()).toEqual([{ id }])
		expect(v.validate(idPipe, id).valid).toBe(true)
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
