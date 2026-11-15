import { v } from 'valleyed'

import { protectedStringPipe } from '../../domain/commons'
import { publicSecretPipe, secretPipe, secretSchema } from '../../domain/secret'
import { notFoundPipe } from '../../errors'
import { defineOperation } from '../../runtime/define-operation'
import { stored, storageCall } from '../../storage/read'

const resource = 'secret' as const

export const updateValue = defineOperation({
	title: 'Replace Secret value',
	description:
		'Protect a new value under an existing Secret identity, preserving its title and creation attribution.',
	input: v.object({ secretId: secretSchema.fields.id.pipe, value: protectedStringPipe }),
	output: publicSecretPipe,
	error: v.merge(notFoundPipe, v.object({ resource: v.eq(resource) })),
	handler: async (input, context) => {
		const query = context.storage.on(secretSchema).one().id(input.secretId)
		const found = await storageCall(() => query.find())
		if (!found.ok) return found
		if (found.value === null) return { ok: false, error: { type: 'not-found', resource, id: input.secretId } }
		const validated = stored(secretPipe, found.value)
		if (!validated.ok) return validated
		if (!context.secrets.matches(validated.value.value))
			return { ok: false, error: { type: 'invalid-storage-output' } }
		const encoded = context.secrets.encode(input.secretId, input.value)
		const updated = await storageCall(() => query.update({ value: encoded, valueUpdated: context.stamp }))
		if (!updated.ok) return updated
		if (updated.value === null) return { ok: false, error: { type: 'invalid-output' } }
		return { ok: true, value: updated.value }
	},
})
