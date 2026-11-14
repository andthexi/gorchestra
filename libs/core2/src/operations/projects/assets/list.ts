import { v } from 'valleyed'

import { assetPipe, assetSchema } from '../../../domain/asset'
import { projectPipe, projectSchema } from '../../../domain/project'
import { notFoundPipe } from '../../../errors'
import { defineOperation } from '../../../runtime/define-operation'
import { stored, storageCall } from '../../../storage/read'

export const list = defineOperation({
	title: 'List Assets',
	description: 'List every Asset owned by the required Project.',
	input: v.object({ projectId: assetSchema.fields.projectId.pipe }),
	output: v.array(assetPipe),
	error: v.merge(notFoundPipe, v.object({ resource: v.eq('project') })),
	handler: async (input, context) => {
		const projectQuery = context.storage.on(projectSchema).one().id(input.projectId)
		const projectRead = await storageCall(() => projectQuery.find())
		if (!projectRead.ok) return projectRead
		if (projectRead.value === null)
			return { ok: false, error: { type: 'not-found', resource: 'project' as const, id: input.projectId } }
		const project = stored(projectPipe, projectRead.value)
		if (!project.ok) return project
		const query = context.storage
			.on(assetSchema)
			.all()
			.where((q) => q.eq(assetSchema.fields.projectId, input.projectId))
		const read = await storageCall(() => query.find())
		if (!read.ok) return read
		const assets = stored(v.array(assetPipe), read.value)
		if (!assets.ok) return assets
		return { ok: true, value: assets.value.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) }
	},
})
