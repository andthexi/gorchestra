import { v } from 'valleyed'

import { memoryPipe, memorySchema } from '../../domain/memory'
import { notFoundPipe } from '../../errors'
import { defineOperation } from '../../runtime/define-operation'
import { stored, storageCall } from '../../storage/read'

export const list = defineOperation({
	title: 'List Memories',
	description: 'List roots or the direct children of a required Memory.',
	input: v.object({ parentId: memorySchema.fields.parentId.pipe }),
	output: v.array(memoryPipe),
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
		const query = context.storage
			.on(memorySchema)
			.all()
			.where((q) => q.eq(memorySchema.fields.parentId, input.parentId))
		const read = await storageCall(() => query.find())
		if (!read.ok) return read
		const memories = stored(v.array(memoryPipe), read.value)
		if (!memories.ok) return memories
		return { ok: true, value: memories.value.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) }
	},
})
