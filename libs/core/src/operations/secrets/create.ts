import { Instance } from 'equipped'
import { v } from 'valleyed'

import { protectedStringPipe } from '../../domain/commons'
import { publicSecretPipe, secretSchema } from '../../domain/secret'
import { defineOperation } from '../../runtime/define-operation'
import { storageCall } from '../../storage/read'
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
		return withExplicitId(id, () =>
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
	},
})
