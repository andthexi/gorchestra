import { EquippedError } from 'equipped/errors'

import type { Result, StorageOperationFailedError } from '../errors'
import type { Owner } from './owner'

export async function transaction<T, E>(
	owner: Owner,
	work: () => Promise<Result<T, E>>,
): Promise<Result<T, E | StorageOperationFailedError>> {
	const abort = new Error('Core operation aborted')
	let retained: Result<T, E> | undefined
	try {
		await owner.repo.session(async () => {
			retained = await work()
			if (!retained.ok) throw abort
		})
		if (retained?.ok) return retained
		owner.closeAdmission()
		return { ok: false, error: { type: 'storage-operation-failed' } }
	} catch (error) {
		if (
			retained &&
			!retained.ok &&
			(error === abort ||
				(error instanceof EquippedError && error.context.operation === 'session' && error.cause === abort))
		)
			return retained
		if (retained && !retained.ok) owner.closeAdmission()
		return { ok: false, error: { type: 'storage-operation-failed' } }
	}
}
