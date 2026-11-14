import { Instance } from 'equipped'
import { v } from 'valleyed'

import { memoryPipe, memorySchema } from '../../../domain/memory'
import { memoryRevisionPipe, memoryRevisionSchema } from '../../../domain/memory-revision'
import { notFoundPipe, revisionConflictPipe, revisionVersionExhaustedPipe } from '../../../errors'
import { defineOperation } from '../../../runtime/define-operation'
import { stored, storageCall } from '../../../storage/read'
import { withExplicitId } from '../../../storage/schema'

export const create = defineOperation({
	title: 'Create Memory Revision',
	description: 'Append an immutable snapshot and conditionally advance its Memory summary.',
	input: v.object({
		memoryId: memorySchema.fields.id.pipe,
		expectedVersion: memoryRevisionSchema.fields.version.pipe,
		title: memoryRevisionSchema.fields.title.pipe,
		body: memoryRevisionSchema.fields.body.pipe,
	}),
	output: v.object({ memory: memoryPipe, revision: memoryRevisionPipe }),
	error: v.or([
		v.merge(notFoundPipe, v.object({ resource: v.eq('memory') })),
		revisionConflictPipe,
		revisionVersionExhaustedPipe,
	]),
	handler: async (input, context) => {
		const query = context.storage.on(memorySchema).one().id(input.memoryId)
		const read = await storageCall(() => query.find())
		if (!read.ok) return read
		if (read.value === null)
			return { ok: false, error: { type: 'not-found', resource: 'memory' as const, id: input.memoryId } }
		const current = stored(memoryPipe, read.value)
		if (!current.ok) return current
		if (current.value.revision.version !== input.expectedVersion)
			return {
				ok: false,
				error: { type: 'revision-conflict', memoryId: input.memoryId, expectedVersion: input.expectedVersion },
			}
		if (current.value.revision.version === Number.MAX_SAFE_INTEGER)
			return { ok: false, error: { type: 'revision-version-exhausted' } }
		const revisionId = Instance.createId()
		const summary = { id: revisionId, version: current.value.revision.version + 1, title: input.title }
		const update = await storageCall(() =>
			context.storage
				.on(memorySchema)
				.all()
				.where((filter) =>
					filter
						.eq(memorySchema.fields.id, input.memoryId)
						.eq(memorySchema.fields.revision.nested('version', 'number'), input.expectedVersion),
				)
				.update({ revision: summary }),
		)
		if (!update.ok) return update
		const matched = stored(v.array(memoryPipe), update.value)
		if (!matched.ok) return matched
		if (matched.value.length === 0)
			return {
				ok: false,
				error: { type: 'revision-conflict', memoryId: input.memoryId, expectedVersion: input.expectedVersion },
			}
		const [memory] = matched.value
		if (matched.value.length !== 1 || memory === undefined)
			return { ok: false, error: { type: 'invalid-storage-output' } }
		const revisionQuery = context.storage.on(memoryRevisionSchema).one()
		const revision = await withExplicitId(revisionId, () =>
			storageCall(() =>
				revisionQuery.create({
					...summary,
					memoryId: input.memoryId,
					body: input.body,
					created: context.stamp,
				}),
			),
		)
		if (!revision.ok) return revision
		return { ok: true, value: { memory, revision: revision.value } }
	},
})
