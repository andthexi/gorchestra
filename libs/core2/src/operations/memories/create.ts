import { Instance } from 'equipped'
import { v } from 'valleyed'

import { memoryPipe, memorySchema } from '../../domain/memory'
import { memoryRevisionPipe, memoryRevisionSchema } from '../../domain/memory-revision'
import { notFoundPipe } from '../../errors'
import { defineOperation } from '../../runtime/define-operation'
import { stored, storageCall } from '../../storage/read'
import { withExplicitId } from '../../storage/schema'

export const create = defineOperation({
	title: 'Create Memory',
	description: 'Create a compact Memory and its immutable first revision.',
	input: v.object({
		parentId: memorySchema.fields.parentId.pipe,
		title: memoryRevisionSchema.fields.title.pipe,
		body: memoryRevisionSchema.fields.body.pipe,
	}),
	output: v.object({ memory: memoryPipe, revision: memoryRevisionPipe }),
	error: v.merge(notFoundPipe, v.object({ resource: v.eq('memory') })),
	handler: async (input, context) => {
		if (input.parentId !== null) {
			const parentQuery = context.storage.on(memorySchema).one().id(input.parentId)
			const read = await storageCall(() => parentQuery.find())
			if (!read.ok) return read
			if (read.value === null) return { ok: false, error: { type: 'not-found', resource: 'memory' as const, id: input.parentId } }
			const parent = stored(memoryPipe, read.value)
			if (!parent.ok) return parent
		}
		const memoryId = Instance.createId()
		const revisionId = Instance.createId()
		const summary = { id: revisionId, version: 1, title: input.title }
		const memoryQuery = context.storage.on(memorySchema).one()
		const memory = await withExplicitId(memoryId, () =>
			storageCall(() => memoryQuery.create({ id: memoryId, parentId: input.parentId, revision: summary, created: context.stamp })),
		)
		if (!memory.ok) return memory
		const revisionQuery = context.storage.on(memoryRevisionSchema).one()
		const revision = await withExplicitId(revisionId, () =>
			storageCall(() => revisionQuery.create({ ...summary, memoryId, body: input.body, created: context.stamp })),
		)
		if (!revision.ok) return revision
		return { ok: true, value: { memory: memory.value, revision: revision.value } }
	},
})
