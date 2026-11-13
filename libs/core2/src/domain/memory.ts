import { Schema } from 'equipped/orm'
import { v, type PipeOutput } from 'valleyed'

import { auditStampPipe, idPipe, revisionVersionPipe, titlePipe } from './commons'
import { requireExplicitId, schemaPipe } from '../storage/schema'

export const memorySchema = Schema.from('memories')
	.pk('id', idPipe, requireExplicitId)
	.field('parentId', v.nullable(idPipe))
	.field('revision', v.object({ id: idPipe, version: revisionVersionPipe, title: titlePipe }))
	.field('created', auditStampPipe)
	.build()

export const memoryPipe = schemaPipe(memorySchema)
export type Memory = PipeOutput<typeof memoryPipe>

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest

	it('validates Memory references and revision fields through their shared pipes', () => {
		const stamp = { src: 'local', at: '2026-11-11T00:00:00.000Z', by: '', cid: null }
		const id = '01k00000000000000000000001'
		const boxed: unknown = Object('Notes')
		const input = { id, parentId: null, revision: { id, version: 1, title: 'Notes' }, created: stamp }
		for (const value of [
			{ ...input, id: `${id}\n` },
			{ ...input, parentId: `${id}\n` },
			{ ...input, revision: { ...input.revision, id: `${id}\n` } },
			{ ...input, revision: { ...input.revision, title: boxed } },
			{ ...input, revision: { ...input.revision, version: 9007199254740992 } },
			{ ...input, created: { src: 'local', at: stamp.at, by: '' } },
		])
			expect(v.validate(memoryPipe, value).valid).toBe(false)
	})

	it('parses compact Memory with required nullable parent and revision summary', () => {
		const stamp = { src: 'local', at: '2026-11-11T00:00:00.000Z', by: 'test', cid: null }
		const revision = { id: '01k00000000000000000000002', version: 1, title: '  Notes  ' }
		const input = {
			id: '01k00000000000000000000001',
			parentId: null,
			revision: { ...revision, body: 'hidden body', created: stamp },
			created: stamp,
			currentRevision: revision,
			updated: stamp,
		}
		expect(v.validate(memoryPipe, input)).toEqual({
			valid: true,
			value: {
				id: input.id,
				parentId: null,
				revision: { ...revision, title: 'Notes' },
				created: stamp,
			},
		})
		for (const value of [
			{ ...input, parentId: undefined },
			{ ...input, parentId: '' },
			{ ...input, revision: undefined },
			{ ...input, revision: { ...revision, version: 0 } },
		])
			expect(v.validate(memoryPipe, value).valid).toBe(false)
		expect(v.validate(memoryPipe, { ...input, parentId: '01k00000000000000000000003' }).valid).toBe(true)
	})
}
