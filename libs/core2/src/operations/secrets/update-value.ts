import { v } from 'valleyed'

import { protectedStringPipe } from '../../domain/commons'
import { publicSecretPipe, secretPipe, secretSchema } from '../../domain/secret'
import { notFoundPipe, secretEncodingFailedPipe } from '../../errors'
import { defineOperation } from '../../runtime/define-operation'
import { stored, storageCall } from '../../storage/read'

const resource = 'secret' as const

export const updateValue = defineOperation({
	title: 'Replace Secret value',
	description: 'Protect a new value under an existing Secret identity, preserving its title and creation attribution.',
	input: v.object({ secretId: secretSchema.fields.id.pipe, value: protectedStringPipe }),
	output: publicSecretPipe,
	error: v.or([v.merge(notFoundPipe, v.object({ resource: v.eq(resource) })), secretEncodingFailedPipe]),
	handler: async (input, context) => {
		const query = context.storage.on(secretSchema).one().id(input.secretId)
		const secret = await storageCall(() => query.find())
		if (!secret.ok) return secret
		if (secret.value === null) return { ok: false, error: { type: 'not-found', resource, id: input.secretId } }
		const validated = stored(secretPipe, secret.value)
		if (!validated.ok) return validated
		const encoded = await context.secrets.encode(input)
		if (!encoded.ok) return encoded
		const updated = await storageCall(() => query.update({ valueRef: encoded.value, valueUpdated: context.stamp }))
		if (!updated.ok) return updated
		if (updated.value === null) return { ok: false, error: { type: 'invalid-output' } }
		return { ok: true, value: updated.value }
	},
})
