import { v } from 'valleyed'

import { projectPipe, projectSchema } from '../../domain/project'
import { defineOperation } from '../../runtime/define-operation'
import { stored, storageCall } from '../../storage/read'

export const list = defineOperation({
	title: 'List Projects',
	description: 'List every Project.',
	input: v.eq(undefined),
	output: v.array(projectPipe),
	handler: async (_input, context) => {
		const query = context.storage.on(projectSchema).all()
		const projects = await storageCall(() => query.find())
		if (!projects.ok) return projects
		const parsed = stored(v.array(projectPipe), projects.value)
		if (!parsed.ok) return parsed
		return { ok: true, value: parsed.value.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) }
	},
})
