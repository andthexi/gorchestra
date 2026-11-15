import { v } from 'valleyed'

import { assetPipe, assetSchema } from '../../../domain/asset'
import { notFoundPipe } from '../../../errors'
import { defineOperation } from '../../../runtime/define-operation'
import { stored, storageCall } from '../../../storage/read'
import { requireProject } from '../require-project'

export const find = defineOperation({
	title: 'Find Asset',
	description: 'Find an Asset owned by the required Project.',
	input: v.object({ projectId: assetSchema.fields.projectId.pipe, assetId: assetSchema.fields.id.pipe }),
	output: assetPipe,
	error: v.merge(notFoundPipe, v.object({ resource: v.in(['project', 'asset']) })),
	handler: async (input, context) => {
		const project = await requireProject(context.storage, input.projectId)
		if (!project.ok) return project
		const query = context.storage.on(assetSchema).one().id(input.assetId)
		const read = await storageCall(() => query.find())
		if (!read.ok) return read
		if (read.value === null)
			return { ok: false, error: { type: 'not-found', resource: 'asset' as const, id: input.assetId } }
		const asset = stored(assetPipe, read.value)
		if (!asset.ok) return asset
		if (asset.value.projectId !== input.projectId)
			return { ok: false, error: { type: 'not-found', resource: 'asset' as const, id: input.assetId } }
		return asset
	},
})
