import { v } from 'valleyed'

import { projectPipe, projectSchema } from '../../domain/project'
import { notFoundPipe } from '../../errors'
import { defineOperation } from '../../runtime/define-operation'
import { stored, storageCall } from '../../storage/read'

const resource = 'project' as const

export const find = defineOperation({
	title: 'Find Project',
	description: 'Find one Project by its identity.',
	input: v.object({ projectId: projectSchema.fields.id.pipe }),
	output: projectPipe,
	error: v.merge(notFoundPipe, v.object({ resource: v.eq(resource) })),
	handler: async (input, context) => {
		const query = context.storage.on(projectSchema).one().id(input.projectId)
		const project = await storageCall(() => query.find())
		if (!project.ok) return project
		if (project.value === null) return { ok: false, error: { type: 'not-found', resource, id: input.projectId } }
		return stored(projectPipe, project.value)
	},
})
