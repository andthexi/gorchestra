import { v } from 'valleyed'

import { memoryRevisionPipe, memoryRevisionSchema } from '../../../domain/memory-revision'
import { notFoundPipe } from '../../../errors'
import { defineOperation } from '../../../runtime/define-operation'
import { stored, storageCall } from '../../../storage/read'

export const find = defineOperation({
	title: 'Find Memory Revision',
	description: 'Find the full immutable snapshot at an exact revision identity.',
	input: v.object({ revisionId: memoryRevisionSchema.fields.id.pipe }),
	output: memoryRevisionPipe,
	error: v.merge(notFoundPipe, v.object({ resource: v.eq('memory-revision') })),
	handler: async (input, context) => {
		const query = context.storage.on(memoryRevisionSchema).one().id(input.revisionId)
		const read = await storageCall(() => query.find())
		if (!read.ok) return read
		if (read.value === null)
			return { ok: false, error: { type: 'not-found', resource: 'memory-revision' as const, id: input.revisionId } }
		return stored(memoryRevisionPipe, read.value)
	},
})
