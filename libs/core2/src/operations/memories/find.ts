import { v } from 'valleyed'

import { memoryPipe, memorySchema } from '../../domain/memory'
import { notFoundPipe } from '../../errors'
import { defineOperation } from '../../runtime/define-operation'
import { stored, storageCall } from '../../storage/read'

export const find = defineOperation({
	title: 'Find Memory',
	description: 'Find one compact Memory by its identity.',
	input: v.object({ memoryId: memorySchema.fields.id.pipe }),
	output: memoryPipe,
	error: v.merge(notFoundPipe, v.object({ resource: v.eq('memory') })),
	handler: async (input, context) => {
		const query = context.storage.on(memorySchema).one().id(input.memoryId)
		const read = await storageCall(() => query.find())
		if (!read.ok) return read
		if (read.value === null) return { ok: false, error: { type: 'not-found', resource: 'memory' as const, id: input.memoryId } }
		return stored(memoryPipe, read.value)
	},
})
