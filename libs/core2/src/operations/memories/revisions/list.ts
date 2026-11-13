import { v } from 'valleyed'

import { memoryPipe, memorySchema } from '../../../domain/memory'
import { memoryRevisionPipe, memoryRevisionSchema } from '../../../domain/memory-revision'
import { notFoundPipe } from '../../../errors'
import { defineOperation } from '../../../runtime/define-operation'
import { stored, storageCall } from '../../../storage/read'

export const list = defineOperation({
	title: 'List Memory Revisions',
	description: 'List the complete immutable history of a required Memory by version.',
	input: v.object({ memoryId: memoryRevisionSchema.fields.memoryId.pipe }),
	output: v.array(memoryRevisionPipe),
	error: v.merge(notFoundPipe, v.object({ resource: v.eq('memory') })),
	handler: async (input, context) => {
		const memoryQuery = context.storage.on(memorySchema).one().id(input.memoryId)
		const memoryRead = await storageCall(() => memoryQuery.find())
		if (!memoryRead.ok) return memoryRead
		if (memoryRead.value === null) return { ok: false, error: { type: 'not-found', resource: 'memory' as const, id: input.memoryId } }
		const memory = stored(memoryPipe, memoryRead.value)
		if (!memory.ok) return memory
		const query = context.storage
			.on(memoryRevisionSchema)
			.all()
			.where((q) => q.eq(memoryRevisionSchema.fields.memoryId, input.memoryId))
		const read = await storageCall(() => query.find())
		if (!read.ok) return read
		const revisions = stored(v.array(memoryRevisionPipe), read.value)
		if (!revisions.ok) return revisions
		return { ok: true, value: revisions.value.sort((a, b) => a.version - b.version) }
	},
})
