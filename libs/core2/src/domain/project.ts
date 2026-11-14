import { Schema } from 'equipped/orm'
import { v, type PipeOutput } from 'valleyed'

import { requireExplicitId, schemaPipe } from '../storage/schema'
import { auditStampPipe, idPipe, titlePipe } from './commons'

export const projectSchema = Schema.from('projects')
	.pk('id', idPipe, requireExplicitId)
	.field('title', titlePipe)
	.field(
		'spec',
		v.object({
			type: v.custom<'source-control'>(
				(value) => value === 'source-control',
				'Expected a source-control project.',
			),
		}),
	)
	.field('created', auditStampPipe)
	.build()

export const projectPipe = schemaPipe(projectSchema)
export type Project = PipeOutput<typeof projectPipe>

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest

	it('rejects malformed Project fields without normalizing discriminators or stored attribution', () => {
		const stamp = { src: 'local', at: '2026-11-11T00:00:00.000Z', by: '', cid: null }
		const input = {
			id: '01k00000000000000000000001',
			title: 'Notes',
			spec: { type: 'source-control' },
			created: stamp,
		}
		const boxed: unknown = Object('source-control')
		for (const type of ['source-control\n', 'repository', boxed, { constructor: { name: 'String' } }]) {
			expect(v.validate(projectPipe, { ...input, spec: { type } }).valid).toBe(false)
		}
		for (const value of [
			{ ...input, id: `${input.id}\n` },
			{ ...input, title: ' \n' },
			{ ...input, created: { src: 'local', at: stamp.at, by: '' } },
			{ ...input, created: { ...stamp, cid: undefined } },
		])
			expect(v.validate(projectPipe, value).valid).toBe(false)
	})

	it('parses the nested Project shape instead of the legacy root type', () => {
		const stamp = { src: 'local', at: '2026-11-11T00:00:00.000Z', by: '', cid: null }
		const input = {
			id: '01k00000000000000000000001',
			title: '  Notes  É\n',
			spec: { type: 'source-control', ignored: true },
			created: stamp,
			updated: stamp,
			type: 'old',
		}
		expect(v.validate(projectPipe, input)).toEqual({
			valid: true,
			value: {
				id: input.id,
				title: 'Notes  É',
				spec: { type: 'source-control' },
				created: stamp,
			},
		})
		expect(
			v.validate(projectPipe, { id: input.id, title: 'Notes', type: 'source-control', created: stamp }).valid,
		).toBe(false)
		expect(input.title).toBe('  Notes  É\n')
	})
}
