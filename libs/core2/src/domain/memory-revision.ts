import { Schema } from 'equipped/orm'
import { v, type PipeOutput } from 'valleyed'

import { auditStampPipe, bodyPipe, idPipe, revisionVersionPipe, titlePipe } from './commons'
import { requireExplicitId, schemaPipe } from '../storage/schema'

export const memoryRevisionSchema = Schema.from('memory_revisions')
	.pk('id', idPipe, requireExplicitId)
	.field('memoryId', idPipe)
	.field('version', revisionVersionPipe)
	.field('title', titlePipe)
	.field('body', bodyPipe)
	.field('created', auditStampPipe)
	.build()

export const memoryRevisionPipe = schemaPipe(memoryRevisionSchema)
export type MemoryRevision = PipeOutput<typeof memoryRevisionPipe>

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest

	it('rejects nonprimitive revision text and malformed references or stored stamps', () => {
		const stamp = { src: 'local', at: '2026-11-11T00:00:00.000Z', by: '', cid: null }
		const id = '01k00000000000000000000001'
		const input = { id, memoryId: id, version: 1, title: 'Notes', body: '', created: stamp }
		const boxed: unknown = Object('text')
		for (const field of ['title', 'body']) {
			for (const value of [boxed, { constructor: { name: 'String' } }]) {
				expect(v.validate(memoryRevisionPipe, { ...input, [field]: value }).valid).toBe(false)
			}
		}
		for (const value of [
			{ ...input, id: `${id}\n` },
			{ ...input, memoryId: `${id}\n` },
			{ ...input, created: { src: 'local', at: stamp.at, by: '' } },
		])
			expect(v.validate(memoryRevisionPipe, value).valid).toBe(false)
	})

	it('parses full MemoryRevision with exact body and safe version', () => {
		const stamp = { src: 'local', at: '2026-11-11T00:00:00.000Z', by: 'test', cid: null }
		const input = {
			id: '01k00000000000000000000002',
			memoryId: '01k00000000000000000000001',
			version: 1,
			title: '  Notes  ',
			body: '',
			created: stamp,
			updated: stamp,
		}
		for (const body of ['', ' \t\r\n', '  Body É\n']) {
			expect(v.validate(memoryRevisionPipe, { ...input, body })).toEqual({
				valid: true,
				value: {
					id: input.id,
					memoryId: input.memoryId,
					version: 1,
					title: 'Notes',
					body,
					created: stamp,
				},
			})
		}
		for (const value of [
			{ ...input, memoryId: undefined },
			{ ...input, body: undefined },
			{ ...input, title: ' \n' },
			{ ...input, version: 0 },
			{ ...input, version: '1' },
			{ ...input, version: 9007199254740992 },
		])
			expect(v.validate(memoryRevisionPipe, value).valid).toBe(false)
	})
}
