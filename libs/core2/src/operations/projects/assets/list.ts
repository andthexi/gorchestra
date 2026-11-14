import { v } from 'valleyed'

import { assetPipe, assetSchema } from '../../../domain/asset'
import { notFoundPipe } from '../../../errors'
import { defineOperation } from '../../../runtime/define-operation'
import { storedAssets } from '../../../storage/assets'
import { storageCall } from '../../../storage/read'
import { requireProject } from '../require-project'

export const list = defineOperation({
	title: 'List Assets',
	description: 'List every Asset owned by the required Project.',
	input: v.object({ projectId: assetSchema.fields.projectId.pipe }),
	output: v.array(assetPipe),
	error: v.merge(notFoundPipe, v.object({ resource: v.eq('project') })),
	handler: async (input, context) => {
		const project = await requireProject(context.storage, input.projectId)
		if (!project.ok) return project
		const query = context.storage
			.on(assetSchema)
			.all()
			.where((q) => q.eq(assetSchema.fields.projectId, input.projectId))
		const read = await storageCall(() => query.find())
		if (!read.ok) return read
		return storedAssets(read.value)
	},
})
