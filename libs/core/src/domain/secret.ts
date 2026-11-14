import { Schema } from 'equipped/orm'
import { v, type PipeOutput } from 'valleyed'

import { requireExplicitId, schemaPipe } from '../storage/schema'
import { auditStampPipe, idPipe, protectedStringPipe, titlePipe } from './commons'

export const secretSchema = Schema.from('secrets')
	.pk('id', idPipe, requireExplicitId)
	.field('title', titlePipe)
	.field('valueRef', protectedStringPipe)
	.field('created', auditStampPipe)
	.field('valueUpdated', auditStampPipe)
	.build()

export const secretPipe = schemaPipe(secretSchema)
export const publicSecretPipe = v.object({
	id: secretSchema.fields.id.pipe,
	title: secretSchema.fields.title.pipe,
	created: secretSchema.fields.created.pipe,
	valueUpdated: secretSchema.fields.valueUpdated.pipe,
})
export type Secret = PipeOutput<typeof publicSecretPipe>

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest

	it('keeps Secret string validation primitive and rejects incomplete public stamps', () => {
		const stamp = { src: 'local', at: '2026-11-11T00:00:00.000Z', by: '', cid: null }
		const input = {
			id: '01k00000000000000000000001',
			title: 'Access',
			valueRef: 'synthetic-reference',
			created: stamp,
			valueUpdated: stamp,
		}
		const boxed: unknown = Object('text')
		for (const field of ['title', 'valueRef']) {
			for (const value of [boxed, { constructor: { name: 'String' }, length: 1 }]) {
				expect(v.validate(secretPipe, { ...input, [field]: value }).valid).toBe(false)
			}
		}
		for (const field of ['created', 'valueUpdated']) {
			const value = { ...input, [field]: { src: 'local', at: stamp.at, by: stamp.by } }
			expect(v.validate(secretPipe, value).valid).toBe(false)
			expect(v.validate(publicSecretPipe, value).valid).toBe(false)
		}
		expect(v.validate(secretPipe, { ...input, id: `${input.id}\n` }).valid).toBe(false)
	})

	it('does not evaluate undeclared protected getters when projecting safe metadata', () => {
		const stamp = { src: 'local', at: '2026-11-11T00:00:00.000Z', by: '', cid: null }
		const input = {
			id: '01k00000000000000000000001',
			title: 'Safe',
			created: stamp,
			valueUpdated: stamp,
			get value() {
				throw new Error('Must not read raw value')
			},
			get valueRef() {
				throw new Error('Must not read protected reference')
			},
		}
		expect(v.validate(publicSecretPipe, input)).toEqual({
			valid: true,
			value: { id: input.id, title: 'Safe', created: stamp, valueUpdated: stamp },
		})
	})

	it('projects only safe Secret metadata from the storage record', () => {
		const stamp = { src: 'local', at: '2026-11-11T00:00:00.000Z', by: 'test', cid: null }
		const input = {
			id: '01k00000000000000000000001',
			title: '  Access  ',
			valueRef: 'synthetic-protected-reference',
			value: 'synthetic-raw-value',
			created: stamp,
			valueUpdated: stamp,
		}
		const parsed = v.validate(publicSecretPipe, input)
		expect(parsed).toEqual({
			valid: true,
			value: {
				id: input.id,
				title: 'Access',
				created: stamp,
				valueUpdated: stamp,
			},
		})
		if (!parsed.valid) throw new Error('Expected valid safe projection')
		expect(Object.keys(parsed.value).sort()).toEqual(['created', 'id', 'title', 'valueUpdated'])
		expect(JSON.stringify(parsed.value)).not.toContain('synthetic-')
	})

	it('validates protected Secret storage with both required audit stamps', () => {
		const stamp = { src: 'local', at: '2026-11-11T00:00:00.000Z', by: 'test', cid: null }
		const input = {
			id: '01k00000000000000000000001',
			title: '  Access  ',
			valueRef: ' \t\n',
			created: stamp,
			valueUpdated: stamp,
			updated: stamp,
		}
		expect(v.validate(secretPipe, input)).toEqual({
			valid: true,
			value: {
				id: input.id,
				title: 'Access',
				valueRef: ' \t\n',
				created: stamp,
				valueUpdated: stamp,
			},
		})
		for (const value of [
			{ ...input, valueRef: '' },
			{ ...input, valueRef: undefined },
			{ ...input, valueUpdated: undefined },
			{ ...input, created: { src: 'local', at: stamp.at, by: stamp.by } },
		])
			expect(v.validate(secretPipe, value).valid).toBe(false)
	})
}
