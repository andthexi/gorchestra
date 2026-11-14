import { v } from 'valleyed'

import { assetPipe, assetSchema } from '../../domain/asset'
import { secretPipe, secretSchema } from '../../domain/secret'
import { notFoundPipe } from '../../errors'
import { defineOperation } from '../../runtime/define-operation'
import { storedAssets } from '../../storage/assets'
import { stored, storageCall } from '../../storage/read'

export const usages = defineOperation({
	title: 'Secret Usages',
	description: 'List every Asset currently referring to a Secret.',
	input: v.object({ secretId: secretSchema.fields.id.pipe }),
	output: v.array(assetPipe),
	error: v.merge(notFoundPipe, v.object({ resource: v.eq('secret') })),
	handler: async (input, context) => {
		const secretQuery = context.storage.on(secretSchema).one().id(input.secretId)
		const secretRead = await storageCall(() => secretQuery.find())
		if (!secretRead.ok) return secretRead
		if (secretRead.value === null)
			return { ok: false, error: { type: 'not-found', resource: 'secret' as const, id: input.secretId } }
		const secret = stored(secretPipe, secretRead.value)
		if (!secret.ok) return secret

		const query = context.storage
			.on(assetSchema)
			.all()
			.where((q) =>
				q.eq(assetSchema.fields.spec.nested('source', 'object').nested('secretId', 'string'), input.secretId),
			)
		const read = await storageCall(() => query.find())
		if (!read.ok) return read
		return storedAssets(read.value)
	},
})
