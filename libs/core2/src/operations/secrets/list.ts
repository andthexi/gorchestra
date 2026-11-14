import { v } from 'valleyed'

import { publicSecretPipe, secretPipe, secretSchema } from '../../domain/secret'
import { defineOperation } from '../../runtime/define-operation'
import { stored, storageCall } from '../../storage/read'

export const list = defineOperation({
	title: 'List Secrets',
	description: 'List safe metadata for every Secret.',
	input: v.eq(undefined),
	output: v.array(publicSecretPipe),
	handler: async (_input, context) => {
		const query = context.storage.on(secretSchema).all()
		const secrets = await storageCall(() => query.find())
		if (!secrets.ok) return secrets
		const parsed = stored(v.array(secretPipe), secrets.value)
		if (!parsed.ok) return parsed
		return { ok: true, value: parsed.value.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) }
	},
})
