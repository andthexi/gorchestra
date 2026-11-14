import type { Repo } from 'equipped/orm'

import type { StorageAdapter } from '../../dependencies'
import type { Id } from '../../domain/commons'
import { projectPipe, projectSchema } from '../../domain/project'
import { stored, storageCall } from '../../storage/read'

export async function requireProject(storage: Repo<StorageAdapter>, projectId: Id) {
	const query = storage.on(projectSchema).one().id(projectId)
	const read = await storageCall(() => query.find())
	if (!read.ok) return read
	if (read.value === null)
		return { ok: false, error: { type: 'not-found', resource: 'project', id: projectId } } as const
	return stored(projectPipe, read.value)
}
