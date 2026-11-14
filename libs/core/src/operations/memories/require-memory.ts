import type { Repo } from 'equipped/orm'

import type { StorageAdapter } from '../../dependencies'
import type { Id } from '../../domain/commons'
import { memoryPipe, memorySchema } from '../../domain/memory'
import { stored, storageCall } from '../../storage/read'

export async function requireMemory(storage: Repo<StorageAdapter>, memoryId: Id) {
	const query = storage.on(memorySchema).one().id(memoryId)
	const read = await storageCall(() => query.find())
	if (!read.ok) return read
	if (read.value === null)
		return { ok: false, error: { type: 'not-found', resource: 'memory', id: memoryId } } as const
	return stored(memoryPipe, read.value)
}
