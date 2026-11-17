import { Instance } from 'equipped'
import { v } from 'valleyed'

import { projectPipe, projectSchema } from '../../domain/project'
import { defineOperation } from '../../runtime/define-operation'
import { stored, storageCall } from '../../storage/read'
import { withExplicitId } from '../../storage/schema'

export const create = defineOperation({
	title: 'Create Project',
	description: 'Create a source-control Project without child records.',
	input: v.object({ title: projectSchema.fields.title.pipe, spec: projectSchema.fields.spec.pipe }),
	output: projectPipe,
	handler: async (input, context) => {
		const id = Instance.createId()
		const query = context.storage.on(projectSchema).one()
		const created = await withExplicitId(id, () =>
			storageCall(() => query.create({ id, title: input.title, spec: input.spec, created: context.stamp })),
		)
		if (!created.ok) return created
		return stored(projectPipe, created.value)
	},
})
