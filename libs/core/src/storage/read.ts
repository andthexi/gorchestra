import { v, type Pipe } from 'valleyed'

import type { Result, SharedOperationError, StorageOperationFailedError } from '../errors'

export async function storageCall<T>(call: () => Promise<T>): Promise<Result<T, StorageOperationFailedError>> {
	try {
		return { ok: true, value: await call() }
	} catch {
		return { ok: false, error: { type: 'storage-operation-failed' } }
	}
}

export function stored<I, O>(
	pipe: Pipe<I, O>,
	value: unknown,
): Result<O, Extract<SharedOperationError, { type: 'invalid-storage-output' }>> {
	const parsed = v.validate(pipe, value)
	return parsed.valid ? { ok: true, value: parsed.value } : { ok: false, error: { type: 'invalid-storage-output' } }
}
