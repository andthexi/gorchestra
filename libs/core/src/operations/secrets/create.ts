import { Instance } from 'equipped'
import { v } from 'valleyed'

import { protectedStringPipe } from '../../domain/commons'
import { publicSecretPipe, secretPipe, secretSchema } from '../../domain/secret'
import { defineOperation } from '../../runtime/define-operation'
import { stored, storageCall } from '../../storage/read'
import { withExplicitId } from '../../storage/schema'

export const create = defineOperation({
	title: 'Create Secret',
	description: 'Protect a raw Secret value and create its safe metadata.',
	input: v.object({ title: secretSchema.fields.title.pipe, value: protectedStringPipe }),
	output: publicSecretPipe,
	handler: async (input, context) => {
		const id = Instance.createId()
		const encoded = context.secrets.encode(id, input.value)
		const query = context.storage.on(secretSchema).one()
		const created = await withExplicitId(id, () =>
			storageCall(() =>
				query.create({
					id,
					title: input.title,
					value: encoded,
					created: context.stamp,
					valueUpdated: context.stamp,
				}),
			),
		)
		if (!created.ok) return created
		const record = stored(secretPipe, created.value)
		if (!record.ok) return record
		if (!context.secrets.matches(record.value.value))
			return { ok: false, error: { type: 'invalid-storage-output' } }
		return {
			ok: true,
			value: {
				id: record.value.id,
				title: record.value.title,
				created: record.value.created,
				valueUpdated: record.value.valueUpdated,
			},
		}
	},
})
