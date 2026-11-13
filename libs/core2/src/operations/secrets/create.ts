import { Instance } from 'equipped'
import { v } from 'valleyed'

import { protectedStringPipe } from '../../domain/commons'
import { publicSecretPipe, secretSchema } from '../../domain/secret'
import { secretEncodingFailedPipe } from '../../errors'
import { defineOperation } from '../../runtime/define-operation'
import { storageCall } from '../../storage/read'
import { withExplicitId } from '../../storage/schema'

export const create = defineOperation({
	title: 'Create Secret',
	description: 'Protect a raw Secret value and create its safe metadata.',
	input: v.object({ title: secretSchema.fields.title.pipe, value: protectedStringPipe }),
	output: publicSecretPipe,
	error: secretEncodingFailedPipe,
	handler: async (input, context) => {
		const id = Instance.createId()
		const encoded = await context.secrets.encode({ secretId: id, value: input.value })
		if (!encoded.ok) return encoded
		const query = context.storage.on(secretSchema).one()
		return withExplicitId(id, () =>
			storageCall(() =>
				query.create({
					id,
					title: input.title,
					valueRef: encoded.value,
					created: context.stamp,
					valueUpdated: context.stamp,
				}),
			),
		)
	},
})
