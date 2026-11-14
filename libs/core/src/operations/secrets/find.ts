import { v } from 'valleyed'

import { publicSecretPipe, secretPipe, secretSchema } from '../../domain/secret'
import { notFoundPipe } from '../../errors'
import { defineOperation } from '../../runtime/define-operation'
import { stored, storageCall } from '../../storage/read'

const resource = 'secret' as const

export const find = defineOperation({
	title: 'Find Secret',
	description: 'Find safe metadata for one Secret by its identity.',
	input: v.object({ secretId: secretSchema.fields.id.pipe }),
	output: publicSecretPipe,
	error: v.merge(notFoundPipe, v.object({ resource: v.eq(resource) })),
	handler: async (input, context) => {
		const query = context.storage.on(secretSchema).one().id(input.secretId)
		const secret = await storageCall(() => query.find())
		if (!secret.ok) return secret
		if (secret.value === null) return { ok: false, error: { type: 'not-found', resource, id: input.secretId } }
		return stored(secretPipe, secret.value)
	},
})
